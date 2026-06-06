import { GEOMETRY_OPTIONS } from "../config/geometries";
import { LATTICE_SIZE } from "../config/lattice";
import { useSimulationStore } from "../store/simulationStore";
import { SliderControl } from "./SliderControl";

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
  const paramsLocked = disabled || !initialized;

  return (
    <section className="controls-panel">
      <h2 className="side-panel__heading">Controls</h2>

      <label className="field-control">
        <span className="field-control__label">Geometry</span>
        <select
          className="field-control__input"
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
        <label className="field-control">
          <span className="field-control__label">Width</span>
          <input
            className="field-control__input"
            type="number"
            min={LATTICE_SIZE.min}
            max={LATTICE_SIZE.max}
            value={width}
            disabled={initLocked}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
        <label className="field-control">
          <span className="field-control__label">Height</span>
          <input
            className="field-control__input"
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

      <SliderControl
        label="Temperature"
        min={0.5}
        max={5}
        step={0.1}
        value={temperature}
        disabled={paramsLocked}
        onChange={setTemperature}
      />

      <SliderControl
        label="Field h"
        min={-2}
        max={2}
        step={0.1}
        value={field}
        disabled={paramsLocked}
        onChange={setField}
      />

      <SliderControl
        label="Coupling J"
        min={0.1}
        max={2}
        step={0.1}
        value={coupling}
        disabled={paramsLocked}
        onChange={setCoupling}
      />

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
