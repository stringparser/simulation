import {
  resetSimulationEngineForTests,
  useSimulationStore,
} from "../store/simulationStore";

describe("useSimulationStore", () => {
  beforeEach(() => {
    resetSimulationEngineForTests();
    useSimulationStore.setState({
      error: null,
      spins: null,
      dimensions: [16, 16],
      rank: 2,
      maxNeighbors: 4,
      temperature: 2.5,
      field: 0,
      coupling: 1,
      geometry: "square_2d_open",
      running: false,
      step: 0,
      energy: null,
      magnetization: null,
      acceptanceRate: null,
      energyHistory: [],
      magnetizationHistory: [],
      initialized: false,
      sliceAxis: 2,
      sliceIndex: 3,
      viewMode: "orbit",
    });
  });

  it("initializes a local simulation session", () => {
    useSimulationStore.getState().init({ seed: 7 });

    const state = useSimulationStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.dimensions).toEqual([16, 16]);
    expect(state.spins).toHaveLength(256);
    expect(state.energy).not.toBeNull();
    expect(state.magnetization).not.toBeNull();
  });

  it("advances the step counter when stepping manually", () => {
    useSimulationStore.getState().init({ seed: 1 });
    useSimulationStore.getState().stepSimulation(3);

    const state = useSimulationStore.getState();
    expect(state.step).toBe(3);
    expect(state.running).toBe(false);
    expect(state.acceptanceRate).not.toBeNull();
  });

  it("stores validation errors from invalid init params", () => {
    useSimulationStore.getState().init({ width: 2, height: 16 });

    const state = useSimulationStore.getState();
    expect(state.initialized).toBe(false);
    expect(state.error).toMatch(/lattice size/i);
  });

  it("updates dimension values before reset", () => {
    useSimulationStore.getState().setDimension(0, 20);
    expect(useSimulationStore.getState().dimensions).toEqual([20, 16]);
  });

  it("initializes a 3D cubic simulation", () => {
    useSimulationStore.getState().setGeometry("cubic_3d_open");
    useSimulationStore.getState().init({ seed: 3, dimensions: [8, 8, 8] });

    const state = useSimulationStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.rank).toBe(3);
    expect(state.maxNeighbors).toBe(6);
    expect(state.spins).toHaveLength(512);
  });

  it("clamps slice index when dimensions change", () => {
    useSimulationStore.getState().setGeometry("cubic_3d_open");
    useSimulationStore.getState().setSliceIndex(7);
    useSimulationStore.getState().setDimension(2, 4);

    expect(useSimulationStore.getState().sliceIndex).toBe(3);
  });

  it("updates step on tick when running", () => {
    useSimulationStore.getState().init({ seed: 1 });
    useSimulationStore.getState().start();
    useSimulationStore.getState().tick();

    const state = useSimulationStore.getState();
    expect(state.running).toBe(true);
    expect(state.step).toBeGreaterThan(0);
    expect(state.energyHistory.length).toBe(1);
    expect(state.magnetizationHistory.length).toBe(1);
  });
});
