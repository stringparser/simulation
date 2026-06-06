# Ising Model Simulator — Project Plan

## Goal

Browser-only real-time Ising model simulator:

- **Engine**: TypeScript Monte Carlo in `src/sim/`
- **UI**: React + Zustand + Vite + Jest
- **Geometry**: 2D square and 3D cubic presets (open or periodic), chosen at init/reset
- **Dynamics**: nearest-neighbor Metropolis (v1)

Supports start, pause, step, live lattice visualization (2D grid; 3D orbit or slice), and observables (energy, magnetization, acceptance rate).

---

## Architecture

```
ising-sim/
├── src/
│   ├── sim/
│   │   ├── geometry/     # GeometryOrchestrator, definitions registry, 2D/3D impls
│   │   ├── session.ts    # SimulationSession, SessionSnapshot
│   │   └── …             # Metropolis, metrics, interaction
│   ├── store/            # Zustand store (dimensions[], viewMode, slice state)
│   ├── hooks/            # useSimulationLoop (rAF), useLatticeRenderer (orbit drag)
│   ├── rendering/        # Canvas renderer + 3D projection
│   ├── components/       # LatticeView, Controls, Metrics, Sparklines
│   └── config/           # Lattice bounds, colors, slider ranges
├── Makefile
├── README.md
└── GEOMETRY-PLAN.md
```

```
ControlsPanel ──► simulationStore ──► SimulationSession
LatticeView   ──► canvas renderer ◄── GeometryOrchestrator.createFromSnapshot()
     │
     └── 3D orbit: pointer drag → yaw/pitch → projection3d.ts
```

No WebSocket, no Rust backend, no wire protocol.

### GeometryOrchestrator

All lattice topology, validation, and visualization coloring flows through one facade:

| Concern | Location |
|---------|----------|
| Registry (presets) | `sim/geometry/definitions.ts` |
| Public API | `GeometryOrchestrator` |
| Physics (MC loop) | slim `Geometry` interface: `numSites()`, `neighbors()` |
| Coloring | `GeometryInstance.colorForSite()` — same neighbor graph as physics |
| Snapshots | `dimensions[]`, `rank`, `maxNeighbors` |

Adding a geometry = one registry entry + one impl class. Store, session, and renderer do not need geometry-specific switches.

---

## Physics (baseline)

\[
H = -J \sum_{\langle i,j \rangle} s_i s_j - h \sum_i s_i
\]

- Spins \(s_i \in \{+1, -1\}\)
- Metropolis acceptance: \(\min(1, e^{-\beta \Delta E})\), \(\beta = 1/T\)
- One sweep = `numSites()` random site attempts

---

## Configuration defaults

| Parameter | Default | Notes |
|-----------|---------|-------|
| 2D size | 16 × 16 | Per-axis 4–64 |
| 3D size | 8 × 8 × 8 | Per-axis 4–64; volume ≤ 32 768 |
| Geometry | `square_2d_open` | See registry for all presets |
| Temperature | 2.5 | Must be > 0 |
| Field | 0 | Adjustable mid-run |
| Coupling | 1 | Adjustable mid-run |
| Sweeps per tick | 1 | While running |

### Geometry presets

| Name | Rank | Max neighbors |
|------|------|---------------|
| `square_2d_open` | 2 | 4 |
| `square_2d_periodic` | 2 | 4 |
| `cubic_3d_open` | 3 | 6 |
| `cubic_3d_periodic` | 3 | 6 |

---

## Implementation status

| Phase | Status | Summary |
|-------|--------|---------|
| 1 — Engine | Done | TypeScript MC in `src/sim/` + Jest tests |
| 2 — Local store | Done | Zustand drives `SimulationSession` in-process |
| 3 — Remove backend | Done | Deleted Rust server; flattened repo layout |
| 4 — Polish | Done | rAF loop, sparklines, CI |
| 5 — Geometry orchestrator | Done | Registry, unified coloring, `dimensions[]` snapshots |
| 6 — 3D + orbit view | Done | Cubic presets, slice UI, mouse-drag orbit |

See [GEOMETRY-PLAN.md](./GEOMETRY-PLAN.md) for the phased refactor checklist (all phases complete).

---

## Future work (post-v1)

- Glauber dynamics and alternate interaction presets
- Web Worker for large lattices (64×64×64 at high tick rates)
- Phase diagram / temperature sweep UI
- WebGL renderer (canvas orbit is sufficient for typical 8³ grids)
- URL hash or localStorage for shareable presets

---

## Design decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Browser-only | Simpler deploy; 16×16 / 8³ is cheap on main thread |
| State | Zustand + module session | Single tab, synchronous init |
| Tick loop | rAF + 50 ms accumulator | Smooth UI; avoids setInterval drift |
| Geometry API | `GeometryOrchestrator` | One registry; no duplicated topology in rendering |
| 3D rendering | Canvas projection + drag | No WebGL dep; good for verification |
| Geometry/size changes | Reset required | Avoid mid-run lattice rebuild complexity |
| View (slice/orbit) | Store state, no reset | Pure visualization; safe while running |

---

## Testing

```bash
cd ising-sim
make test
```

- `src/sim/__tests__/` — geometry orchestrator, Metropolis, metrics, session
- `src/rendering/__tests__/` — 3D projection
- `src/__tests__/` — store, components, renderer

CI runs `npm test` and `npm run build` on push/PR (`.github/workflows/test.yml`).
