export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface InitParams {
  width?: number;
  height?: number;
  geometry?: string;
  temperature?: number;
  field?: number;
  coupling?: number;
  seed?: number;
}

export interface ClientMessageInit {
  type: "init";
  width?: number;
  height?: number;
  geometry?: string;
  temperature?: number;
  field?: number;
  coupling?: number;
  seed?: number;
}

export interface ClientMessageStart {
  type: "start";
  steps_per_tick?: number;
}

export interface ClientMessagePause {
  type: "pause";
}

export interface ClientMessageStep {
  type: "step";
  sweeps: number;
}

export interface ClientMessageSetParams {
  type: "set_params";
  temperature?: number;
  field?: number;
  coupling?: number;
}

export interface ClientMessageGetState {
  type: "get_state";
}

export type ClientMessage =
  | ClientMessageInit
  | ClientMessageStart
  | ClientMessagePause
  | ClientMessageStep
  | ClientMessageSetParams
  | ClientMessageGetState;

export interface ServerMessageReady {
  type: "ready";
  protocol_version: number;
}

export interface ServerMessageState {
  type: "state";
  spins: number[];
  width: number;
  height: number;
  step: number;
  geometry: string;
}

export interface ServerMessageMetrics {
  type: "metrics";
  energy: number;
  magnetization: number;
  acceptance_rate: number | null;
  temperature: number;
  field: number;
  coupling: number;
}

export interface ServerMessageError {
  type: "error";
  message: string;
  code?: string | null;
}

export type ServerMessage =
  | ServerMessageReady
  | ServerMessageState
  | ServerMessageMetrics
  | ServerMessageError;

export function isServerMessage(value: unknown): value is ServerMessage {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  const type = (value as { type: unknown }).type;
  return (
    type === "ready" ||
    type === "state" ||
    type === "metrics" ||
    type === "error"
  );
}

export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isServerMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isStateMessage(
  message: ServerMessage,
): message is ServerMessageState {
  return message.type === "state";
}

export function isMetricsMessage(
  message: ServerMessage,
): message is ServerMessageMetrics {
  return message.type === "metrics";
}
