import { GEOMETRY_OPTIONS } from "../config/geometries";
import { LATTICE_SIZE } from "../config/lattice";
import { useSimulationStore } from "../store/simulationStore";

export function ControlsPanel() {
  const connectionStatus = useSimulationStore((state) => state.connectionStatus);
  const running = useSimulationStore((state) => state.running);
  const initialized = useSimulationStore((state) => state.initialized);
  const temperature = useSimulationStore((state) => state.temperature);
  const field = useSimulationStore((state) => state.field);
  const coupling = useSimulationStore((state) => state.coupling);
  const geometry = useSimulationStore((state) => state.geometry);
  const width = useSimulationStore((state) => state.width);
  const height = useSimulationStore((state) => state.height);
  const start = useSimulationStore((state) => state.start);
  const pause = useSimulationStore((state) => state.pause);
  const stepSimulation = useSimulationStore((state) => state.stepSimulation);
  const reset = useSimulationStore((state) => state.reset);
  const setTemperature = useSimulationStore((state) => state.setTemperature);
  const setField = useSimulationStore((state) => state.setField);
  const setCoupling = useSimulationStore((state) => state.setCoupling);
  const setGeometry = useSimulationStore((state) => state.setGeometry);
  const setWidth = useSimulationStore((state) => state.setWidth);
  const setHeight = useSimulationStore((state) => state.setHeight);

  const disabled = connectionStatus !== "connected";
  const initLocked = disabled || running;

  return (
    <section className="controls-panel">
      <h2>Controls</h2>

      <label className="controls-panel__select">
        <span>Geometry</span>
        <select
          value={geometry}
          disabled={initLocked}
          onChange={(event) => setGeometry(event.target.value)}
        >
          {GEOMETRY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="controls-panel__size-row">
        <label className="controls-panel__size">
          <span>Width</span>
          <input
            type="number"
            min={LATTICE_SIZE.min}
            max={LATTICE_SIZE.max}
            value={width}
            disabled={initLocked}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
        <label className="controls-panel__size">
          <span>Height</span>
          <input
            type="number"
            min={LATTICE_SIZE.min}
            max={LATTICE_SIZE.max}
            value={height}
            disabled={initLocked}
            onChange={(event) => setHeight(Number(event.target.value))}
          />
        </label>
      </div>
      <p className="controls-panel__hint">
        Geometry and size are fixed during a run. Reset to apply changes.
      </p>

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
