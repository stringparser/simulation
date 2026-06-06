use crate::config::SimConfig;
use crate::geometry::Geometry;
use crate::interaction::Interaction;
use crate::lattice::Lattice;

pub fn energy(
    lattice: &Lattice,
    geometry: &dyn Geometry,
    interaction: &dyn Interaction,
    config: &SimConfig,
) -> f64 {
    let mut total = 0.0;

    for site in 0..geometry.num_sites() {
        let spin = f64::from(lattice.spin(site));
        total -= config.field * spin;
        total -= config.coupling
            * spin
            * interaction.neighbor_sum(lattice, site, geometry);
    }

    // Each bond is counted twice in the neighbor sum.
    total * 0.5
}

pub fn magnetization(lattice: &Lattice) -> f64 {
    lattice.spins().iter().map(|&s| f64::from(s)).sum()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::Square2DOpen;
    use crate::interaction::NearestNeighbor;

    #[test]
    fn all_up_2x2_has_expected_energy_and_magnetization() {
        let geometry = Square2DOpen::new(2, 2);
        let lattice = Lattice::from_spins(vec![1, 1, 1, 1]);
        let interaction = NearestNeighbor::new(1.0);
        let config = SimConfig::default();

        // Bonds: 4 edges on 2x2 open grid, each J=1, all aligned => E = -4
        assert!((energy(&lattice, &geometry, &interaction, &config) + 4.0).abs() < 1e-10);
        assert!((magnetization(&lattice) - 4.0).abs() < 1e-10);
    }

    #[test]
    fn all_down_2x2_matches_all_up_energy() {
        let geometry = Square2DOpen::new(2, 2);
        let up = Lattice::from_spins(vec![1, 1, 1, 1]);
        let down = Lattice::from_spins(vec![-1, -1, -1, -1]);
        let interaction = NearestNeighbor::new(1.0);
        let config = SimConfig::default();

        assert!(
            (energy(&up, &geometry, &interaction, &config)
                - energy(&down, &geometry, &interaction, &config))
            .abs()
                < 1e-10
        );
        assert!((magnetization(&down) + 4.0).abs() < 1e-10);
    }
}
