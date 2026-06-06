# Ising Simulator

Real-time 2D Ising model visualization in the browser: a TypeScript Monte Carlo engine with a React UI for live lattice rendering and parameter control.

## Features

- **Live simulation** — start, pause, and step a Metropolis Monte Carlo run
- **Canvas lattice view** — spins colored by aligned neighbor count (black → blue/orange gradient)
- **Configurable at init** — lattice size (4–64), geometry (open edges or periodic/torus)
- **Runtime parameters** — temperature `T`, external field `h`, coupling `J` adjustable mid-run
- **Observables** — energy, magnetization, acceptance rate, sweep count

## Prerequisites

- [Node.js](https://nodejs.org/) 20+

## Quick start

```bash
cd ising-sim
make setup
make dev
```

Then open http://localhost:5173.

The simulation runs entirely in the browser. Use **Start** to run continuously, **Step** for single sweeps, or **Reset** after changing geometry/size.

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
┌─────────────────────────────────────────────────────────────┐
│  Browser (Vite + React + Zustand + Jest)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ LatticeView  │  │ Controls     │  │ MetricsPanel      │  │
│  │ (canvas)     │  │ T, h, J, run │  │ E, M, step count  │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         └─────────────────┴────────────────────┘            │
│                           │                                 │
│              simulationStore (Zustand)                      │
│                           │                                 │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │ SimulationSession (TypeScript)                       │   │
│  │  geometry → interaction → Metropolis sweep → metrics │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

When **Start** is pressed, a 50 ms interval advances the simulation in the main thread.

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

Geometry and lattice size are chosen in the UI and **fixed for the lifetime of a run**. Click **Reset** to re-initialize with new values.

## Project layout

```
ising-sim/
├── Makefile              # setup, dev, test, build
├── README.md             # this file
├── PLAN.md               # original design document
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── App.tsx
    ├── hooks/useSimulationLoop.ts
    ├── store/simulationStore.ts
    ├── sim/                  # Monte Carlo engine
    ├── config/               # lattice bounds, geometry options
    ├── rendering/            # canvas renderer
    ├── components/           # LatticeView, Controls, Metrics
    └── __tests__/
```

## Frontend modules

| Module | Responsibility |
|--------|----------------|
| `sim/` | `SimulationSession`, geometry, Metropolis sweep, metrics |
| `store/simulationStore.ts` | Zustand single source of truth; drives local session |
| `hooks/useSimulationLoop.ts` | 50 ms tick loop while running |
| `rendering/` | `LatticeRenderer` interface; neighbor-color canvas renderer |
| `components/LatticeView` | Mounts renderer, redraws on spin updates |
| `components/ControlsPanel` | Geometry, size, T/h/J sliders, Start/Pause/Step/Reset |
| `components/MetricsPanel` | Energy, magnetization, acceptance, step count |

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

The `sim/` package includes unit tests for geometry, Metropolis updates, metrics, and session lifecycle.

GitHub Actions runs `npm test` and `npm run build` on push and pull requests.

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Simulation | TypeScript (Metropolis MC, seeded RNG) |
| UI | React 19, Zustand, Vite, Jest, Testing Library |
| Dev tooling | Makefile |

See [PLAN.md](./PLAN.md) for the original design rationale and future work (Glauber dynamics, larger lattices, phase diagrams, etc.).
