pub mod config;
pub mod error;
pub mod geometry;
pub mod interaction;
pub mod lattice;
pub mod metrics;
pub mod monte_carlo;
pub mod session;
pub mod ws;

pub use config::{
    SimConfig, SimInitParams, DEFAULT_COUPLING, DEFAULT_FIELD, DEFAULT_GEOMETRY,
    DEFAULT_LATTICE_HEIGHT, DEFAULT_LATTICE_WIDTH, DEFAULT_TEMPERATURE, MAX_LATTICE_SIZE,
    MIN_LATTICE_SIZE,
};
pub use error::SimulationError;
pub use geometry::{Geometry, LatticeGeometry, Square2DOpen, Square2DPeriodic, GEOMETRY_NAMES};
pub use interaction::{Interaction, NearestNeighbor};
pub use lattice::Lattice;
pub use metrics::{energy, magnetization};
pub use monte_carlo::{SweepStats, run_sweeps, sweep};
pub use session::{SessionMetrics, SessionSnapshot, SimulationSession};
pub use ws::run_server;
