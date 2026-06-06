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
      width: 16,
      height: 16,
      temperature: 2.5,
      field: 0,
      coupling: 1,
      geometry: "square_2d_open",
      running: false,
      step: 0,
      energy: null,
      magnetization: null,
      acceptanceRate: null,
      initialized: false,
    });
  });

  it("initializes a local simulation session", () => {
    useSimulationStore.getState().init({ seed: 7 });

    const state = useSimulationStore.getState();
    expect(state.initialized).toBe(true);
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

  it("updates step on tick when running", () => {
    useSimulationStore.getState().init({ seed: 1 });
    useSimulationStore.getState().start();
    useSimulationStore.getState().tick();

    const state = useSimulationStore.getState();
    expect(state.running).toBe(true);
    expect(state.step).toBeGreaterThan(0);
  });
});
