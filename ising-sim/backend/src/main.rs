use ising_backend::{
    energy, magnetization, run_sweeps, run_server, Geometry, Lattice, NearestNeighbor, SimConfig,
    Square2DOpen,
};
use std::env;
use std::net::SocketAddr;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("ising_backend=info".parse().unwrap()))
        .init();

    let args: Vec<String> = env::args().collect();

    if args.iter().any(|arg| arg == "--demo") {
        run_demo();
        return;
    }

    let port = env::var("BACKEND_PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    if let Err(error) = run_server(addr).await {
        eprintln!("server error: {error}");
        std::process::exit(1);
    }
}

fn run_demo() {
    let config = SimConfig::default();
    let geometry = Square2DOpen::new(config.width, config.height);
    let interaction = NearestNeighbor::new(config.coupling);
    let mut lattice = Lattice::new(geometry.num_sites(), config.seed);

    println!(
        "Ising demo: {}x{} ({})",
        config.width,
        config.height,
        geometry.name()
    );
    println!(
        "Initial E = {:.4}, M = {:.1}",
        energy(&lattice, &geometry, &interaction, &config),
        magnetization(&lattice)
    );

    let stats = run_sweeps(
        &mut lattice,
        &geometry,
        &interaction,
        &config,
        1000,
        Some(42),
    );

    println!(
        "After 1000 sweeps: E = {:.4}, M = {:.1}, acceptance = {:.3}",
        energy(&lattice, &geometry, &interaction, &config),
        magnetization(&lattice),
        stats.acceptance_rate()
    );
}
