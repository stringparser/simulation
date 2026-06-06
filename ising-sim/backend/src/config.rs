#[derive(Debug, Clone)]
pub struct SimConfig {
    pub width: usize,
    pub height: usize,
    pub temperature: f64,
    pub field: f64,
    pub coupling: f64,
    pub seed: Option<u64>,
}

impl Default for SimConfig {
    fn default() -> Self {
        Self {
            width: 16,
            height: 16,
            temperature: 2.5,
            field: 0.0,
            coupling: 1.0,
            seed: None,
        }
    }
}

impl SimConfig {
    pub fn beta(&self) -> f64 {
        1.0 / self.temperature
    }
}
