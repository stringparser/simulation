mod name;
mod periodic_2d;
mod square_2d;

pub use name::GeometryName;
pub use periodic_2d::Square2DPeriodic;
pub use square_2d::Square2DOpen;

use crate::error::SimulationError;

pub trait Geometry {
    fn num_sites(&self) -> usize;
    fn dimensions(&self) -> (usize, usize);
    fn neighbors(&self, site: usize) -> &[usize];
    fn index_to_coord(&self, site: usize) -> (usize, usize);
    fn coord_to_index(&self, x: usize, y: usize) -> Option<usize>;
    fn name(&self) -> GeometryName;
}

#[derive(Debug, Clone)]
pub enum LatticeGeometry {
    Open(Square2DOpen),
    Periodic(Square2DPeriodic),
}

impl LatticeGeometry {
    pub fn from_name(name: GeometryName, width: usize, height: usize) -> Self {
        match name {
            GeometryName::Square2DOpen => Self::Open(Square2DOpen::new(width, height)),
            GeometryName::Square2DPeriodic => {
                Self::Periodic(Square2DPeriodic::new(width, height))
            }
        }
    }

    pub fn try_from_str(name: &str, width: usize, height: usize) -> Result<Self, SimulationError> {
        Ok(Self::from_name(GeometryName::parse(name)?, width, height))
    }
}

macro_rules! delegate_geometry {
    ($self:expr, $method:ident ( $($arg:expr),* $(,)? )) => {
        match $self {
            Self::Open(geometry) => geometry.$method($($arg),*),
            Self::Periodic(geometry) => geometry.$method($($arg),*),
        }
    };
}

impl Geometry for LatticeGeometry {
    fn num_sites(&self) -> usize {
        delegate_geometry!(self, num_sites())
    }

    fn dimensions(&self) -> (usize, usize) {
        delegate_geometry!(self, dimensions())
    }

    fn neighbors(&self, site: usize) -> &[usize] {
        delegate_geometry!(self, neighbors(site))
    }

    fn index_to_coord(&self, site: usize) -> (usize, usize) {
        delegate_geometry!(self, index_to_coord(site))
    }

    fn coord_to_index(&self, x: usize, y: usize) -> Option<usize> {
        delegate_geometry!(self, coord_to_index(x, y))
    }

    fn name(&self) -> GeometryName {
        delegate_geometry!(self, name())
    }
}

pub const GEOMETRY_NAMES: [GeometryName; 2] =
    [GeometryName::Square2DOpen, GeometryName::Square2DPeriodic];
