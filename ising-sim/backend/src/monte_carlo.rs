use crate::config::SimConfig;
use crate::geometry::Geometry;
use crate::interaction::Interaction;
use crate::lattice::Lattice;
use rand::Rng;
use rand::SeedableRng;
use rand::rngs::StdRng;

#[derive(Debug, Default, Clone, Copy)]
pub struct SweepStats {
    pub attempts: u64,
    pub acceptances: u64,
}

impl SweepStats {
    pub fn acceptance_rate(&self) -> f64 {
        if self.attempts == 0 {
            0.0
        } else {
            self.acceptances as f64 / self.attempts as f64
        }
    }
}

pub fn sweep(
    lattice: &mut Lattice,
    geometry: &dyn Geometry,
    interaction: &dyn Interaction,
    config: &SimConfig,
    rng: &mut StdRng,
) -> SweepStats {
    let num_sites = geometry.num_sites();
    let beta = config.beta();
    let mut stats = SweepStats::default();

    for _ in 0..num_sites {
        let site = rng.random_range(0..num_sites);
        let delta = interaction.delta_energy(lattice, site, geometry, config.field);
        stats.attempts += 1;

        if delta <= 0.0 || rng.random::<f64>() < (-beta * delta).exp() {
            lattice.flip(site);
            stats.acceptances += 1;
        }
    }

    stats
}

pub fn run_sweeps(
    lattice: &mut Lattice,
    geometry: &dyn Geometry,
    interaction: &dyn Interaction,
    config: &SimConfig,
    sweeps: u64,
    seed: Option<u64>,
) -> SweepStats {
    let mut rng = match seed {
        Some(seed) => StdRng::seed_from_u64(seed),
        None => StdRng::from_os_rng(),
    };

    let mut total = SweepStats::default();
    for _ in 0..sweeps {
        let stats = sweep(lattice, geometry, interaction, config, &mut rng);
        total.attempts += stats.attempts;
        total.acceptances += stats.acceptances;
    }
    total
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::Square2DOpen;
    use crate::interaction::NearestNeighbor;

    #[test]
    fn negative_delta_energy_always_accepts() {
        let geometry = Square2DOpen::new(2, 2);
        let mut lattice = Lattice::try_from_spins(vec![1, -1, -1, 1]).unwrap();
        let interaction = NearestNeighbor::new(1.0);
        let config = SimConfig {
            temperature: 0.1,
            ..Default::default()
        };
        let mut rng = StdRng::seed_from_u64(42);

        let before = lattice.spins().to_vec();
        let stats = sweep(
            &mut lattice,
            &geometry,
            &interaction,
            &config,
            &mut rng,
        );

        assert!(stats.acceptances > 0);
        assert_ne!(before, lattice.spins());
    }
}
