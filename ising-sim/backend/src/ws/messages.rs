use serde::Deserialize;
use serde::Serialize;

pub const PROTOCOL_VERSION: u32 = 1;

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    Init {
        width: Option<usize>,
        height: Option<usize>,
        geometry: Option<String>,
        temperature: Option<f64>,
        field: Option<f64>,
        coupling: Option<f64>,
        seed: Option<u64>,
    },
    Start {
        steps_per_tick: Option<u64>,
    },
    Pause,
    Step {
        sweeps: u64,
    },
    SetParams {
        temperature: Option<f64>,
        field: Option<f64>,
        coupling: Option<f64>,
    },
    GetState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    Ready {
        protocol_version: u32,
    },
    State {
        spins: Vec<i8>,
        width: usize,
        height: usize,
        step: u64,
        geometry: String,
    },
    Metrics {
        energy: f64,
        magnetization: f64,
        acceptance_rate: Option<f64>,
        temperature: f64,
        field: f64,
        coupling: f64,
    },
    Error {
        message: String,
        code: Option<String>,
    },
}

impl ServerMessage {
    pub fn to_text(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }
}
