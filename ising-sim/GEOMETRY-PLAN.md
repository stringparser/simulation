# Geometry Orchestrator — Implementation Plan

Track refactor work to centralize lattice topology, configuration, validation, and visualization helpers behind a single **GeometryOrchestrator** API. Enables 3D geometries later without scattering changes across store, session, config, and rendering.

**Status:** Not started  
**Branch target:** `cursor/ising-sim-plan` (or follow-up branch)  
**Prerequisite:** Browser-only app at `ising-sim/` root (flatten complete)

---

## Problem

Geometry concerns are spread across many modules:

| Module | Today |
|--------|-------|
| `config/geometries.ts` | Names, labels, UI options |
| `config/lattice.ts` | Size bounds (width/height only) |
| `sim/config.ts` | Merges `width`, `height`, `geometry` into init |
| `sim/geometry/*` | Topology (neighbors, coords) |
| `sim/session.ts` | Creates geometry; snapshot duplicates width/height |
| `rendering/neighborColors.ts` | **Re-implements** neighbor rules for coloring |
| `store/simulationStore.ts` | Separate `width`, `height`, `geometry` state |
| `rendering/types.ts` | `draw(spins, width, height, geometryName)` |

The Monte Carlo loop only needs `numSites()` and `neighbors(site)`. Everything else is orchestration — it should live in one place.

---

## Goal

Introduce a **GeometryOrchestrator** as the only public geometry API for UI, store, session, and rendering.

After this refactor:

- Adding a geometry = **one registry entry** + **one impl class** (no store/renderer/config edits).
- Coloring uses the same neighbor graph as physics (delete duplicated topology in rendering).
- Snapshots carry generic `dimensions[]` and `rank` (ready for 3D).
- 2D behavior and tests remain unchanged until Phase 4 explicitly adds 3D.

---

## Target architecture

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
                          │   (registry / presets)     (open2d, periodic2d, …)
                          │
                          └──► LatticeRenderer
                                    │
                                    └── reconstructs GeometryInstance from snapshot
```

**Rule:** No module outside `sim/geometry/` imports concrete geometry classes (`open.ts`, `periodic.ts`) directly.

---

## Core types

### Slim internal `Geometry` (MC only)

```ts
interface Geometry {
  numSites(): number;
  neighbors(site: number): readonly number[];
}
```

Metropolis, metrics, and interaction use only this interface.

### `GeometryDefinition` (registry preset)

```ts
interface GeometryDefinition {
  name: GeometryName;
  label: string;
  rank: 2 | 3;
  defaultDimensions: readonly number[];
  dimensionLabels: readonly string[];  // e.g. ["Width", "Height"] or [..., "Depth"]

  validate(dimensions: readonly number[]): void;
  createCore(dimensions: readonly number[]): Geometry;
  maxNeighbors(dimensions: readonly number[]): number;
}
```

Shared bounds (min 4, max 64 per axis) live in one validator reused by all definitions.

### `GeometryInstance` (runtime handle)

```ts
interface GeometryInstance {
  readonly definition: GeometryDefinition;
  readonly dimensions: readonly number[];
  readonly core: Geometry;

  numSites(): number;
  neighbors(site: number): readonly number[];
  indexToCoord(site: number): readonly number[];
  coordToIndex(coord: readonly number[]): number | null;
  maxNeighbors(): number;

  // Single source of truth for viz (replaces neighborColors topology)
  alignedNeighborCount(site: number, spins: Int8Array | number[]): number;
  colorForSite(site: number, spins: Int8Array | number[], palette?: ColorPalette): string;
}
```

### `GeometryOrchestrator` (facade)

```ts
class GeometryOrchestrator {
  static listDefinitions(): readonly GeometryDefinition[];
  static optionsForUi(): Array<{ value: GeometryName; label: string; rank: number }>;
  static defaultDimensions(name: GeometryName): readonly number[];
  static validate(name: GeometryName, dimensions: readonly number[]): void;
  static create(name: GeometryName, dimensions: readonly number[]): GeometryInstance;
  static createFromSnapshot(snapshot: Pick<SessionSnapshot, "geometry" | "dimensions">): GeometryInstance;
}
```

Registry: static array in `definitions.ts` (type-safe presets). No JSON/plugins in v1.

---

## Snapshot shape (new)

Replace separate `width` / `height` on session snapshot and store:

```ts
interface SessionSnapshot {
  spins: number[];
  geometry: GeometryName;
  dimensions: readonly number[];   // [Lx, Ly] or [Lx, Ly, Lz]
  rank: number;
  maxNeighbors: number;
  step: number;
}
```

**Backward compatibility during migration:** store may expose `width` / `height` getters for 2D UI until Phase 3.

---

## Renderer shape (new)

```ts
interface LatticeRenderer {
  mount(container: HTMLElement): void;
  unmount(): void;
  draw(snapshot: SessionSnapshot, options?: RenderOptions): void;
}

interface RenderOptions {
  slice?: { axis: 0 | 1 | 2; index: number };  // used when rank === 3 (Phase 4)
}
```

Renderer reconstructs `GeometryInstance` via `GeometryOrchestrator.createFromSnapshot(snapshot)`.

---

## Implementation phases

### Phase 1 — Orchestrator + session (no UI change)

**Work**

1. Add `src/sim/geometry/definitions.ts` — registry with `square_2d_open`, `square_2d_periodic`.
2. Add `src/sim/geometry/instance.ts` — `GeometryInstance` with coord helpers delegated to core/definition.
3. Add `src/sim/geometry/orchestrator.ts` — facade API.
4. Move `createGeometry()` logic into orchestrator; deprecate direct factory export.
5. Add `validateDimensions()` in `config/lattice.ts` (accept `readonly number[]`, keep per-axis min/max).
6. Wire `SimulationSession` to hold `GeometryInstance` instead of raw `Geometry` + config width/height.
7. Update `SessionSnapshot` to include `dimensions`, `rank`, `maxNeighbors` (keep `width`/`height` as deprecated aliases temporarily if needed for compile).

**Do not change:** ControlsPanel, canvas renderer API, store field names (yet).

**Tests**

- New: `orchestrator.test.ts` — registry lists 2 presets, validate rejects bad dims, create matches old neighbor counts.
- Existing sim geometry/session tests must pass.

**Exit criteria**

- Session creates via orchestrator internally.
- All tests green; app behavior unchanged in browser.

---

### Phase 2 — Unified coloring (delete duplication)

**Work**

1. Implement `alignedNeighborCount` / `colorForSite` on `GeometryInstance` (move logic from `neighborColors.ts`).
2. Update `canvasRenderer` to use `GeometryInstance` for coloring (session passes layout or renderer reconstructs from snapshot fields).
3. Keep pure color math (`lerpColor`, palette) in `rendering/colors.ts` or `config/colors.ts`.
4. Delete topology functions from `neighborColors.ts` (`neighborCoordinates`, `neighborCount`, geometry name switches).
5. Rewrite `neighborColors.test.ts` → `geometryInstance.test.ts` or fold into orchestrator tests.

**Exit criteria**

- No `GeometryName` switch for neighbors outside `sim/geometry/`.
- Canvas appearance identical to before (pixel/regression via existing canvas tests).

---

### Phase 3 — Store + snapshot-driven renderer

**Work**

1. Store: replace `width` / `height` with `dimensions: number[]`; derive 2D helpers where needed.
2. `init()` / `reset()` pass `dimensions` + `geometry` to session.
3. `setWidth` / `setHeight` → generic `setDimension(axis, value)` with orchestrator validation.
4. Update selectors and components to read `dimensions[0]`, `dimensions[1]`.
5. Change `LatticeRenderer.draw` to accept `SessionSnapshot`.
6. Update `useLatticeRenderer` hook accordingly.

**Exit criteria**

- No `width`/`height` on store or snapshot (except optional deprecated getters removed).
- 2D app fully functional; tests updated.

---

### Phase 4 — 3D definitions + slice UI (optional follow-up)

**Work**

1. Add `cubic_3d_open`, `cubic_3d_periodic` to registry + impl classes.
2. Add depth input to ControlsPanel when `rank === 3` ( driven by `definition.dimensionLabels` ).
3. Add `canvasSliceRenderer` or extend canvas renderer with `RenderOptions.slice`.
4. Store: `sliceAxis`, `sliceIndex` (view-only, can change while running).
5. Cap max volume (e.g. `Lx·Ly·Lz ≤ 32768`) in shared validator.

**Exit criteria**

- Can run 8×8×8 cubic sim; view xy/xz/yz slices.
- 2D presets unchanged.

**Defer:** WebGL, hex lattice, custom stencils.

---

### Phase 5 — Docs + cleanup

**Work**

1. Update `README.md` and `PLAN.md` — orchestrator diagram, geometry table, dimension model.
2. Remove deprecated exports (`createGeometry` public alias if kept).
3. Delete empty / obsolete files.
4. Mark this file (`GEOMETRY-PLAN.md`) phases complete as work lands.

---

## File map (after Phase 3)

```
src/sim/geometry/
  types.ts           # Geometry (slim), GeometryDefinition, GeometryInstance interfaces
  definitions.ts     # Registry: square_2d_open, square_2d_periodic
  orchestrator.ts    # GeometryOrchestrator facade
  instance.ts        # GeometryInstance implementation
  open2d.ts          # rename from open.ts (optional)
  periodic2d.ts      # rename from periodic.ts (optional)
  index.ts           # public exports: orchestrator, types, GeometryName from config

src/config/
  geometries.ts      # GeometryName union + DEFAULT; labels from orchestrator.optionsForUi()
  lattice.ts         # validateDimensions(dims), clampDimension, maxVolume

src/rendering/
  types.ts           # snapshot-based LatticeRenderer
  canvasRenderer.ts  # uses GeometryInstance.colorForSite
  colors.ts          # lerp / palette helpers (extracted from neighborColors)

src/store/
  simulationStore.ts # dimensions[], geometry

DELETED (Phase 2):
  rendering/neighborColors.ts  # topology removed; color math moved
```

---

## Testing strategy

| Layer | Tests |
|-------|-------|
| Orchestrator | Registry, validation, create, 2D neighbor parity with old impl |
| GeometryInstance | alignedNeighborCount, colorForSite on tiny grids |
| Session | Snapshot shape, init with dimensions |
| Store | setDimension validation, reset preserves geometry choice |
| Renderer | Canvas output unchanged for 2D fixtures |
| Components | ControlsPanel shows correct inputs per rank (Phase 4) |

Run after each phase: `cd ising-sim && make test && npm run build`.

---

## PR breakdown (recommended)

| PR | Phases | Description |
|----|--------|-------------|
| 1 | Phase 1 | Orchestrator + session internal wiring |
| 2 | Phase 2 | Unified coloring, delete neighborColors topology |
| 3 | Phase 3 | Store dimensions + snapshot renderer API |
| 4 | Phase 4 + 5 | 3D presets + slice UI + docs (optional split) |

Keep PRs reviewable; do not combine Phase 1–3 in one diff.

---

## Migration notes

### `SimInitParams`

```ts
// Accept during transition:
{ width?, height?, depth?, geometry?, ... }

// Normalize in initParamsToConfig:
dimensions: [width ?? 16, height ?? 16]           // 2D
dimensions: [width ?? 8, height ?? 8, depth ?? 8] // 3D when geometry rank === 3
```

### Store selectors

```ts
// Temporary helpers (remove in Phase 3):
function latticeWidth(state) { return state.dimensions[0]; }
function latticeHeight(state) { return state.dimensions[1]; }
```

### Risk: snapshot cache in session

`refreshSnapshot()` must copy `dimensions` from `GeometryInstance`, not from stale config fields.

---

## Out of scope

- WebGL / Three.js renderer
- JSON/plugin geometry registry
- Mid-run geometry or dimension changes (still requires Reset)
- Glauber dynamics or non–nearest-neighbor stencils
- 4D lattices

---

## Success criteria (whole refactor)

- [ ] One registry file lists all geometry presets
- [ ] Session, store, renderer import only `GeometryOrchestrator`
- [ ] No duplicated neighbor topology in rendering
- [ ] Snapshot uses `dimensions[]` + `rank`
- [ ] 2D UI and viz unchanged from user perspective
- [ ] Adding 3D = registry entry + impl + slice UI (Phase 4 only)

---

## Checklist (update as you go)

- [ ] Phase 1 — Orchestrator + session
- [ ] Phase 2 — Unified coloring
- [ ] Phase 3 — Store + snapshot renderer
- [ ] Phase 4 — 3D + slices
- [ ] Phase 5 — Docs + cleanup
