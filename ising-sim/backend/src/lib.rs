pub mod config;
pub mod geometry;
pub mod interaction;
pub mod lattice;
pub mod metrics;
pub mod monte_carlo;
pub mod session;
pub mod ws;

pub use config::SimConfig;
pub use geometry::{Geometry, Square2DOpen};
pub use interaction::{Interaction, NearestNeighbor};
pub use lattice::Lattice;
pub use metrics::{energy, magnetization};
pub use monte_carlo::{SweepStats, run_sweeps, sweep};
pub use session::SimulationSession;
pub use ws::run_server;
