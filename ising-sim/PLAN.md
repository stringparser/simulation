# Ising Model Simulator — Project Plan

## Goal

Build a real-time Ising model simulator with:

- **Backend**: Rust simulation engine exposed over **WebSockets**
- **Frontend**: TypeScript, React, Zustand, Vite (bundler), Jest (tests)
- **Configurable geometry**: default 2D square lattice with **open edges** (no periodic wrapping)
- **Configurable flip rule**: default **nearest-neighbor Metropolis**; swappable interaction / acceptance logic

The simulator should support stepping, running, pausing, and live visualization of the lattice plus basic observables (energy, magnetization).

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vite + React + Zustand)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ LatticeView  │  │ Controls     │  │ MetricsPanel      │  │
│  │ (renderer)   │  │ T, h, J, run │  │ E, M, step count  │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         └─────────────────┴────────────────────┘            │
│                           │                                 │
│                    WebSocket client                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ JSON messages
┌───────────────────────────┼─────────────────────────────────┐
│  Backend (Rust)           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WebSocket server (tokio + axum or tokio-tungstenite) │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                 │
│  ┌────────────┐  ┌────────┴────────┐  ┌─────────────────┐ │
│  │ Session    │  │ Simulation loop │  │ Metrics         │ │
│  │ manager    │  │ (MC sweeps)     │  │ energy, M, …    │ │
│  └────────────┘  └────────┬────────┘  └─────────────────┘ │
│                           │                                 │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │ Core engine                                            │   │
│  │  geometry → neighbors → local field → flip decision  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Layout

```
ising-sim/
├── PLAN.md
├── README.md
├── backend/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs              # Start WebSocket server, load config
│       ├── lib.rs
│       ├── ws/
│       │   ├── mod.rs
│       │   ├── server.rs        # Connection handling, broadcast
│       │   └── messages.rs      # Serde types for wire protocol
│       ├── session.rs           # One simulation per connected client (or shared)
│       ├── config.rs            # Runtime simulation parameters
│       ├── geometry/
│       │   ├── mod.rs           # Geometry trait + registry
│       │   ├── square_2d.rs     # Default: 2D grid, open edges
│       │   └── periodic_2d.rs   # Optional: torus (PBC)
│       ├── lattice.rs           # Spin storage (+1 / −1), indexing
│       ├── interaction/
│       │   ├── mod.rs           # Interaction trait + registry
│       │   └── nearest_neighbor.rs   # Default flip rule
│       ├── monte_carlo.rs       # Site selection, sweep, dynamics mode
│       └── metrics.rs           # Energy, magnetization, acceptance rate
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── jest.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   └── websocket.ts     # Connect, send, subscribe, reconnect
│       ├── store/
│       │   └── simulationStore.ts
│       ├── components/
│       │   ├── LatticeView.tsx       # Thin wrapper; delegates to renderer
│       │   ├── ControlsPanel.tsx
│       │   └── MetricsPanel.tsx
│       ├── rendering/
│       │   ├── types.ts              # LatticeRenderer interface
│       │   └── canvasRenderer.ts     # Default v1 implementation
│       ├── types/
│       │   └── messages.ts      # Mirror backend wire types
│       └── __tests__/
└── shared/                      # Optional: JSON schema or TS types source of truth
    └── protocol.schema.json
```

Monorepo at repo root is fine; backend and frontend run as separate processes in development.

---

## Physics & Algorithms (Baseline)

### Hamiltonian (ferromagnetic Ising)

\[
H = -J \sum_{\langle i,j \rangle} s_i s_j - h \sum_i s_i
\]

- \(s_i \in \{+1, -1\}\)
- \(J > 0\): ferromagnetic coupling (default \(J = 1\))
- \(h\): external magnetic field (default \(0\))
- \(T\): temperature; \(\beta = 1 / (k_B T)\) with \(k_B = 1\) in code

### Default dynamics: Metropolis–Hastings (single-spin flips)

For site \(i\), local field from neighbors:

\[
\Delta E = 2 s_i \left( h + \sum_{j \in \mathcal{N}(i)} J_{ij}\, s_j \right)
\]

Accept flip with probability \(\min(1, e^{-\beta \Delta E})\).

### Default geometry: 2D square, open edges

- Lattice size \(L_x \times L_y\) (default **16 × 16**)
- Neighbors: up, down, left, right (4-neighbor)
- **Open edges**: sites on the boundary have fewer neighbors (no wrap-around)
- Alternative geometry (phase 2): periodic boundaries (torus)

### Default interaction: nearest neighbor

- \(J_{ij} = J\) if \(j\) is a geometric neighbor of \(i\), else \(0\)
- Uniform coupling; extensible to weighted edges or longer-range stencils

---

## Backend Design (Rust)

### 1. Geometry abstraction

Define a `Geometry` trait (or enum + impl blocks) responsible for:

| Responsibility | Notes |
|----------------|-------|
| `num_sites()` | Total spin count |
| `dimensions()` | e.g. `(width, height)` for 2D rendering |
| `neighbors(site)` | Iterator of neighbor indices (respects boundaries) |
| `index_to_coord` / `coord_to_index` | For debugging and UI |
| `name()` | Wire string, e.g. `"square_2d_open"` |

**Default**: `Square2DOpen { width: 16, height: 16 }`.

**Future**: `Square2DPeriodic`, hexagonal lattice, 1D chain.

**v1 constraint**: geometry is fixed for the lifetime of a run. It is set once in `init` (or on full reset) and cannot be changed mid-run. A new simulation requires reconnecting or sending `init` again.

### 2. Interaction / flip rule abstraction

Separate **geometry** (who are neighbors) from **how coupling and acceptance work**:

```rust
trait Interaction {
    /// Sum of J_ij * s_j over geometric neighbors (local field contribution).
    fn neighbor_sum(&self, lattice: &Lattice, site: usize, geometry: &dyn Geometry) -> f64;

    /// Energy change if site flips; used by Metropolis.
    fn delta_energy(&self, lattice: &Lattice, site: usize, geometry: &dyn Geometry, h: f64) -> f64;
}
```

**Default impl**: `NearestNeighbor { j: f64 }` with \(\Delta E = 2 s_i (h + J \cdot \text{neighbor\_sum})\).

**v1**: only `nearest_neighbor` with **Metropolis** acceptance. The `Interaction` trait exists so alternate rules can be added later without rewriting the MC loop.

**Future variants** (post-v1):

| Name | Behavior |
|------|----------|
| `next_nearest` | Include diagonals with \(J_2\) |
| `glauber` | Same \(\Delta E\), acceptance \(1 / (1 + e^{\beta \Delta E})\) instead of Metropolis |
| `custom_weights` | Per-edge or per-direction \(J\) from config |

Monte Carlo loop stays generic: pick site → compute `delta_energy` → Metropolis accept/reject.

### 3. Lattice & Monte Carlo

- **Storage**: `Vec<i8>` or `Vec<i8>` with values `+1` / `-1`; random initial state (or all up / random seed)
- **Sweep**: one full pass = `num_sites` attempted updates (random or sequential site order)
- **Run loop**: background task on server ticks N sweeps per frame when `running == true`
- **Threading**: single simulation thread per session; WebSocket I/O on async runtime (channel to sim thread)

### 4. WebSocket server

**Stack suggestion**: `tokio` + `axum` (WebSocket upgrade) + `serde` / `serde_json`.

**Development**:

- Backend: `ws://127.0.0.1:8080/ws` (configurable port)
- Frontend Vite dev server proxies `/ws` → backend to avoid CORS issues

**Session model**:

- Each WebSocket connection owns one `SimulationSession`
- Client sends commands; server pushes state updates (no polling)

### 5. Wire protocol (JSON)

All messages: `{ "type": "<variant>", ...payload }`.

**Client → server**

| type | Payload | Effect |
|------|---------|--------|
| `init` | `{ width?, height?, geometry?, temperature, field, coupling, seed? }` | Create / reset simulation (defaults 16×16, `square_2d_open`; geometry fixed after init) |
| `start` | `{ steps_per_tick? }` | Begin continuous updates |
| `pause` | — | Stop continuous updates |
| `step` | `{ sweeps: number }` | Run N sweeps once, push state |
| `set_params` | `{ temperature?, field?, coupling? }` | Update T, h, J mid-run |
| `get_state` | — | Request full snapshot |

**Server → client**

| type | Payload |
|------|---------|
| `ready` | `{ protocol_version }` |
| `state` | `{ spins: number[], width, height, step, geometry }` |
| `metrics` | `{ energy, magnetization, acceptance_rate?, temperature, field, coupling }` |
| `error` | `{ message, code? }` |

**Update strategy** (balance bandwidth vs smoothness):

- On each tick: send `metrics` every frame
- Send full `state` every K sweeps or when paused after `step`
- Optional later: delta encoding (only changed site indices)

### 6. Backend testing

| Layer | Tool | Focus |
|-------|------|-------|
| Geometry | `#\[test\]` | Corner/edge/center neighbor counts on open 2D grid |
| Interaction | unit tests | Known \(\Delta E\) for small hand-built lattices |
| Metropolis | unit tests | \(\Delta E < 0\) always accepts; high-T limit acceptance ≈ 0.5 |
| Metrics | unit tests | Energy of all-up vs all-down on tiny grid |
| WebSocket | integration | `tokio-test` or client that sends `init` + `step`, asserts JSON shape |

Use `proptest` optionally for invariants (energy finite, spins ∈ {±1}).

---

## Frontend Design (React + Zustand + Vite + Jest)

### 1. Zustand store (`simulationStore`)

```ts
interface SimulationState {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  spins: Int8Array | number[] | null;
  width: number;
  height: number;
  temperature: number;
  field: number;
  coupling: number;
  geometry: string;           // set at init; read-only for the run
  running: boolean;
  step: number;
  energy: number | null;
  magnetization: number | null;

  connect: (url?: string) => void;
  disconnect: () => void;
  init: (params: InitParams) => void;
  start: () => void;
  pause: () => void;
  step: (sweeps?: number) => void;
  setParams: (partial: Partial<Params>) => void;
  // internal: apply server messages
}
```

WebSocket handler dispatches incoming messages into the store (single source of truth).

### 2. Lattice rendering (abstracted)

Rendering is an implementation detail. `LatticeView` receives spin data from the store and delegates to a **`LatticeRenderer`** interface:

```ts
interface LatticeRenderer {
  mount(container: HTMLElement): void;
  unmount(): void;
  draw(spins: Int8Array | number[], width: number, height: number): void;
  resize?(width: number, height: number): void;
}
```

**v1 default**: `canvasRenderer` — draws each site as a filled rect on `<canvas>` (good performance headroom as lattice size grows later).

Swapping to DOM grid, WebGL, or offscreen canvas later means adding a new renderer impl and changing one import; `LatticeView`, the store, and the wire protocol stay unchanged.

### 3. Components

| Component | Responsibility |
|-----------|----------------|
| `LatticeView` | Owns renderer lifecycle; passes store spin snapshot to `LatticeRenderer.draw` |
| `ControlsPanel` | Sliders/inputs for T, h, J; Start / Pause / Step / Reset (no geometry picker in v1) |
| `MetricsPanel` | Display E, M, step; simple sparkline later |
| `ConnectionBanner` | WS status, reconnect |

Keep first version minimal: lattice + controls + metrics, no phase diagram yet.

### 4. WebSocket client

- Auto-reconnect with backoff
- Queue outbound messages while connecting
- Parse with typed guards (`isStateMessage`, etc.)
- Vite env: `VITE_WS_URL` defaulting to proxied `/ws`

### 5. Frontend testing (Jest)

| Target | Approach |
|--------|----------|
| Store | Pure tests: mock WS, feed JSON, assert state transitions |
| `canvasRenderer` | Unit tests: given spins + dimensions, assert pixel/color mapping (mock canvas context) |
| Components | React Testing Library: controls call store actions; mock renderer in `LatticeView` tests |
| Message parsing | Unit tests for type guards and edge cases |
| WebSocket hook | Mock `WebSocket` global |

No E2E in v1 unless requested; Jest + RTL is sufficient per requirements.

---

## Configuration Defaults

| Parameter | Default | Notes |
|-----------|---------|-------|
| Geometry | `square_2d_open` | 2D, open edges; **fixed at init**, not changeable mid-run |
| Size | **16 × 16** | Configurable at init only; 256 spins keeps JSON payloads small |
| Dynamics | Metropolis | Only acceptance rule in v1 |
| Interaction | `nearest_neighbor` | 4-neighbor uniform \(J\) |
| Temperature T | 2.5 | Near critical region for demo |
| Field h | 0 | |
| Coupling J | 1 | |
| Initial spins | random ±1 | Seeded RNG |
| Steps per tick | 1 sweep | Tunable when `start` |
| State push rate | every 1 sweep when running | Tunable |
| Renderer | `canvasRenderer` | Behind `LatticeRenderer` interface |

---

## Implementation Phases

### Phase 1 — Backend core (no network)

1. `Cargo.toml`: `rand`, `serde`, `serde_json`
2. `geometry/square_2d.rs`: neighbor lists, open boundaries
3. `lattice.rs`: init, flip, read spin
4. `interaction/nearest_neighbor.rs`: \(\Delta E\)
5. `monte_carlo.rs`: one sweep, Metropolis
6. `metrics.rs`: energy and magnetization
7. Unit tests for 4×4 lattice sanity checks

**Exit criteria**: CLI or test runs 1000 sweeps on 16×16, prints E and M.

### Phase 2 — WebSocket server

1. Add `tokio`, `axum`, `tower-http` (CORS)
2. `messages.rs` + `session.rs`
3. Handle `init`, `step`, `start`, `pause`, `get_state`
4. Push `state` + `metrics` after steps
5. Integration test with mock client

**Exit criteria**: `websocat` or small script can init, step, and receive valid JSON.

### Phase 3 — Frontend scaffold

1. Vite + React + TypeScript template
2. Zustand store + WebSocket client
3. `rendering/types.ts` + `canvasRenderer.ts`; `LatticeView` wired through renderer interface
4. `ControlsPanel` wired to store
5. Vite proxy to backend
6. Jest + RTL setup; store, parser, and renderer tests

**Exit criteria**: Browser shows live 16×16 lattice updating when Start is pressed.

### Phase 4 — Extensibility (post-v1)

- Geometry registry expansion (`square_2d_periodic`, etc.) + `set_geometry` wire message
- Alternate interaction / dynamics presets (Glauber, next-nearest)
- UI controls for geometry and interaction selection
- Larger default lattice sizes once rendering and payload strategy are validated

### Phase 5 — Polish (optional)

- Charts for M(t), E(t)
- README with run instructions
- Docker or `justfile` for `dev` / `test` / `build`

---

## Development Workflow

```bash
# Terminal 1 — backend
cd backend && cargo run

# Terminal 2 — frontend
cd frontend && npm install && npm run dev

# Tests
cd backend && cargo test
cd frontend && npm test
```

Suggested `README.md` sections: prerequisites (Rust, Node 20+), env vars, protocol summary, architecture diagram.

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transport | WebSocket | Real-time push; user requirement |
| Lattice size (v1) | 16 × 16 | Small enough for fast iteration; easy full-state JSON |
| Geometry (v1) | Fixed at init | Simpler session model; no mid-run rebuild |
| Dynamics (v1) | Metropolis only | Single code path; Glauber deferred |
| Geometry vs interaction | Separate traits | Future extensibility without rewriting MC core |
| Open edges default | Yes | Matches “2D with edges”; PBC is post-v1 |
| Lattice rendering | `LatticeRenderer` trait; canvas default | Swap backend without touching store or protocol |
| JSON protocol | Serde on both sides | Simple debugging; binary/deltas later if needed |
| One session per connection | Yes | Avoid shared mutable sim state across clients |
| Sync sim, async I/O | Channel to blocking thread | MC loop is CPU-bound; keeps WS responsive |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large lattice JSON payloads | Start at 16×16; canvas renderer ready when size increases |
| UI jank on fast updates | Batch sweeps; `requestAnimationFrame` in renderer draw path |
| Config explosion | Named presets in registry; validate on server |
| Test flakiness (RNG) | Fixed seeds in tests; separate stochastic property tests |

---

## Out of Scope (v1)

- Mid-run geometry or interaction changes
- Glauber dynamics and non–nearest-neighbor stencils
- 3D visualization
- Wolff / cluster algorithms
- Multi-client shared simulation rooms
- Authentication / persistence
- WASM backend in browser

These can be added later without breaking the wire protocol if `geometry` and `interaction` remain extensible string keys with versioned payloads.

---

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Lattice size | **16 × 16** default; set at init |
| Geometry changes | **Fixed for the whole run**; new geometry requires `init` / reset |
| Dynamics | **Metropolis only** in v1 |
| Rendering | **`LatticeRenderer` abstraction** with **canvas** as the default implementation |

Phase 1 can start with these defaults.
