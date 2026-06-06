use serde::Deserialize;

use crate::error::SimulationError;

pub const DEFAULT_LATTICE_WIDTH: usize = 16;
pub const DEFAULT_LATTICE_HEIGHT: usize = 16;
pub const MIN_LATTICE_SIZE: usize = 4;
pub const MAX_LATTICE_SIZE: usize = 64;
pub const DEFAULT_TEMPERATURE: f64 = 2.5;
pub const DEFAULT_FIELD: f64 = 0.0;
pub const DEFAULT_COUPLING: f64 = 1.0;
pub const DEFAULT_GEOMETRY: &str = "square_2d_open";

#[derive(Debug, Clone)]
pub struct SimConfig {
    pub width: usize,
    pub height: usize,
    pub temperature: f64,
    pub field: f64,
    pub coupling: f64,
    pub geometry: String,
    pub seed: Option<u64>,
}

impl Default for SimConfig {
    fn default() -> Self {
        Self {
            width: DEFAULT_LATTICE_WIDTH,
            height: DEFAULT_LATTICE_HEIGHT,
            temperature: DEFAULT_TEMPERATURE,
            field: DEFAULT_FIELD,
            coupling: DEFAULT_COUPLING,
            geometry: DEFAULT_GEOMETRY.to_string(),
            seed: None,
        }
    }
}

impl SimConfig {
    pub fn beta(&self) -> f64 {
        1.0 / self.temperature
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct SimInitParams {
    pub width: Option<usize>,
    pub height: Option<usize>,
    pub geometry: Option<String>,
    pub temperature: Option<f64>,
    pub field: Option<f64>,
    pub coupling: Option<f64>,
    pub seed: Option<u64>,
}

impl SimInitParams {
    pub fn into_config(self) -> Result<SimConfig, SimulationError> {
        let width = self.width.unwrap_or(DEFAULT_LATTICE_WIDTH);
        let height = self.height.unwrap_or(DEFAULT_LATTICE_HEIGHT);
        validate_lattice_size(width, height)?;

        let temperature = self.temperature.unwrap_or(DEFAULT_TEMPERATURE);
        if temperature <= 0.0 {
            return Err(SimulationError::InvalidTemperature);
        }

        Ok(SimConfig {
            width,
            height,
            temperature,
            field: self.field.unwrap_or(DEFAULT_FIELD),
            coupling: self.coupling.unwrap_or(DEFAULT_COUPLING),
            geometry: self
                .geometry
                .unwrap_or_else(|| DEFAULT_GEOMETRY.to_string()),
            seed: self.seed,
        })
    }
}

pub fn validate_lattice_size(width: usize, height: usize) -> Result<(), SimulationError> {
    let valid = width >= MIN_LATTICE_SIZE
        && height >= MIN_LATTICE_SIZE
        && width <= MAX_LATTICE_SIZE
        && height <= MAX_LATTICE_SIZE;

    if valid {
        Ok(())
    } else {
        Err(SimulationError::InvalidLatticeSize { width, height })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_lattice_size_outside_bounds() {
        assert!(validate_lattice_size(3, 16).is_err());
        assert!(validate_lattice_size(16, 65).is_err());
        assert!(validate_lattice_size(32, 32).is_ok());
    }
}
