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
      dimensions: state.dimensions,
      error: state.error,
      start: state.start,
      pause: state.pause,
      stepSimulation: state.stepSimulation,
      reset: state.reset,
      setTemperature: state.setTemperature,
      setField: state.setField,
      setCoupling: state.setCoupling,
      setGeometry: state.setGeometry,
      setDimension: state.setDimension,
      rank: state.rank,
      sliceAxis: state.sliceAxis,
      sliceIndex: state.sliceIndex,
      viewMode: state.viewMode,
      setSliceAxis: state.setSliceAxis,
      setSliceIndex: state.setSliceIndex,
      setViewMode: state.setViewMode,
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
      dimensions: state.dimensions,
    })),
  );
}

export function useLatticeViewState() {
  return useSimulationStore(
    useShallow((state) => ({
      initialized: state.initialized,
      spins: state.spins,
      dimensions: state.dimensions,
      rank: state.rank,
      maxNeighbors: state.maxNeighbors,
      step: state.step,
      geometry: state.geometry,
      sliceAxis: state.sliceAxis,
      sliceIndex: state.sliceIndex,
      viewMode: state.viewMode,
    })),
  );
}
