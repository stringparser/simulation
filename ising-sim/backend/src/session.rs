use serde::Deserialize;

use crate::config::SimConfig;
use crate::geometry::{Geometry, LatticeGeometry};
use crate::interaction::NearestNeighbor;
use crate::lattice::Lattice;
use crate::metrics::{energy, magnetization};
use crate::monte_carlo::{SweepStats, sweep};
use crate::ws::messages::ServerMessage;
use rand::SeedableRng;
use rand::rngs::StdRng;

#[derive(Debug)]
pub struct SimulationSession {
    geometry: LatticeGeometry,
    interaction: NearestNeighbor,
    lattice: Lattice,
    config: SimConfig,
    rng: StdRng,
    step: u64,
    running: bool,
    sweeps_per_tick: u64,
    last_acceptance_rate: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct InitParams {
    pub width: Option<usize>,
    pub height: Option<usize>,
    pub geometry: Option<String>,
    pub temperature: Option<f64>,
    pub field: Option<f64>,
    pub coupling: Option<f64>,
    pub seed: Option<u64>,
}

impl SimulationSession {
    pub fn init(params: InitParams) -> Result<Self, String> {
        let width = params.width.unwrap_or(16);
        let height = params.height.unwrap_or(16);
        if width == 0 || height == 0 {
            return Err("width and height must be positive".into());
        }

        let geometry_name = params.geometry.as_deref().unwrap_or("square_2d_open");
        let geometry = LatticeGeometry::from_name(geometry_name, width, height)?;

        let coupling = params.coupling.unwrap_or(1.0);
        let config = SimConfig {
            width,
            height,
            temperature: params.temperature.unwrap_or(2.5),
            field: params.field.unwrap_or(0.0),
            coupling,
            seed: params.seed,
        };

        let interaction = NearestNeighbor::new(coupling);
        let lattice = Lattice::new(geometry.num_sites(), config.seed);
        let rng = match config.seed {
            Some(seed) => StdRng::seed_from_u64(seed.wrapping_add(1)),
            None => StdRng::from_os_rng(),
        };

        Ok(Self {
            geometry,
            interaction,
            lattice,
            config,
            rng,
            step: 0,
            running: false,
            sweeps_per_tick: 1,
            last_acceptance_rate: None,
        })
    }

    pub fn is_initialized(&self) -> bool {
        true
    }

    pub fn start(&mut self, steps_per_tick: Option<u64>) {
        self.sweeps_per_tick = steps_per_tick.unwrap_or(1).max(1);
        self.running = true;
    }

    pub fn pause(&mut self) {
        self.running = false;
    }

    pub fn is_running(&self) -> bool {
        self.running
    }

    pub fn sweeps_per_tick(&self) -> u64 {
        self.sweeps_per_tick
    }

    pub fn set_params(
        &mut self,
        temperature: Option<f64>,
        field: Option<f64>,
        coupling: Option<f64>,
    ) -> Result<(), String> {
        if let Some(t) = temperature {
            if t <= 0.0 {
                return Err("temperature must be positive".into());
            }
            self.config.temperature = t;
        }
        if let Some(h) = field {
            self.config.field = h;
        }
        if let Some(j) = coupling {
            self.config.coupling = j;
            self.interaction = NearestNeighbor::new(j);
        }
        Ok(())
    }

    pub fn run_sweeps(&mut self, sweeps: u64) -> SweepStats {
        let mut total = SweepStats::default();
        for _ in 0..sweeps {
            let stats = sweep(
                &mut self.lattice,
                &self.geometry,
                &self.interaction,
                &self.config,
                &mut self.rng,
            );
            total.attempts += stats.attempts;
            total.acceptances += stats.acceptances;
            self.step += 1;
        }
        self.last_acceptance_rate = Some(total.acceptance_rate());
        total
    }

    pub fn state_message(&self) -> ServerMessage {
        ServerMessage::State {
            spins: self.lattice.spins().to_vec(),
            width: self.config.width,
            height: self.config.height,
            step: self.step,
            geometry: self.geometry.name().to_string(),
        }
    }

    pub fn metrics_message(&self) -> ServerMessage {
        ServerMessage::Metrics {
            energy: energy(
                &self.lattice,
                &self.geometry,
                &self.interaction,
                &self.config,
            ),
            magnetization: magnetization(&self.lattice),
            acceptance_rate: self.last_acceptance_rate,
            temperature: self.config.temperature,
            field: self.config.field,
            coupling: self.config.coupling,
        }
    }
}
