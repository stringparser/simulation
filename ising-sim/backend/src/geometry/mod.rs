mod periodic_2d;
mod square_2d;

pub use periodic_2d::Square2DPeriodic;
pub use square_2d::Square2DOpen;

pub trait Geometry {
    fn num_sites(&self) -> usize;
    fn dimensions(&self) -> (usize, usize);
    fn neighbors(&self, site: usize) -> &[usize];
    fn index_to_coord(&self, site: usize) -> (usize, usize);
    fn coord_to_index(&self, x: usize, y: usize) -> Option<usize>;
    fn name(&self) -> &'static str;
}

#[derive(Debug, Clone)]
pub enum LatticeGeometry {
    Open(Square2DOpen),
    Periodic(Square2DPeriodic),
}

impl LatticeGeometry {
    pub fn from_name(name: &str, width: usize, height: usize) -> Result<Self, String> {
        match name {
            "square_2d_open" => Ok(Self::Open(Square2DOpen::new(width, height))),
            "square_2d_periodic" => Ok(Self::Periodic(Square2DPeriodic::new(width, height))),
            _ => Err(format!("unsupported geometry: {name}")),
        }
    }
}

impl Geometry for LatticeGeometry {
    fn num_sites(&self) -> usize {
        match self {
            Self::Open(geometry) => geometry.num_sites(),
            Self::Periodic(geometry) => geometry.num_sites(),
        }
    }

    fn dimensions(&self) -> (usize, usize) {
        match self {
            Self::Open(geometry) => geometry.dimensions(),
            Self::Periodic(geometry) => geometry.dimensions(),
        }
    }

    fn neighbors(&self, site: usize) -> &[usize] {
        match self {
            Self::Open(geometry) => geometry.neighbors(site),
            Self::Periodic(geometry) => geometry.neighbors(site),
        }
    }

    fn index_to_coord(&self, site: usize) -> (usize, usize) {
        match self {
            Self::Open(geometry) => geometry.index_to_coord(site),
            Self::Periodic(geometry) => geometry.index_to_coord(site),
        }
    }

    fn coord_to_index(&self, x: usize, y: usize) -> Option<usize> {
        match self {
            Self::Open(geometry) => geometry.coord_to_index(x, y),
            Self::Periodic(geometry) => geometry.coord_to_index(x, y),
        }
    }

    fn name(&self) -> &'static str {
        match self {
            Self::Open(geometry) => geometry.name(),
            Self::Periodic(geometry) => geometry.name(),
        }
    }
}

pub const GEOMETRY_NAMES: [&str; 2] = ["square_2d_open", "square_2d_periodic"];
