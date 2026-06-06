import { create } from "zustand";
import {
  DEFAULT_GEOMETRY,
  type GeometryName,
  isGeometryName,
} from "../config/geometries";
import { clampLatticeSize, LATTICE_SIZE } from "../config/lattice";
import { SIMULATION_DEFAULTS } from "../config/simulationParams";
import { SimulationClient } from "../api/websocket";
import type {
  ConnectionStatus,
  InitParams,
  ServerMessage,
} from "../types/messages";

const DEFAULT_WIDTH = LATTICE_SIZE.defaultWidth;
const DEFAULT_HEIGHT = LATTICE_SIZE.defaultHeight;

export interface SimulationStore {
  connectionStatus: ConnectionStatus;
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
  connect: (url?: string) => void;
  disconnect: () => void;
  init: (params?: InitParams) => void;
  reset: () => void;
  start: () => void;
  pause: () => void;
  stepSimulation: (sweeps?: number) => void;
  setTemperature: (temperature: number) => void;
  setField: (field: number) => void;
  setCoupling: (coupling: number) => void;
  setGeometry: (geometry: GeometryName) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  applyServerMessage: (message: ServerMessage) => void;
}

let client: SimulationClient | null = null;

function buildInitPayload(
  state: Pick<
    SimulationStore,
    "width" | "height" | "temperature" | "field" | "coupling" | "geometry"
  >,
  params?: InitParams,
) {
  return {
    type: "init" as const,
    width: params?.width ?? state.width,
    height: params?.height ?? state.height,
    geometry: params?.geometry ?? state.geometry,
    temperature: params?.temperature ?? state.temperature,
    field: params?.field ?? state.field,
    coupling: params?.coupling ?? state.coupling,
    seed: params?.seed,
  };
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  connectionStatus: "disconnected",
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

  connect: (url) => {
    if (client) {
      return;
    }

    client = new SimulationClient(
      url,
      (message) => get().applyServerMessage(message),
      (connectionStatus) => set({ connectionStatus }),
    );
    client.connect();
  },

  disconnect: () => {
    client?.disconnect();
    client = null;
    set({ connectionStatus: "disconnected", running: false });
  },

  init: (params) => {
    const state = get();
    client?.send(buildInitPayload(state, params));
  },

  reset: () => {
    set({
      running: false,
      step: 0,
      spins: null,
      energy: null,
      magnetization: null,
      acceptanceRate: null,
      initialized: false,
      error: null,
    });
    get().init();
  },

  start: () => {
    set({ running: true });
    client?.send({ type: "start", steps_per_tick: 1 });
  },

  pause: () => {
    set({ running: false });
    client?.send({ type: "pause" });
  },

  stepSimulation: (sweeps = 1) => {
    client?.send({ type: "step", sweeps });
  },

  setTemperature: (temperature) => {
    set({ temperature });
    client?.send({ type: "set_params", temperature });
  },

  setField: (field) => {
    set({ field });
    client?.send({ type: "set_params", field });
  },

  setCoupling: (coupling) => {
    set({ coupling });
    client?.send({ type: "set_params", coupling });
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

  applyServerMessage: (message) => {
    switch (message.type) {
      case "ready":
        if (!get().initialized) {
          get().init();
        }
        break;
      case "state":
        set({
          spins: message.spins,
          width: message.width,
          height: message.height,
          step: message.step,
          geometry: isGeometryName(message.geometry)
            ? message.geometry
            : get().geometry,
          initialized: true,
          error: null,
        });
        break;
      case "metrics":
        set({
          energy: message.energy,
          magnetization: message.magnetization,
          acceptanceRate: message.acceptance_rate,
          temperature: message.temperature,
          field: message.field,
          coupling: message.coupling,
        });
        break;
      case "error":
        set({ error: message.message, running: false });
        break;
    }
  },
}));

export function resetSimulationClientForTests(): void {
  client?.disconnect();
  client = null;
}
