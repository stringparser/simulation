# Ising Simulator

Real-time 2D Ising model visualization: a Rust Monte Carlo engine over WebSockets, with a React frontend for live lattice rendering and parameter control.

## Features

- **Live simulation** — start, pause, and step a Metropolis Monte Carlo run
- **Canvas lattice view** — spins rendered as a color-coded grid (swappable renderer)
- **Configurable at init** — lattice size (4–64), geometry (open edges or periodic/torus)
- **Runtime parameters** — temperature `T`, external field `h`, coupling `J` adjustable mid-run
- **Observables** — energy, magnetization, acceptance rate, sweep count

## Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Node.js](https://nodejs.org/) 20+

## Quick start

```bash
cd ising-sim
make setup
make dev
```

Then open http://localhost:5173.

The frontend connects automatically to `ws://127.0.0.1:8080/ws` (proxied via Vite in dev), sends `init`, and displays the lattice. Use **Start** to run continuously, **Step** for single sweeps, or **Reset** after changing geometry/size.

### CLI benchmark (no browser)

```bash
make demo
```

Runs 1000 Metropolis sweeps on a 16×16 lattice and prints energy and magnetization to stdout.

## Make targets

| Command | Description |
|---------|-------------|
| `make setup` | `cargo fetch` + `npm install` |
| `make dev` | Backend WebSocket server + Vite dev server (parallel) |
| `make demo` | Phase 1 CLI benchmark (`cargo run -- --demo`) |
| `make test` | Backend (`cargo test`) + frontend (`jest`) |
| `make build` | Release backend binary + production frontend bundle |
| `make clean` | Remove `target/`, `node_modules/`, `dist/` |
| `make help` | Print available targets |

### Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `BACKEND_PORT` | `8080` | WebSocket server bind port |
| `FRONTEND_PORT` | `5173` | Vite dev server port |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vite + React + Zustand + Jest)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ LatticeView  │  │ Controls     │  │ MetricsPanel      │  │
│  │ (canvas)     │  │ T, h, J, run │  │ E, M, step count  │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         └─────────────────┴────────────────────┘            │
│                           │                                 │
│              SimulationClient (WebSocket)                   │
└───────────────────────────┼─────────────────────────────────┘
                            │ JSON over WebSocket
┌───────────────────────────┼─────────────────────────────────┐
│  Backend (Rust + axum + tokio)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ws/server.rs   — connection loop, tick while running │   │
│  │ ws/handler.rs  — parse commands, dispatch to session │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │ SimulationSession                                    │   │
│  │  geometry → interaction → Metropolis sweep → metrics │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

In development, Vite proxies `/ws` to the backend so the frontend can connect on the same origin.

## Physics

Ferromagnetic Ising model on a 2D square lattice:

\[
H = -J \sum_{\langle i,j \rangle} s_i s_j - h \sum_i s_i
\]

- Spins \(s_i \in \{+1, -1\}\)
- \(J > 0\): ferromagnetic nearest-neighbor coupling
- Single-spin **Metropolis** updates: flip site \(i\) with probability \(\min(1, e^{-\beta \Delta E})\)
- \(\beta = 1/T\) (Boltzmann constant set to 1 in code)

## Configuration defaults

| Parameter | Default | Notes |
|-----------|---------|-------|
| Lattice size | 16 × 16 | Valid range: **4–64** per side; set at init |
| Geometry | `square_2d_open` | Fixed for the run; change via Reset |
| Temperature \(T\) | 2.5 | Must be \(> 0\); adjustable mid-run |
| Field \(h\) | 0 | Adjustable mid-run |
| Coupling \(J\) | 1 | Adjustable mid-run |
| Dynamics | Metropolis | Nearest-neighbor only (v1) |
| Sweeps per tick | 1 | When simulation is running |

### Geometries

| Name | Description |
|------|-------------|
| `square_2d_open` | Open edges — boundary sites have fewer neighbors |
| `square_2d_periodic` | Torus — periodic boundary conditions, every site has 4 neighbors |

Geometry and lattice size are chosen in the UI (or via `init`) and **fixed for the lifetime of a run**. Click **Reset** to re-initialize with new values.

## WebSocket protocol

Endpoint: `ws://<host>:<port>/ws`  
Format: JSON messages tagged by `"type"`. Protocol version: **1**.

### Client → server

| type | Payload | Effect |
|------|---------|--------|
| `init` | `{ width?, height?, geometry?, temperature?, field?, coupling?, seed? }` | Create or reset simulation |
| `start` | `{ steps_per_tick? }` | Begin continuous sweeps (default 1 per tick) |
| `pause` | — | Stop continuous sweeps |
| `step` | `{ sweeps }` | Run N sweeps once, push state + metrics |
| `set_params` | `{ temperature?, field?, coupling? }` | Update parameters mid-run |
| `get_state` | — | Request current state + metrics snapshot |

### Server → client

| type | Payload |
|------|---------|
| `ready` | `{ protocol_version }` — sent on connect |
| `state` | `{ spins, width, height, step, geometry }` |
| `metrics` | `{ energy, magnetization, acceptance_rate?, temperature, field, coupling }` |
| `error` | `{ message, code? }` |

### Example session

```json
← {"type":"ready","protocol_version":1}

→ {"type":"init","width":8,"height":10,"geometry":"square_2d_periodic","temperature":2.5,"field":0,"coupling":1,"seed":42}

← {"type":"state","spins":[...],"width":8,"height":10,"step":0,"geometry":"square_2d_periodic"}
← {"type":"metrics","energy":-12.0,"magnetization":6.0,"acceptance_rate":null,"temperature":2.5,"field":0,"coupling":1}

→ {"type":"step","sweeps":5}

→ {"type":"start","steps_per_tick":1}
→ {"type":"pause"}
```

### Error codes

| code | Meaning |
|------|---------|
| `invalid_json` | Malformed message |
| `invalid_lattice_size` | Width or height outside 4–64 |
| `init_failed` | Unsupported geometry or init error |
| `invalid_params` | e.g. non-positive temperature |
| `invalid_step` | `sweeps` must be ≥ 1 |
| `not_initialized` | Command sent before `init` |

## Project layout

```
ising-sim/
├── Makefile              # setup, dev, test, build
├── README.md             # this file
├── PLAN.md               # original design document
├── backend/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs           # WebSocket server entry (+ --demo CLI)
│       ├── lib.rs
│       ├── config.rs         # defaults, SimInitParams, size validation
│       ├── error.rs          # SimulationError enum
│       ├── session.rs        # SimulationSession, snapshot/metrics types
│       ├── geometry/         # open + periodic 2D lattices
│       ├── interaction/      # nearest-neighbor coupling
│       ├── lattice.rs        # spin storage
│       ├── monte_carlo.rs    # Metropolis sweep
│       ├── metrics.rs        # energy, magnetization
│       └── ws/
│           ├── messages.rs   # wire protocol types
│           ├── handler.rs    # command dispatch
│           └── server.rs     # axum WebSocket server
└── frontend/
    ├── package.json
    ├── vite.config.ts        # dev server + /ws proxy
    └── src/
        ├── App.tsx
        ├── api/websocket.ts  # SimulationClient (reconnect, queue)
        ├── store/simulationStore.ts
        ├── types/messages.ts
        ├── config/           # lattice bounds, geometry options
        ├── rendering/        # LatticeRenderer + canvas impl
        ├── components/       # LatticeView, Controls, Metrics, Banner
        └── __tests__/
```

## Backend modules

| Module | Responsibility |
|--------|----------------|
| `config` | Constants, `SimConfig`, `SimInitParams`, lattice size validation |
| `error` | Typed `SimulationError` with stable wire codes |
| `geometry` | `Geometry` trait, `LatticeGeometry` enum (open / periodic) |
| `interaction` | `Interaction` trait, `NearestNeighbor` (ΔE for Metropolis) |
| `lattice` | `+1`/`-1` spin array, random init |
| `monte_carlo` | Single sweep: random site selection, accept/reject |
| `metrics` | Total energy and magnetization |
| `session` | Per-connection simulation state; no WebSocket dependency |
| `ws/handler` | Maps `ClientMessage` → session ops → `ServerMessage` |
| `ws/server` | Axum route, connection loop, tick while `running` |

## Frontend modules

| Module | Responsibility |
|--------|----------------|
| `api/websocket.ts` | WebSocket client with reconnect backoff and outbound queue |
| `store/simulationStore.ts` | Zustand single source of truth; dispatches WS messages |
| `rendering/` | `LatticeRenderer` interface; `createCanvasRenderer()` default |
| `components/LatticeView` | Mounts renderer, redraws on spin updates |
| `components/ControlsPanel` | Geometry, size, T/h/J sliders, Start/Pause/Step/Reset |
| `components/MetricsPanel` | Energy, magnetization, acceptance, step count |
| `components/ConnectionBanner` | WebSocket status and error display |

The renderer is intentionally abstracted: swap `createCanvasRenderer` for another implementation without changing the store or protocol.

## Development

### Run backend only

```bash
cd backend
BACKEND_PORT=8080 cargo run
```

### Run frontend only

```bash
cd frontend
npm install
npm run dev
```

### Test manually with websocat

```bash
websocat ws://127.0.0.1:8080/ws
```

Paste JSON lines from the [example session](#example-session) above.

## Testing

```bash
make test
```

| Suite | Count | Covers |
|-------|-------|--------|
| Backend (`cargo test`) | 18 tests | geometry, Metropolis, handler, WebSocket integration |
| Frontend (`jest`) | 9 tests | message parsing, store, canvas renderer, controls, lattice config |

Run individually:

```bash
cd backend && cargo test
cd frontend && npm test
```

## Implementation status

| Phase | Status | Summary |
|-------|--------|---------|
| 1 — Backend core | Done | Lattice, geometry, Metropolis, metrics, CLI demo |
| 2 — WebSocket server | Done | axum server, JSON protocol, session per connection |
| 3 — Frontend | Done | React UI, Zustand, canvas renderer, live updates |
| 4 — Geometry extensibility | Done | Open + periodic geometries, UI selector |
| 5 — Polish | Partial | README, Makefile; charts/CI not yet added |

See [PLAN.md](./PLAN.md) for the original design rationale and future work (Glauber dynamics, larger lattices with delta encoding, phase diagrams, etc.).

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Backend | Rust, tokio, axum, serde, rand |
| Frontend | TypeScript, React 19, Zustand, Vite, Jest, Testing Library |
| Dev tooling | Makefile, Vite WS proxy |
