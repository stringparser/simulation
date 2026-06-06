import { create } from "zustand";
import {
  DEFAULT_GEOMETRY,
  type GeometryName,
} from "../config/geometries";
import { clampLatticeSize, LATTICE_SIZE } from "../config/lattice";
import { SIMULATION_DEFAULTS } from "../config/simulationParams";
import {
  SimulationError,
  SimulationSession,
  type SimInitParams,
} from "../sim";

const DEFAULT_WIDTH = LATTICE_SIZE.defaultWidth;
const DEFAULT_HEIGHT = LATTICE_SIZE.defaultHeight;
const TICK_MS = 50;

let session: SimulationSession | null = null;

function errorMessage(error: unknown): string {
  if (error instanceof SimulationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected simulation error";
}

function syncFromSession(current: SimulationSession) {
  const snapshot = current.getSnapshot();
  const metrics = current.getMetrics();

  return {
    spins: snapshot.spins,
    width: snapshot.width,
    height: snapshot.height,
    step: snapshot.step,
    geometry: snapshot.geometry,
    energy: metrics.energy,
    magnetization: metrics.magnetization,
    acceptanceRate: metrics.acceptanceRate,
    temperature: metrics.temperature,
    field: metrics.field,
    coupling: metrics.coupling,
    initialized: true,
    error: null as string | null,
  };
}

export interface SimulationStore {
  error: string | null;
  spins: number[] | null;
  width: number;
  height: number;
  temperature: number;
  field: number;
  coupling: number;
  geometry: GeometryName;
  running: boolean;
  step: number;
  energy: number | null;
  magnetization: number | null;
  acceptanceRate: number | null;
  initialized: boolean;
  init: (params?: SimInitParams) => void;
  reset: () => void;
  start: () => void;
  pause: () => void;
  stepSimulation: (sweeps?: number) => void;
  tick: () => void;
  setTemperature: (temperature: number) => void;
  setField: (field: number) => void;
  setCoupling: (coupling: number) => void;
  setGeometry: (geometry: GeometryName) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}

export const TICK_INTERVAL_MS = TICK_MS;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  error: null,
  spins: null,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  temperature: SIMULATION_DEFAULTS.temperature,
  field: SIMULATION_DEFAULTS.field,
  coupling: SIMULATION_DEFAULTS.coupling,
  geometry: DEFAULT_GEOMETRY,
  running: false,
  step: 0,
  energy: null,
  magnetization: null,
  acceptanceRate: null,
  initialized: false,

  init: (params) => {
    const state = get();
    const initParams: SimInitParams = {
      width: params?.width ?? state.width,
      height: params?.height ?? state.height,
      geometry: params?.geometry ?? state.geometry,
      temperature: params?.temperature ?? state.temperature,
      field: params?.field ?? state.field,
      coupling: params?.coupling ?? state.coupling,
      seed: params?.seed,
    };

    try {
      session = SimulationSession.create(initParams);
      set({ ...syncFromSession(session), running: false });
    } catch (error) {
      session = null;
      set({
        running: false,
        initialized: false,
        error: errorMessage(error),
      });
    }
  },

  reset: () => {
    session?.pause();
    set({
      running: false,
      error: null,
    });
    get().init();
  },

  start: () => {
    if (!session) {
      set({ error: SimulationError.notInitialized().message });
      return;
    }

    session.start(1);
    set({ running: true, error: null });
  },

  pause: () => {
    session?.pause();
    if (session) {
      set({ ...syncFromSession(session), running: false });
      return;
    }
    set({ running: false });
  },

  stepSimulation: (sweeps = 1) => {
    if (!session) {
      set({ error: SimulationError.notInitialized().message });
      return;
    }

    try {
      session.runSweeps(sweeps);
      set({ ...syncFromSession(session), running: false });
    } catch (error) {
      session.pause();
      set({ running: false, error: errorMessage(error) });
    }
  },

  tick: () => {
    if (!session || !get().running) {
      return;
    }

    try {
      session.runSweeps(session.getSweepsPerTick());
      const synced = syncFromSession(session);
      set({
        spins: synced.spins,
        step: synced.step,
        energy: synced.energy,
        magnetization: synced.magnetization,
        acceptanceRate: synced.acceptanceRate,
        error: null,
      });
    } catch (error) {
      session.pause();
      set({ running: false, error: errorMessage(error) });
    }
  },

  setTemperature: (temperature) => {
    set({ temperature });
    if (!session) {
      return;
    }

    try {
      session.setParams({ temperature });
      set(syncFromSession(session));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  setField: (field) => {
    set({ field });
    if (!session) {
      return;
    }

    try {
      session.setParams({ field });
      set(syncFromSession(session));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  setCoupling: (coupling) => {
    set({ coupling });
    if (!session) {
      return;
    }

    try {
      session.setParams({ coupling });
      set(syncFromSession(session));
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  setGeometry: (geometry) => {
    set({ geometry });
  },

  setWidth: (width) => {
    set({ width: clampLatticeSize(width, get().width) });
  },

  setHeight: (height) => {
    set({ height: clampLatticeSize(height, get().height) });
  },
}));

export function resetSimulationEngineForTests(): void {
  session = null;
}
