import { create } from "zustand";
import { SimulationClient } from "../api/websocket";
import type {
  ConnectionStatus,
  InitParams,
  ServerMessage,
} from "../types/messages";

const DEFAULT_WIDTH = 16;
const DEFAULT_HEIGHT = 16;
const DEFAULT_TEMPERATURE = 2.5;
const DEFAULT_FIELD = 0;
const DEFAULT_COUPLING = 1;

export interface SimulationStore {
  connectionStatus: ConnectionStatus;
  error: string | null;
  spins: number[] | null;
  width: number;
  height: number;
  temperature: number;
  field: number;
  coupling: number;
  geometry: string;
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
  applyServerMessage: (message: ServerMessage) => void;
}

let client: SimulationClient | null = null;

function buildInitPayload(
  state: Pick<
    SimulationStore,
    "width" | "height" | "temperature" | "field" | "coupling"
  >,
  params?: InitParams,
) {
  return {
    type: "init" as const,
    width: params?.width ?? state.width,
    height: params?.height ?? state.height,
    geometry: params?.geometry ?? "square_2d_open",
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
  temperature: DEFAULT_TEMPERATURE,
  field: DEFAULT_FIELD,
  coupling: DEFAULT_COUPLING,
  geometry: "square_2d_open",
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
          geometry: message.geometry,
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
