use crate::session::SimulationSession;
use crate::ws::handler::{error_to_message, handle_client_message, metrics_to_message};
use crate::ws::messages::{ServerMessage, PROTOCOL_VERSION};
use axum::Router;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::http::HeaderValue;
use axum::response::IntoResponse;
use axum::routing::get;
use futures_util::{SinkExt, StreamExt};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::time::{MissedTickBehavior, interval};
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn};

#[derive(Clone)]
pub struct AppState {
    pub tick_ms: u64,
}

impl Default for AppState {
    fn default() -> Self {
        Self { tick_ms: 50 }
    }
}

pub async fn run_server(addr: SocketAddr) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(cors_layer())
        .with_state(AppState::default());

    let listener = TcpListener::bind(addr).await?;
    info!("WebSocket server listening on ws://{addr}/ws");

    axum::serve(listener, app).await?;
    Ok(())
}

fn cors_layer() -> CorsLayer {
    match std::env::var("CORS_ALLOW_ORIGIN") {
        Ok(origin) if !origin.is_empty() => {
            let header = HeaderValue::from_str(&origin)
                .expect("CORS_ALLOW_ORIGIN must be a valid header value");
            CorsLayer::new().allow_origin(header)
        }
        _ => CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    }
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    info!("websocket client connected");
    let (mut sender, mut receiver) = socket.split();
    let mut session: Option<SimulationSession> = None;
    let mut tick = interval(Duration::from_millis(state.tick_ms));
    tick.set_missed_tick_behavior(MissedTickBehavior::Skip);

    if send_message(
        &mut sender,
        &ServerMessage::Ready {
            protocol_version: PROTOCOL_VERSION,
        },
    )
    .await
    .is_err()
    {
        return;
    }

    loop {
        let running = session.as_ref().is_some_and(SimulationSession::is_running);

        tokio::select! {
            incoming = receiver.next() => {
                match incoming {
                    Some(Ok(Message::Text(text))) => {
                        for response in handle_client_message(&mut session, &text) {
                            if send_message(&mut sender, &response).await.is_err() {
                                warn!("failed to send websocket response; closing connection");
                                return;
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        info!("websocket client disconnected");
                        return;
                    }
                    Some(Err(error)) => {
                        warn!(?error, "websocket receive error; closing connection");
                        return;
                    }
                    _ => {}
                }
            }
            _ = tick.tick(), if running => {
                if let Some(session) = session.as_mut() {
                    match session.run_sweeps(session.sweeps_per_tick()) {
                        Ok(_) => {
                            if send_message(
                                &mut sender,
                                &metrics_to_message(session.metrics()),
                            ).await.is_err() {
                                warn!("failed to send tick metrics; closing connection");
                                return;
                            }
                        }
                        Err(error) => {
                            session.pause();
                            warn!(?error, "auto tick failed; pausing session");
                            if send_message(
                                &mut sender,
                                &error_to_message(error),
                            ).await.is_err() {
                                warn!("failed to send tick error; closing connection");
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
}

async fn send_message(
    sender: &mut futures_util::stream::SplitSink<WebSocket, Message>,
    message: &ServerMessage,
) -> Result<(), axum::Error> {
    let text = message
        .to_text()
        .map_err(|error| axum::Error::new(std::io::Error::new(std::io::ErrorKind::InvalidData, error)))?;
    sender.send(Message::Text(text.into())).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ws::messages::PROTOCOL_VERSION;
    use futures_util::{SinkExt, StreamExt};
    use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};

    async fn spawn_test_server() -> SocketAddr {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(async move {
            let app = Router::new()
                .route("/ws", get(ws_handler))
                .with_state(AppState::default());
            axum::serve(listener, app).await.unwrap();
        });

        tokio::time::sleep(Duration::from_millis(50)).await;
        addr
    }

    #[tokio::test]
    async fn websocket_init_and_step() {
        let addr = spawn_test_server().await;
        let (mut ws, _) = connect_async(format!("ws://{addr}/ws"))
            .await
            .expect("connect to websocket");

        let ready: ServerMessage = serde_json::from_str(
            &ws.next()
                .await
                .expect("ready frame")
                .expect("ready ok")
                .into_text()
                .expect("ready text"),
        )
        .unwrap();
        assert!(matches!(
            ready,
            ServerMessage::Ready {
                protocol_version: PROTOCOL_VERSION
            }
        ));

        ws.send(WsMessage::Text(
            r#"{"type":"init","temperature":2.5,"field":0.0,"coupling":1.0,"seed":7}"#.into(),
        ))
        .await
        .unwrap();

        let state: ServerMessage =
            serde_json::from_str(&ws.next().await.unwrap().unwrap().into_text().unwrap()).unwrap();
        assert!(matches!(
            state,
            ServerMessage::State {
                width: 16,
                height: 16,
                step: 0,
                ..
            }
        ));

        let _metrics = ws.next().await.unwrap().unwrap();

        ws.send(WsMessage::Text(r#"{"type":"step","sweeps":5}"#.into()))
            .await
            .unwrap();

        let state: ServerMessage =
            serde_json::from_str(&ws.next().await.unwrap().unwrap().into_text().unwrap()).unwrap();
        assert!(matches!(state, ServerMessage::State { step: 5, .. }));
    }

    #[tokio::test]
    async fn websocket_init_periodic_geometry() {
        let addr = spawn_test_server().await;
        let (mut ws, _) = connect_async(format!("ws://{addr}/ws"))
            .await
            .expect("connect to websocket");

        let _ready = ws.next().await.unwrap().unwrap();

        ws.send(WsMessage::Text(
            r#"{"type":"init","geometry":"square_2d_periodic","temperature":2.5,"field":0.0,"coupling":1.0}"#.into(),
        ))
        .await
        .unwrap();

        let state: ServerMessage =
            serde_json::from_str(&ws.next().await.unwrap().unwrap().into_text().unwrap()).unwrap();
        assert!(matches!(
            state,
            ServerMessage::State {
                geometry,
                ..
            } if geometry == "square_2d_periodic"
        ));
    }

    #[tokio::test]
    async fn websocket_init_custom_lattice_size() {
        let addr = spawn_test_server().await;
        let (mut ws, _) = connect_async(format!("ws://{addr}/ws"))
            .await
            .expect("connect to websocket");

        let _ready = ws.next().await.unwrap().unwrap();

        ws.send(WsMessage::Text(
            r#"{"type":"init","width":8,"height":10,"temperature":2.5,"field":0.0,"coupling":1.0}"#.into(),
        ))
        .await
        .unwrap();

        let state: ServerMessage =
            serde_json::from_str(&ws.next().await.unwrap().unwrap().into_text().unwrap()).unwrap();
        assert!(matches!(
            state,
            ServerMessage::State {
                width: 8,
                height: 10,
                spins,
                ..
            } if spins.len() == 80
        ));
    }

    #[tokio::test]
    async fn websocket_running_tick_sends_metrics_only() {
        let addr = spawn_test_server().await;
        let (mut ws, _) = connect_async(format!("ws://{addr}/ws"))
            .await
            .expect("connect to websocket");

        let _ready = ws.next().await.unwrap().unwrap();
        ws.send(WsMessage::Text(
            r#"{"type":"init","temperature":2.5,"field":0.0,"coupling":1.0,"seed":1}"#.into(),
        ))
        .await
        .unwrap();
        let _state = ws.next().await.unwrap().unwrap();
        let _metrics = ws.next().await.unwrap().unwrap();

        ws.send(WsMessage::Text(r#"{"type":"start","steps_per_tick":1}"#.into()))
            .await
            .unwrap();
        let _start_metrics = ws.next().await.unwrap().unwrap();

        tokio::time::sleep(Duration::from_millis(120)).await;

        let tick_message: ServerMessage = serde_json::from_str(
            &ws.next()
                .await
                .expect("tick frame")
                .expect("tick ok")
                .into_text()
                .expect("tick text"),
        )
        .unwrap();
        assert!(matches!(tick_message, ServerMessage::Metrics { .. }));
    }
}
