#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SimulationError {
    InvalidLatticeSize { width: usize, height: usize },
    UnsupportedGeometry { name: String },
    InvalidTemperature,
    InvalidStep { sweeps: u64 },
    NotInitialized,
}

impl SimulationError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::InvalidLatticeSize { .. } => "invalid_lattice_size",
            Self::UnsupportedGeometry { .. } => "init_failed",
            Self::InvalidTemperature => "invalid_params",
            Self::InvalidStep { .. } => "invalid_step",
            Self::NotInitialized => "not_initialized",
        }
    }
}

impl std::fmt::Display for SimulationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidLatticeSize { width, height } => {
                write!(
                    f,
                    "lattice size must be between {MIN} and {MAX}, got {width}x{height}",
                    MIN = crate::config::MIN_LATTICE_SIZE,
                    MAX = crate::config::MAX_LATTICE_SIZE
                )
            }
            Self::UnsupportedGeometry { name } => write!(f, "unsupported geometry: {name}"),
            Self::InvalidTemperature => write!(f, "temperature must be positive"),
            Self::InvalidStep { sweeps } => write!(f, "sweeps must be at least 1, got {sweeps}"),
            Self::NotInitialized => write!(f, "simulation not initialized; send init first"),
        }
    }
}

impl std::error::Error for SimulationError {}
