use ising_backend::{
    energy, magnetization, run_sweeps, Geometry, Lattice, NearestNeighbor, SimConfig,
    Square2DOpen,
};
use std::thread;
use std::time::Duration;

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.iter().any(|arg| arg == "--demo") {
        run_demo();
        return;
    }

    println!("Ising backend dev mode (WebSocket server arrives in Phase 2).");
    println!("Run `make demo` to execute the Phase 1 simulation benchmark.");
    loop {
        thread::sleep(Duration::from_secs(3600));
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
