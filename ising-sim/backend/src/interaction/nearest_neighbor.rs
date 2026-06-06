use super::Interaction;
use crate::geometry::Geometry;
use crate::lattice::Lattice;

#[derive(Debug, Clone, Copy)]
pub struct NearestNeighbor {
    pub j: f64,
}

impl NearestNeighbor {
    pub fn new(j: f64) -> Self {
        Self { j }
    }
}

impl Interaction for NearestNeighbor {
    fn neighbor_sum(&self, lattice: &Lattice, site: usize, geometry: &dyn Geometry) -> f64 {
        geometry
            .neighbors(site)
            .iter()
            .map(|&neighbor| f64::from(lattice.spin(neighbor)))
            .sum()
    }

    fn delta_energy(
        &self,
        lattice: &Lattice,
        site: usize,
        geometry: &dyn Geometry,
        field: f64,
    ) -> f64 {
        let spin = f64::from(lattice.spin(site));
        let neighbor_sum = self.neighbor_sum(lattice, site, geometry);
        2.0 * spin * (field + self.j * neighbor_sum)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::Square2DOpen;

    #[test]
    fn delta_energy_for_all_up_2x2_corner() {
        let geometry = Square2DOpen::new(2, 2);
        let lattice = Lattice::from_spins(vec![1, 1, 1, 1]);
        let interaction = NearestNeighbor::new(1.0);

        // Site 0 has neighbors 1 and 2, all spins up => neighbor_sum = 2
        // dE = 2 * 1 * (0 + 1 * 2) = 4
        let delta = interaction.delta_energy(&lattice, 0, &geometry, 0.0);
        assert!((delta - 4.0).abs() < 1e-10);
    }
}
