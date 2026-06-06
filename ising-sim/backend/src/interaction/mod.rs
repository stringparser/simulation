mod nearest_neighbor;

pub use nearest_neighbor::NearestNeighbor;

use crate::geometry::Geometry;
use crate::lattice::Lattice;

pub trait Interaction {
    fn neighbor_sum(&self, lattice: &Lattice, site: usize, geometry: &dyn Geometry) -> f64;

    fn delta_energy(
        &self,
        lattice: &Lattice,
        site: usize,
        geometry: &dyn Geometry,
        field: f64,
    ) -> f64;
}
