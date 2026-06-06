# Ising Simulator

Real-time 2D Ising model visualization with a Rust WebSocket backend and React frontend.

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+

## Quick start

```bash
cd ising-sim
make setup   # install backend + frontend dependencies
make dev     # backend ws://127.0.0.1:8080/ws + frontend http://localhost:5173
```

Open http://localhost:5173 in your browser. The app connects automatically, initializes a 16×16 lattice, and is ready to run.

## Make targets

| Command | Description |
|---------|-------------|
| `make setup` | Fetch Rust crates and `npm install` |
| `make dev` | Run backend WebSocket server and Vite dev server |
| `make demo` | Run Phase 1 CLI benchmark (1000 sweeps, no network) |
| `make test` | `cargo test` + `npm test` |
| `make build` | Release backend binary + production frontend bundle |
| `make clean` | Remove build artifacts and `node_modules` |

Environment variables:

- `BACKEND_PORT` (default `8080`)
- `FRONTEND_PORT` (default `5173`)

## Architecture

```
frontend (React + Zustand + canvas)  ←WebSocket JSON→  backend (Rust + axum)
```

**Backend** (`backend/`): Monte Carlo engine with configurable geometry (open edges or periodic boundaries), Metropolis dynamics, and nearest-neighbor coupling.

**Frontend** (`frontend/`): WebSocket client, Zustand store, canvas lattice renderer (swappable via `LatticeRenderer` interface), controls for T / h / J, and live metrics.

## Wire protocol

Messages are JSON with a `type` field.

Client → server: `init`, `start`, `pause`, `step`, `set_params`, `get_state`

Server → client: `ready`, `state`, `metrics`, `error`

Geometry is chosen at `init` and fixed for the run. Use **Reset** to start a new simulation with different geometry.

Supported geometries:

- `square_2d_open` — open edges (default)
- `square_2d_periodic` — torus (periodic boundary conditions)

## Defaults

| Parameter | Value |
|-----------|-------|
| Lattice | 16 × 16 (configurable 4–64 at init) |
| Temperature | 2.5 |
| Field h | 0 |
| Coupling J | 1 |
| Dynamics | Metropolis, nearest neighbor |

## Project layout

See [PLAN.md](./PLAN.md) for the full design document and implementation phases.
