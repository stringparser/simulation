use crate::error::SimulationError;

/// Supported lattice geometry identifiers on the wire and in configuration.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum GeometryName {
    Square2DOpen,
    Square2DPeriodic,
}

impl GeometryName {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Square2DOpen => "square_2d_open",
            Self::Square2DPeriodic => "square_2d_periodic",
        }
    }

    pub fn parse(name: &str) -> Result<Self, SimulationError> {
        match name {
            "square_2d_open" => Ok(Self::Square2DOpen),
            "square_2d_periodic" => Ok(Self::Square2DPeriodic),
            _ => Err(SimulationError::UnsupportedGeometry {
                name: name.to_string(),
            }),
        }
    }
}

impl std::fmt::Display for GeometryName {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}
