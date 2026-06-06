use crate::session::{InitParams, SimulationSession};
use crate::ws::messages::{ClientMessage, ServerMessage, PROTOCOL_VERSION};
use axum::Router;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use axum::routing::get;
use futures_util::{SinkExt, StreamExt};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::time::{MissedTickBehavior, interval};
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

#[derive(Clone)]
struct AppState {
    tick_ms: u64,
}

pub async fn run_server(addr: SocketAddr) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let state = AppState { tick_ms: 50 };

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let listener = TcpListener::bind(addr).await?;
    info!("WebSocket server listening on ws://{addr}/ws");

    axum::serve(listener, app).await?;
    Ok(())
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut session: Option<SimulationSession> = None;
    let mut tick = interval(Duration::from_millis(state.tick_ms));
    tick.set_missed_tick_behavior(MissedTickBehavior::Skip);

    let ready = ServerMessage::Ready {
        protocol_version: PROTOCOL_VERSION,
    };
    if send_message(&mut sender, &ready).await.is_err() {
        return;
    }

    loop {
        let running = session.as_ref().is_some_and(SimulationSession::is_running);

        tokio::select! {
            incoming = receiver.next() => {
                match incoming {
                    Some(Ok(Message::Text(text))) => {
                        let responses = handle_client_text(&mut session, &text);
                        for response in responses {
                            if send_message(&mut sender, &response).await.is_err() {
                                return;
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => return,
                    Some(Err(_)) => return,
                    _ => {}
                }
            }
            _ = tick.tick(), if running => {
                if let Some(session) = session.as_mut() {
                    let sweeps = session.sweeps_per_tick();
                    session.run_sweeps(sweeps);
                    let metrics = session.metrics_message();
                    let state_msg = session.state_message();
                    if send_message(&mut sender, &metrics).await.is_err() {
                        return;
                    }
                    if send_message(&mut sender, &state_msg).await.is_err() {
                        return;
                    }
                }
            }
        }
    }
}

fn handle_client_text(
    session: &mut Option<SimulationSession>,
    text: &str,
) -> Vec<ServerMessage> {
    let message: ClientMessage = match serde_json::from_str(text) {
        Ok(message) => message,
        Err(error) => {
            return vec![ServerMessage::Error {
                message: format!("invalid message: {error}"),
                code: Some("invalid_json".into()),
            }];
        }
    };

    match message {
        ClientMessage::Init {
            width,
            height,
            geometry,
            temperature,
            field,
            coupling,
            seed,
        } => match SimulationSession::init(InitParams {
            width,
            height,
            geometry,
            temperature,
            field,
            coupling,
            seed,
        }) {
            Ok(new_session) => {
                let state = new_session.state_message();
                let metrics = new_session.metrics_message();
                *session = Some(new_session);
                vec![state, metrics]
            }
            Err(message) => vec![ServerMessage::Error {
                message,
                code: Some("init_failed".into()),
            }],
        },
        ClientMessage::Start { steps_per_tick } => {
            let Some(session) = session.as_mut() else {
                return vec![not_initialized_error()];
            };
            session.start(steps_per_tick);
            vec![session.metrics_message()]
        }
        ClientMessage::Pause => {
            let Some(session) = session.as_mut() else {
                return vec![not_initialized_error()];
            };
            session.pause();
            vec![session.state_message(), session.metrics_message()]
        }
        ClientMessage::Step { sweeps } => {
            let Some(session) = session.as_mut() else {
                return vec![not_initialized_error()];
            };
            if sweeps == 0 {
                return vec![ServerMessage::Error {
                    message: "sweeps must be at least 1".into(),
                    code: Some("invalid_step".into()),
                }];
            }
            session.run_sweeps(sweeps);
            vec![session.state_message(), session.metrics_message()]
        }
        ClientMessage::SetParams {
            temperature,
            field,
            coupling,
        } => {
            let Some(session) = session.as_mut() else {
                return vec![not_initialized_error()];
            };
            match session.set_params(temperature, field, coupling) {
                Ok(()) => vec![session.metrics_message()],
                Err(message) => vec![ServerMessage::Error {
                    message,
                    code: Some("invalid_params".into()),
                }],
            }
        }
        ClientMessage::GetState => {
            let Some(session) = session.as_ref() else {
                return vec![not_initialized_error()];
            };
            vec![session.state_message(), session.metrics_message()]
        }
    }
}

fn not_initialized_error() -> ServerMessage {
    ServerMessage::Error {
        message: "simulation not initialized; send init first".into(),
        code: Some("not_initialized".into()),
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

    #[tokio::test]
    async fn websocket_init_and_step() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(async move {
            let state = AppState { tick_ms: 50 };
            let app = Router::new()
                .route("/ws", get(ws_handler))
                .with_state(state);
            axum::serve(listener, app).await.unwrap();
        });

        tokio::time::sleep(Duration::from_millis(50)).await;

        let (mut ws, _) = connect_async(format!("ws://{addr}/ws"))
            .await
            .expect("connect to websocket");

        let ready_text = ws
            .next()
            .await
            .expect("ready frame")
            .expect("ready ok")
            .into_text()
            .expect("ready text");
        let ready: ServerMessage = serde_json::from_str(&ready_text).unwrap();
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

        let state_text = ws.next().await.unwrap().unwrap().into_text().unwrap();
        let state: ServerMessage = serde_json::from_str(&state_text).unwrap();
        let ServerMessage::State {
            spins,
            width,
            height,
            step,
            geometry,
        } = state
        else {
            panic!("expected state message");
        };
        assert_eq!(width, 16);
        assert_eq!(height, 16);
        assert_eq!(spins.len(), 256);
        assert_eq!(step, 0);
        assert_eq!(geometry, "square_2d_open");

        let metrics_text = ws.next().await.unwrap().unwrap().into_text().unwrap();
        assert!(matches!(
            serde_json::from_str::<ServerMessage>(&metrics_text).unwrap(),
            ServerMessage::Metrics { .. }
        ));

        ws.send(WsMessage::Text(r#"{"type":"step","sweeps":5}"#.into()))
            .await
            .unwrap();

        let state_text = ws.next().await.unwrap().unwrap().into_text().unwrap();
        let state: ServerMessage = serde_json::from_str(&state_text).unwrap();
        assert!(matches!(state, ServerMessage::State { step: 5, .. }));

        let metrics_text = ws.next().await.unwrap().unwrap().into_text().unwrap();
        assert!(matches!(
            serde_json::from_str::<ServerMessage>(&metrics_text).unwrap(),
            ServerMessage::Metrics { .. }
        ));
    }

    #[tokio::test]
    async fn websocket_init_periodic_geometry() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(async move {
            let state = AppState { tick_ms: 50 };
            let app = Router::new()
                .route("/ws", get(ws_handler))
                .with_state(state);
            axum::serve(listener, app).await.unwrap();
        });

        tokio::time::sleep(Duration::from_millis(50)).await;

        let (mut ws, _) = connect_async(format!("ws://{addr}/ws"))
            .await
            .expect("connect to websocket");

        let _ready = ws.next().await.unwrap().unwrap();

        ws.send(WsMessage::Text(
            r#"{"type":"init","geometry":"square_2d_periodic","temperature":2.5,"field":0.0,"coupling":1.0}"#.into(),
        ))
        .await
        .unwrap();

        let state_text = ws.next().await.unwrap().unwrap().into_text().unwrap();
        let state: ServerMessage = serde_json::from_str(&state_text).unwrap();
        assert!(matches!(
            state,
            ServerMessage::State {
                geometry,
                ..
            } if geometry == "square_2d_periodic"
        ));
    }
}
