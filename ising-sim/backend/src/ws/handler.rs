use crate::config::SimInitParams;
use crate::error::SimulationError;
use crate::session::{SessionMetrics, SessionSnapshot, SimulationSession};
use crate::ws::messages::{ClientMessage, ServerMessage};
use smallvec::{SmallVec, smallvec};
use tracing::warn;

pub type ResponseMessages = SmallVec<[ServerMessage; 2]>;

pub fn handle_client_message(
    session: &mut Option<SimulationSession>,
    text: &str,
) -> ResponseMessages {
    let message: ClientMessage = match serde_json::from_str(text) {
        Ok(message) => message,
        Err(error) => {
            warn!(?error, "received invalid client message JSON");
            return smallvec![ServerMessage::Error {
                message: format!("invalid message: {error}"),
                code: Some("invalid_json".into()),
            }];
        }
    };

    handle_parsed_message(session, message)
}

pub fn handle_parsed_message(
    session: &mut Option<SimulationSession>,
    message: ClientMessage,
) -> ResponseMessages {
    match message {
        ClientMessage::Init {
            width,
            height,
            geometry,
            temperature,
            field,
            coupling,
            seed,
        } => init_session(
            session,
            SimInitParams {
                width,
                height,
                geometry,
                temperature,
                field,
                coupling,
                seed,
            },
        ),
        ClientMessage::Start { steps_per_tick } => {
            with_session(session, |session| {
                session.start(steps_per_tick);
                smallvec![metrics_to_message(session.metrics())]
            })
        }
        ClientMessage::Pause => with_session(session, |session| {
            session.pause();
            snapshot_to_messages(session)
        }),
        ClientMessage::Step { sweeps } => with_session(session, |session| {
            match session.run_sweeps(sweeps) {
                Ok(_) => snapshot_to_messages(session),
                Err(error) => smallvec![error_to_message(error)],
            }
        }),
        ClientMessage::SetParams {
            temperature,
            field,
            coupling,
        } => with_session(session, |session| {
            match session.set_params(temperature, field, coupling) {
                Ok(()) => smallvec![metrics_to_message(session.metrics())],
                Err(error) => smallvec![error_to_message(error)],
            }
        }),
        ClientMessage::GetState => with_session(session, snapshot_to_messages),
    }
}

fn init_session(
    session: &mut Option<SimulationSession>,
    params: SimInitParams,
) -> ResponseMessages {
    match SimulationSession::new(params) {
        Ok(new_session) => {
            let mut new_session = new_session;
            let messages = snapshot_to_messages(&mut new_session);
            *session = Some(new_session);
            messages
        }
        Err(error) => smallvec![error_to_message(error)],
    }
}

fn with_session(
    session: &mut Option<SimulationSession>,
    f: impl FnOnce(&mut SimulationSession) -> ResponseMessages,
) -> ResponseMessages {
    match session {
        Some(session) => f(session),
        None => smallvec![error_to_message(SimulationError::NotInitialized)],
    }
}

fn snapshot_to_messages(session: &mut SimulationSession) -> ResponseMessages {
    smallvec![
        state_to_message(session.snapshot()),
        metrics_to_message(session.metrics()),
    ]
}

pub fn state_to_message(snapshot: &SessionSnapshot) -> ServerMessage {
    ServerMessage::State {
        spins: snapshot.spins.clone(),
        width: snapshot.width,
        height: snapshot.height,
        step: snapshot.step,
        geometry: snapshot.geometry.as_str().to_string(),
    }
}

pub fn metrics_to_message(metrics: SessionMetrics) -> ServerMessage {
    ServerMessage::Metrics {
        energy: metrics.energy,
        magnetization: metrics.magnetization,
        acceptance_rate: metrics.acceptance_rate,
        temperature: metrics.temperature,
        field: metrics.field,
        coupling: metrics.coupling,
    }
}

pub fn error_to_message(error: SimulationError) -> ServerMessage {
    ServerMessage::Error {
        message: error.to_string(),
        code: Some(error.code().into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{DEFAULT_LATTICE_HEIGHT, DEFAULT_LATTICE_WIDTH};

    #[test]
    fn init_rejects_invalid_lattice_size() {
        let mut session = None;
        let messages = handle_parsed_message(
            &mut session,
            ClientMessage::Init {
                width: Some(2),
                height: Some(16),
                geometry: None,
                temperature: None,
                field: None,
                coupling: None,
                seed: None,
            },
        );

        assert!(session.is_none());
        assert!(matches!(
            messages[0],
            ServerMessage::Error {
                code: Some(ref code),
                ..
            } if code == "invalid_lattice_size"
        ));
    }

    #[test]
    fn init_accepts_custom_lattice_size() {
        let mut session = None;
        let messages = handle_parsed_message(
            &mut session,
            ClientMessage::Init {
                width: Some(8),
                height: Some(12),
                geometry: None,
                temperature: None,
                field: None,
                coupling: None,
                seed: Some(1),
            },
        );

        assert!(session.is_some());
        assert!(matches!(
            messages[0],
            ServerMessage::State {
                width: 8,
                height: 12,
                ..
            }
        ));
    }

    #[test]
    fn step_requires_initialized_session() {
        let mut session = None;
        let messages = handle_parsed_message(
            &mut session,
            ClientMessage::Step { sweeps: 1 },
        );

        assert!(matches!(
            messages[0],
            ServerMessage::Error {
                code: Some(ref code),
                ..
            } if code == "not_initialized"
        ));
    }

    #[test]
    fn default_init_uses_16_by_16() {
        let mut session = None;
        let messages = handle_parsed_message(
            &mut session,
            ClientMessage::Init {
                width: None,
                height: None,
                geometry: None,
                temperature: None,
                field: None,
                coupling: None,
                seed: None,
            },
        );

        assert!(matches!(
            messages[0],
            ServerMessage::State {
                width: DEFAULT_LATTICE_WIDTH,
                height: DEFAULT_LATTICE_HEIGHT,
                ..
            }
        ));
    }
}
