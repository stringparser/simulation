use crate::error::SimulationError;
use rand::Rng;
use rand::SeedableRng;
use rand::rngs::StdRng;

/// Square-lattice spin configuration with values in `{+1, -1}`.
#[derive(Debug, Clone)]
pub struct Lattice {
    spins: Vec<i8>,
}

impl Lattice {
    pub fn new(num_sites: usize, seed: Option<u64>) -> Self {
        let mut rng = match seed {
            Some(seed) => StdRng::seed_from_u64(seed),
            None => StdRng::from_os_rng(),
        };

        let spins = (0..num_sites)
            .map(|_| if rng.random_bool(0.5) { 1 } else { -1 })
            .collect();

        Self { spins }
    }

    pub fn try_from_spins(spins: Vec<i8>) -> Result<Self, SimulationError> {
        if spins.iter().all(|&spin| spin == 1 || spin == -1) {
            Ok(Self { spins })
        } else {
            Err(SimulationError::InvalidSpins)
        }
    }

    pub fn len(&self) -> usize {
        self.spins.len()
    }

    pub fn is_empty(&self) -> bool {
        self.spins.is_empty()
    }

    pub fn spin(&self, site: usize) -> i8 {
        self.spins[site]
    }

    pub fn spins(&self) -> &[i8] {
        &self.spins
    }

    pub fn flip(&mut self, site: usize) {
        self.spins[site] = -self.spins[site];
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn try_from_spins_rejects_invalid_values() {
        assert!(Lattice::try_from_spins(vec![1, 0, -1]).is_err());
    }

    #[test]
    fn is_empty_tracks_spin_count() {
        assert!(Lattice::try_from_spins(vec![]).unwrap().is_empty());
        assert!(!Lattice::try_from_spins(vec![1]).unwrap().is_empty());
    }
}
