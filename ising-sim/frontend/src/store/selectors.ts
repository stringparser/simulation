import { useShallow } from "zustand/react/shallow";
import type { ConnectionStatus } from "../types/messages";
import { useSimulationStore } from "./simulationStore";

export function deriveControlLocks(
  connectionStatus: ConnectionStatus,
  running: boolean,
  initialized: boolean,
) {
  const disabled = connectionStatus !== "connected";

  return {
    disabled,
    initLocked: disabled || running,
    paramsLocked: disabled || !initialized,
    canStart: !disabled && initialized && !running,
    canPause: !disabled && initialized && running,
    canStep: !disabled && initialized && !running,
  };
}

export function useControlsPanelState() {
  return useSimulationStore(
    useShallow((state) => ({
      connectionStatus: state.connectionStatus,
      running: state.running,
      initialized: state.initialized,
      temperature: state.temperature,
      field: state.field,
      coupling: state.coupling,
      geometry: state.geometry,
      width: state.width,
      height: state.height,
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

export function useConnectionState() {
  return useSimulationStore(
    useShallow((state) => ({
      connectionStatus: state.connectionStatus,
      error: state.error,
    })),
  );
}
