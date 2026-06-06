use super::Geometry;

#[derive(Debug, Clone)]
pub struct Square2DOpen {
    width: usize,
    height: usize,
    neighbors: Vec<Vec<usize>>,
}

impl Square2DOpen {
    pub fn new(width: usize, height: usize) -> Self {
        assert!(width > 0 && height > 0, "lattice dimensions must be positive");

        let num_sites = width * height;
        let mut neighbors = vec![Vec::new(); num_sites];

        for y in 0..height {
            for x in 0..width {
                let site = y * width + x;
                if x > 0 {
                    neighbors[site].push(site - 1);
                }
                if x + 1 < width {
                    neighbors[site].push(site + 1);
                }
                if y > 0 {
                    neighbors[site].push(site - width);
                }
                if y + 1 < height {
                    neighbors[site].push(site + width);
                }
            }
        }

        Self {
            width,
            height,
            neighbors,
        }
    }
}

impl Geometry for Square2DOpen {
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
        "square_2d_open"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn corner_has_two_neighbors_on_4x4_open_grid() {
        let geometry = Square2DOpen::new(4, 4);
        assert_eq!(geometry.neighbors(0).len(), 2);
        assert_eq!(geometry.neighbors(15).len(), 2);
    }

    #[test]
    fn edge_has_three_neighbors_on_4x4_open_grid() {
        let geometry = Square2DOpen::new(4, 4);
        assert_eq!(geometry.neighbors(1).len(), 3);
        assert_eq!(geometry.neighbors(4).len(), 3);
    }

    #[test]
    fn interior_has_four_neighbors_on_4x4_open_grid() {
        let geometry = Square2DOpen::new(4, 4);
        assert_eq!(geometry.neighbors(5).len(), 4);
        assert_eq!(geometry.neighbors(10).len(), 4);
    }

    #[test]
    fn coord_index_round_trip() {
        let geometry = Square2DOpen::new(4, 4);
        for site in 0..geometry.num_sites() {
            let (x, y) = geometry.index_to_coord(site);
            assert_eq!(geometry.coord_to_index(x, y), Some(site));
        }
    }
}
