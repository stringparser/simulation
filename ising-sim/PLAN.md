# Ising Model Simulator — Project Plan

## Goal

Browser-only real-time 2D Ising model simulator:

- **Engine**: TypeScript Monte Carlo in `src/sim/`
- **UI**: React + Zustand + Vite + Jest
- **Geometry**: open edges or periodic (torus), chosen at init/reset
- **Dynamics**: nearest-neighbor Metropolis (v1)

Supports start, pause, step, live lattice visualization, and observables (energy, magnetization, acceptance rate).

---

## Architecture

```
ising-sim/
├── src/
│   ├── sim/           # SimulationSession, geometry, Metropolis, metrics
│   ├── store/         # Zustand store drives local session
│   ├── hooks/         # useSimulationLoop (rAF tick), useLatticeRenderer
│   ├── rendering/     # Canvas renderer + neighbor-color mapping
│   ├── components/    # LatticeView, Controls, Metrics, Sparklines
│   └── config/        # Lattice bounds, geometry options, slider ranges
├── Makefile
└── README.md
```

```
App → simulationStore → SimulationSession
     → useSimulationLoop (50 ms sweeps via requestAnimationFrame)
     → LatticeView → canvas renderer
```

No WebSocket, no Rust backend, no wire protocol.

---

## Physics (baseline)

\[
H = -J \sum_{\langle i,j \rangle} s_i s_j - h \sum_i s_i
\]

- Spins \(s_i \in \{+1, -1\}\)
- Metropolis acceptance: \(\min(1, e^{-\beta \Delta E})\), \(\beta = 1/T\)
- One sweep = `num_sites` random site attempts

---

## Configuration defaults

| Parameter | Default | Notes |
|-----------|---------|-------|
| Size | 16 × 16 | Range 4–64 per side; fixed for a run |
| Geometry | `square_2d_open` | Or `square_2d_periodic` |
| Temperature | 2.5 | Must be > 0 |
| Field | 0 | Adjustable mid-run |
| Coupling | 1 | Adjustable mid-run |
| Sweeps per tick | 1 | While running |

---

## Implementation status

| Phase | Status | Summary |
|-------|--------|---------|
| 1 — Engine | Done | Port Rust core to `src/sim/` + Jest tests |
| 2 — Local store | Done | Zustand drives `SimulationSession` in-process |
| 3 — Remove backend | Done | Deleted Rust server; simplified Makefile/README |
| 4 — Polish | Done | rAF loop, inline errors, flattened repo layout |
| 5 — Observability | Done | Energy/magnetization sparklines, CI workflow |

---

## Future work (post-v1)

- Glauber dynamics and alternate interaction presets
- Web Worker for large lattices (64×64+ at high tick rates)
- Phase diagram / temperature sweep UI
- Delta-encoded lattice updates for very large grids
- URL hash or localStorage for shareable presets

---

## Design decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Browser-only | Simpler deploy; 16×16 is cheap on main thread |
| State | Zustand + module session | Single tab, synchronous init |
| Tick loop | rAF + 50 ms accumulator | Smooth UI; avoids setInterval drift |
| Rendering | Canvas + neighbor colors | Fast; swappable via `LatticeRenderer` |
| Geometry changes | Reset required | Avoid mid-run lattice rebuild complexity |

---

## Testing

```bash
cd ising-sim
make test
```

- `src/sim/__tests__/` — geometry, Metropolis, metrics, session
- `src/__tests__/` — store, components, renderer, neighbor colors

CI runs `npm test` and `npm run build` on push/PR (`.github/workflows/test.yml`).
