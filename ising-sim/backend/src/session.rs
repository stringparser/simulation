use crate::config::SimConfig;
use crate::config::SimInitParams;
use crate::error::SimulationError;
use crate::geometry::{Geometry, LatticeGeometry};
use crate::interaction::NearestNeighbor;
use crate::lattice::Lattice;
use crate::metrics::{energy, magnetization};
use crate::monte_carlo::{SweepStats, sweep};
use rand::SeedableRng;
use rand::rngs::StdRng;

#[derive(Debug, Clone)]
pub struct SessionSnapshot {
    pub spins: Vec<i8>,
    pub width: usize,
    pub height: usize,
    pub step: u64,
    pub geometry: String,
}

#[derive(Debug, Clone, Copy)]
pub struct SessionMetrics {
    pub energy: f64,
    pub magnetization: f64,
    pub acceptance_rate: Option<f64>,
    pub temperature: f64,
    pub field: f64,
    pub coupling: f64,
}

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

impl SimulationSession {
    pub fn new(params: SimInitParams) -> Result<Self, SimulationError> {
        let config = params.into_config()?;
        let geometry = LatticeGeometry::from_name(&config.geometry, config.width, config.height)?;
        let interaction = NearestNeighbor::new(config.coupling);
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
    ) -> Result<(), SimulationError> {
        if let Some(t) = temperature {
            if t <= 0.0 {
                return Err(SimulationError::InvalidTemperature);
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

    pub fn run_sweeps(&mut self, sweeps: u64) -> Result<SweepStats, SimulationError> {
        if sweeps == 0 {
            return Err(SimulationError::InvalidStep { sweeps });
        }

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
        Ok(total)
    }

    pub fn snapshot(&self) -> SessionSnapshot {
        SessionSnapshot {
            spins: self.lattice.spins().to_vec(),
            width: self.config.width,
            height: self.config.height,
            step: self.step,
            geometry: self.geometry.name().to_string(),
        }
    }

    pub fn metrics(&self) -> SessionMetrics {
        SessionMetrics {
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
