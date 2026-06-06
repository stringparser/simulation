import { useSimulationStore } from "../store/simulationStore";

export function ControlsPanel() {
  const connectionStatus = useSimulationStore((state) => state.connectionStatus);
  const running = useSimulationStore((state) => state.running);
  const initialized = useSimulationStore((state) => state.initialized);
  const temperature = useSimulationStore((state) => state.temperature);
  const field = useSimulationStore((state) => state.field);
  const coupling = useSimulationStore((state) => state.coupling);
  const start = useSimulationStore((state) => state.start);
  const pause = useSimulationStore((state) => state.pause);
  const stepSimulation = useSimulationStore((state) => state.stepSimulation);
  const reset = useSimulationStore((state) => state.reset);
  const setTemperature = useSimulationStore((state) => state.setTemperature);
  const setField = useSimulationStore((state) => state.setField);
  const setCoupling = useSimulationStore((state) => state.setCoupling);

  const disabled = connectionStatus !== "connected";

  return (
    <section className="controls-panel">
      <h2>Controls</h2>

      <label className="controls-panel__field">
        <span>Temperature</span>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={temperature}
          disabled={disabled || !initialized}
          onChange={(event) => setTemperature(Number(event.target.value))}
        />
        <output>{temperature.toFixed(1)}</output>
      </label>

      <label className="controls-panel__field">
        <span>Field h</span>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          value={field}
          disabled={disabled || !initialized}
          onChange={(event) => setField(Number(event.target.value))}
        />
        <output>{field.toFixed(1)}</output>
      </label>

      <label className="controls-panel__field">
        <span>Coupling J</span>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={coupling}
          disabled={disabled || !initialized}
          onChange={(event) => setCoupling(Number(event.target.value))}
        />
        <output>{coupling.toFixed(1)}</output>
      </label>

      <div className="controls-panel__actions">
        <button type="button" disabled={disabled || !initialized || running} onClick={start}>
          Start
        </button>
        <button type="button" disabled={disabled || !initialized || !running} onClick={pause}>
          Pause
        </button>
        <button
          type="button"
          disabled={disabled || !initialized || running}
          onClick={() => stepSimulation(1)}
        >
          Step
        </button>
        <button type="button" disabled={disabled} onClick={reset}>
          Reset
        </button>
      </div>
    </section>
  );
}
