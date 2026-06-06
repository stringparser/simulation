use super::Geometry;

#[derive(Debug, Clone)]
pub struct Square2DPeriodic {
    width: usize,
    height: usize,
    neighbors: Vec<Vec<usize>>,
}

impl Square2DPeriodic {
    pub fn new(width: usize, height: usize) -> Self {
        assert!(width > 0 && height > 0, "lattice dimensions must be positive");

        let num_sites = width * height;
        let mut neighbors = vec![Vec::with_capacity(4); num_sites];

        for y in 0..height {
            for x in 0..width {
                let site = y * width + x;
                neighbors[site].push(y * width + ((x + width - 1) % width));
                neighbors[site].push(y * width + ((x + 1) % width));
                neighbors[site].push(((y + height - 1) % height) * width + x);
                neighbors[site].push(((y + 1) % height) * width + x);
            }
        }

        Self {
            width,
            height,
            neighbors,
        }
    }
}

impl Geometry for Square2DPeriodic {
    fn num_sites(&self) -> usize {
        self.width * self.height
    }

    fn dimensions(&self) -> (usize, usize) {
        (self.width, self.height)
    }

    fn neighbors(&self, site: usize) -> &[usize] {
        &self.neighbors[site]
    }

    fn index_to_coord(&self, site: usize) -> (usize, usize) {
        (site % self.width, site / self.width)
    }

    fn coord_to_index(&self, x: usize, y: usize) -> Option<usize> {
        if x >= self.width || y >= self.height {
            return None;
        }
        Some(y * self.width + x)
    }

    fn name(&self) -> &'static str {
        "square_2d_periodic"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_site_has_four_neighbors_on_4x4_periodic_grid() {
        let geometry = Square2DPeriodic::new(4, 4);
        for site in 0..geometry.num_sites() {
            assert_eq!(geometry.neighbors(site).len(), 4);
        }
    }

    #[test]
    fn corner_wraps_on_2x2_periodic_grid() {
        let geometry = Square2DPeriodic::new(2, 2);
        assert_eq!(geometry.neighbors(0).len(), 4);
        assert!(geometry.neighbors(0).contains(&1));
        assert!(geometry.neighbors(0).contains(&2));
    }
}
