mod square_2d;

pub use square_2d::Square2DOpen;

pub trait Geometry {
    fn num_sites(&self) -> usize;
    fn dimensions(&self) -> (usize, usize);
    fn neighbors(&self, site: usize) -> &[usize];
    fn index_to_coord(&self, site: usize) -> (usize, usize);
    fn coord_to_index(&self, x: usize, y: usize) -> Option<usize>;
    fn name(&self) -> &'static str;
}
