use rand::Rng;
use rand::SeedableRng;
use rand::rngs::StdRng;

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

    pub fn from_spins(spins: Vec<i8>) -> Self {
        assert!(
            spins.iter().all(|&s| s == 1 || s == -1),
            "spins must be +1 or -1"
        );
        Self { spins }
    }

    pub fn len(&self) -> usize {
        self.spins.len()
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
