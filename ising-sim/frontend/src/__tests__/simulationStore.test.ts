import {
  resetSimulationClientForTests,
  useSimulationStore,
} from "../store/simulationStore";

describe("useSimulationStore", () => {
  beforeEach(() => {
    resetSimulationClientForTests();
    useSimulationStore.setState({
      connectionStatus: "disconnected",
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

  it("updates state and metrics from server messages", () => {
    useSimulationStore.getState().applyServerMessage({
      type: "state",
      spins: [1, -1, 1, -1],
      width: 2,
      height: 2,
      step: 4,
      geometry: "square_2d_open",
    });

    useSimulationStore.getState().applyServerMessage({
      type: "metrics",
      energy: -1.5,
      magnetization: 0,
      acceptance_rate: 0.25,
      temperature: 2.5,
      field: 0,
      coupling: 1,
    });

    const state = useSimulationStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.step).toBe(4);
    expect(state.energy).toBe(-1.5);
    expect(state.acceptanceRate).toBe(0.25);
  });

  it("marks running false when an error arrives", () => {
    useSimulationStore.setState({ running: true });
    useSimulationStore.getState().applyServerMessage({
      type: "error",
      message: "boom",
      code: "test",
    });

    expect(useSimulationStore.getState().running).toBe(false);
    expect(useSimulationStore.getState().error).toBe("boom");
  });
});
