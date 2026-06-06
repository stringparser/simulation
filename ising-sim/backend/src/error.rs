#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum SimulationError {
    #[error(
        "lattice size must be between {min} and {max}, got {width}x{height}",
        min = crate::config::MIN_LATTICE_SIZE,
        max = crate::config::MAX_LATTICE_SIZE
    )]
    InvalidLatticeSize { width: usize, height: usize },

    #[error("unsupported geometry: {name}")]
    UnsupportedGeometry { name: String },

    #[error("temperature must be positive")]
    InvalidTemperature,

    #[error("sweeps must be at least 1, got {sweeps}")]
    InvalidStep { sweeps: u64 },

    #[error("simulation not initialized; send init first")]
    NotInitialized,

    #[error("spins must be +1 or -1")]
    InvalidSpins,
}

impl SimulationError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::InvalidLatticeSize { .. } => "invalid_lattice_size",
            Self::UnsupportedGeometry { .. } => "init_failed",
            Self::InvalidTemperature => "invalid_params",
            Self::InvalidStep { .. } => "invalid_step",
            Self::NotInitialized => "not_initialized",
            Self::InvalidSpins => "invalid_spins",
        }
    }
}
