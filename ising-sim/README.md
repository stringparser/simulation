# Ising Simulator

Real-time Ising model visualization in the browser: a TypeScript Monte Carlo engine with a React UI for live lattice rendering and parameter control. Supports **2D square** and **3D cubic** lattices.

## Features

- **Live simulation** — start, pause, and step a Metropolis Monte Carlo run
- **2D canvas lattice** — spins colored by aligned neighbor count (black → blue/orange gradient)
- **3D cubic lattices** — open or periodic boundaries; orbit view with mouse drag, or axis slice inspection
- **Configurable at init** — per-axis size (4–64), geometry preset; total volume capped at 32 768 sites
- **Runtime parameters** — temperature `T`, external field `h`, coupling `J` adjustable mid-run
- **Observables** — energy, magnetization, acceptance rate, sweep count, metric sparklines

## Prerequisites

- [Node.js](https://nodejs.org/) 20+

## Quick start

```bash
cd ising-sim
make setup
make dev
```

Then open http://localhost:5173.

The simulation runs entirely in the browser. Use **Start** to run continuously, **Step** for single sweeps, or **Reset** after changing geometry or size.

For 3D presets, drag the lattice to rotate (orbit mode) or switch to slice mode to inspect a plane.

## Make targets

| Command | Description |
|---------|-------------|
| `make setup` | `npm install` |
| `make dev` | Vite dev server |
| `make test` | Frontend Jest tests |
| `make build` | Production frontend bundle |
| `make clean` | Remove `node_modules/`, `dist/` |
| `make help` | Print available targets |

### Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `PORT` | `5173` | Vite dev server port |

## Architecture

```
ControlsPanel ──┐
MetricsPanel  ──┼──► simulationStore ──► SimulationSession
LatticeView   ──┘         │                      │
                          │                      ▼
                          │            GeometryOrchestrator
                          │                      │
                          │         ┌────────────┴────────────┐
                          │         ▼                         ▼
                          │   GeometryDefinition[]     Geometry impls
                          │   (registry in definitions.ts)
                          │
                          └──► canvas renderer (2D grid or 3D orbit/slice)
```

When **Start** is pressed, a requestAnimationFrame loop advances the simulation about every 50 ms.

### Dimension model

Lattice shape is stored as `dimensions[]` plus `rank` (2 or 3):

| Rank | Example | Snapshot fields |
|------|---------|-----------------|
| 2 | `[16, 16]` | width × height |
| 3 | `[8, 8, 8]` | width × height × depth |

`SessionSnapshot` carries `dimensions`, `rank`, and `maxNeighbors`. The renderer reconstructs a `GeometryInstance` via `GeometryOrchestrator.createFromSnapshot()`.

## Physics

Ferromagnetic Ising model on a square (2D) or cubic (3D) lattice:

\[
H = -J \sum_{\langle i,j \rangle} s_i s_j - h \sum_i s_i
\]

- Spins \(s_i \in \{+1, -1\}\)
- \(J > 0\): ferromagnetic nearest-neighbor coupling (4 neighbors in 2D, 6 in 3D)
- Single-spin **Metropolis** updates: flip site \(i\) with probability \(\min(1, e^{-\beta \Delta E})\)
- \(\beta = 1/T\) (Boltzmann constant set to 1 in code)

## Configuration defaults

| Parameter | Default | Notes |
|-----------|---------|-------|
| 2D size | 16 × 16 | Per-axis range **4–64**; set at init |
| 3D size | 8 × 8 × 8 | Same per-axis bounds; volume ≤ **32 768** |
| Geometry | `square_2d_open` | Fixed for the run; change via Reset |
| Temperature \(T\) | 2.5 | Must be \(> 0\); adjustable mid-run |
| Field \(h\) | 0 | Adjustable mid-run |
| Coupling \(J\) | 1 | Adjustable mid-run |
| Dynamics | Metropolis | Nearest-neighbor only (v1) |
| Sweeps per tick | 1 | When simulation is running |

### Geometries

Registry: `src/sim/geometry/definitions.ts` (single source of truth).

| Name | Rank | Description |
|------|------|-------------|
| `square_2d_open` | 2 | Open edges — boundary sites have fewer neighbors |
| `square_2d_periodic` | 2 | Torus — periodic BCs, 4 neighbors per site |
| `cubic_3d_open` | 3 | Open cube — face/corner sites have fewer neighbors |
| `cubic_3d_periodic` | 3 | Periodic cube — 6 neighbors per site |

Geometry and lattice size are chosen in the UI and **fixed for the lifetime of a run**. Click **Reset** to re-initialize with new values.

3D view modes (view-only, no reset required):

| Mode | Interaction |
|------|-------------|
| **Orbit** | Drag the lattice to rotate (canvas projection) |
| **Slice** | Pick axis and index to show one plane |

## Project layout

```
ising-sim/
├── Makefile
├── README.md
├── PLAN.md                 # project history and design decisions
├── GEOMETRY-PLAN.md        # geometry orchestrator refactor (complete)
├── package.json
└── src/
    ├── sim/
    │   ├── geometry/       # GeometryOrchestrator, definitions, 2D/3D impls
    │   ├── session.ts      # SimulationSession + snapshot
    │   └── …               # Metropolis, metrics, interaction
    ├── store/              # Zustand simulationStore
    ├── rendering/          # canvas renderer, 3D projection
    ├── components/         # LatticeView, Controls, Metrics, Sparklines
    ├── hooks/              # useSimulationLoop, useLatticeRenderer
    └── config/             # lattice bounds, colors, slider ranges
```

## Frontend modules

| Module | Responsibility |
|--------|----------------|
| `sim/geometry/` | `GeometryOrchestrator` facade; registry + 2D/3D topology |
| `sim/session.ts` | `SimulationSession`, `SessionSnapshot`, metrics |
| `store/simulationStore.ts` | Zustand state: `dimensions[]`, geometry, slice/orbit view |
| `hooks/useSimulationLoop.ts` | rAF tick loop while running |
| `rendering/` | Canvas renderer; 2D grid, 3D orbit projection, slice mode |
| `components/LatticeView` | Mounts renderer; pointer drag for 3D orbit |
| `components/ControlsPanel` | Geometry, size, T/h/J, 3D view mode, run controls |
| `components/MetricsPanel` | Energy, magnetization, sparklines, step count |

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
make test
```

Run individually:

```bash
npm test
```

Tests cover geometry orchestrator, session snapshots, store, renderer, and components.

GitHub Actions runs `npm test` and `npm run build` on push and pull requests.

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Simulation | TypeScript (Metropolis MC, seeded RNG) |
| UI | React 19, Zustand, Vite, Jest, Testing Library |
| Dev tooling | Makefile |

See [PLAN.md](./PLAN.md) for project history and [GEOMETRY-PLAN.md](./GEOMETRY-PLAN.md) for the geometry orchestrator refactor notes.
