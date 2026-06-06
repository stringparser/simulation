import { isGeometryName } from "../config/geometries";
import { LATTICE_SIZE } from "../config/lattice";
import { SLIDER_PARAMS } from "../config/simulationParams";
import { GeometryOrchestrator } from "../sim/geometry/orchestrator";
import { deriveControlLocks, useControlsPanelState } from "../store/selectors";
import { FieldControl } from "./FieldControl";
import { PanelSection } from "./PanelSection";
import { SliderControl } from "./SliderControl";

const SLICE_AXIS_OPTIONS = [
  { value: 0, label: "Width slice" },
  { value: 1, label: "Height slice" },
  { value: 2, label: "Depth slice" },
] as const;

export function ControlsPanel() {
  const {
    running,
    initialized,
    temperature,
    field,
    coupling,
    geometry,
    dimensions,
    rank,
    sliceAxis,
    sliceIndex,
    viewMode,
    error,
    start,
    pause,
    stepSimulation,
    reset,
    setTemperature,
    setField,
    setCoupling,
    setGeometry,
    setDimension,
    setSliceAxis,
    setSliceIndex,
    setViewMode,
  } = useControlsPanelState();

  const { initLocked, paramsLocked, canStart, canPause, canStep } =
    deriveControlLocks(running, initialized);

  const definition = GeometryOrchestrator.listDefinitions().find(
    (entry) => entry.name === geometry,
  );
  const dimensionLabels = definition?.dimensionLabels ?? ["Width", "Height"];
  const geometryOptions = GeometryOrchestrator.optionsForUi();
  const sliceMax = Math.max(0, (dimensions[sliceAxis] ?? 1) - 1);

  return (
    <PanelSection title="Controls" className="controls-panel">
      {error ? <p className="controls-panel__error">{error}</p> : null}

      <FieldControl label="Geometry">
        <select
          className="control__input"
          value={geometry}
          disabled={initLocked}
          onChange={(event) => {
            const value = event.target.value;
            if (isGeometryName(value)) {
              setGeometry(value);
            }
          }}
        >
          {geometryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldControl>

      <div className={`controls-panel__size-row${rank === 3 ? " controls-panel__size-row--rank3" : ""}`}>
        {dimensions.map((value, axis) => (
          <FieldControl key={dimensionLabels[axis] ?? axis} label={dimensionLabels[axis] ?? `Dim ${axis + 1}`}>
            <input
              className="control__input"
              type="number"
              min={LATTICE_SIZE.min}
              max={LATTICE_SIZE.max}
              value={value}
              disabled={initLocked}
              onChange={(event) => setDimension(axis, Number(event.target.value))}
            />
          </FieldControl>
        ))}
      </div>

      {rank === 3 ? (
        <>
          <FieldControl label="3D view">
            <select
              className="control__input"
              value={viewMode}
              onChange={(event) =>
                setViewMode(event.target.value === "slice" ? "slice" : "orbit")
              }
            >
              <option value="orbit">Orbit (drag lattice)</option>
              <option value="slice">Slice</option>
            </select>
          </FieldControl>

          {viewMode === "slice" ? (
            <div className="controls-panel__slice-row">
              <FieldControl label="Slice">
                <select
                  className="control__input"
                  value={sliceAxis}
                  onChange={(event) => setSliceAxis(Number(event.target.value) as 0 | 1 | 2)}
                >
                  {SLICE_AXIS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldControl>

              <FieldControl label={dimensionLabels[sliceAxis] ?? "Index"}>
                <input
                  className="control__input"
                  type="number"
                  min={0}
                  max={sliceMax}
                  value={sliceIndex}
                  onChange={(event) => setSliceIndex(Number(event.target.value))}
                />
              </FieldControl>
            </div>
          ) : (
            <p className="controls-panel__hint controls-panel__hint--inline">
              Drag the lattice to rotate the cube.
            </p>
          )}
        </>
      ) : null}

      <p className="controls-panel__hint">
        Geometry and size are fixed during a run. Reset to apply changes.
      </p>

      <SliderControl
        label={SLIDER_PARAMS.temperature.label}
        min={SLIDER_PARAMS.temperature.min}
        max={SLIDER_PARAMS.temperature.max}
        step={SLIDER_PARAMS.temperature.step}
        value={temperature}
        disabled={paramsLocked}
        onChange={setTemperature}
      />

      <SliderControl
        label={SLIDER_PARAMS.field.label}
        min={SLIDER_PARAMS.field.min}
        max={SLIDER_PARAMS.field.max}
        step={SLIDER_PARAMS.field.step}
        value={field}
        disabled={paramsLocked}
        onChange={setField}
      />

      <SliderControl
        label={SLIDER_PARAMS.coupling.label}
        min={SLIDER_PARAMS.coupling.min}
        max={SLIDER_PARAMS.coupling.max}
        step={SLIDER_PARAMS.coupling.step}
        value={coupling}
        disabled={paramsLocked}
        onChange={setCoupling}
      />

      <div className="controls-panel__actions">
        <button type="button" className="btn" disabled={!canStart} onClick={start}>
          Start
        </button>
        <button type="button" className="btn" disabled={!canPause} onClick={pause}>
          Pause
        </button>
        <button type="button" className="btn" disabled={!canStep} onClick={() => stepSimulation(1)}>
          Step
        </button>
        <button type="button" className="btn" onClick={reset}>
          Reset
        </button>
      </div>
    </PanelSection>
  );
}
