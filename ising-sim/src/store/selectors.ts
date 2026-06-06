import { useShallow } from "zustand/react/shallow";
import { useSimulationStore } from "./simulationStore";

export function deriveControlLocks(running: boolean, initialized: boolean) {
  return {
    initLocked: running,
    paramsLocked: !initialized,
    canStart: initialized && !running,
    canPause: initialized && running,
    canStep: initialized && !running,
  };
}

export function useControlsPanelState() {
  return useSimulationStore(
    useShallow((state) => ({
      running: state.running,
      initialized: state.initialized,
      temperature: state.temperature,
      field: state.field,
      coupling: state.coupling,
      geometry: state.geometry,
      width: state.width,
      height: state.height,
      error: state.error,
      start: state.start,
      pause: state.pause,
      stepSimulation: state.stepSimulation,
      reset: state.reset,
      setTemperature: state.setTemperature,
      setField: state.setField,
      setCoupling: state.setCoupling,
      setGeometry: state.setGeometry,
      setWidth: state.setWidth,
      setHeight: state.setHeight,
    })),
  );
}

export function useMetricsPanelState() {
  return useSimulationStore(
    useShallow((state) => ({
      step: state.step,
      energy: state.energy,
      magnetization: state.magnetization,
      acceptanceRate: state.acceptanceRate,
      energyHistory: state.energyHistory,
      magnetizationHistory: state.magnetizationHistory,
      geometry: state.geometry,
      width: state.width,
      height: state.height,
    })),
  );
}

export function useLatticeViewState() {
  return useSimulationStore(
    useShallow((state) => ({
      spins: state.spins,
      width: state.width,
      height: state.height,
      geometry: state.geometry,
      initialized: state.initialized,
    })),
  );
}
