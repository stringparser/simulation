import type { ClientMessage, ConnectionStatus, ServerMessage } from "../types/messages";
import { parseServerMessage } from "../types/messages";

const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_RECONNECT_MS = 500;

function defaultWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

export class SimulationClient {
  private ws: WebSocket | null = null;
  private queue: string[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private shouldReconnect = false;
  private readonly url: string;

  constructor(
    url: string | undefined,
    private readonly onMessage: (message: ServerMessage) => void,
    private readonly onStatus: (status: ConnectionStatus) => void,
  ) {
    this.url = url ?? defaultWsUrl();
  }

  connect(): void {
    this.shouldReconnect = true;
    this.openSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.ws?.close();
    this.ws = null;
    this.queue = [];
    this.onStatus("disconnected");
  }

  send(message: ClientMessage): void {
    const payload = JSON.stringify(message);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
      return;
    }
    this.queue.push(payload);
  }

  private openSocket(): void {
    this.clearReconnectTimer();
    this.onStatus("connecting");
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.onStatus("connected");
      this.flushQueue();
    };

    this.ws.onmessage = (event) => {
      const message = parseServerMessage(String(event.data));
      if (message) {
        this.onMessage(message);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      } else {
        this.onStatus("disconnected");
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private flushQueue(): void {
    while (this.queue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(this.queue.shift()!);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      this.shouldReconnect = false;
      this.onStatus("disconnected");
      return;
    }

    this.onStatus("connecting");
    const delay = BASE_RECONNECT_MS * 2 ** this.reconnectAttempt;
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export function getDefaultWsUrl(): string {
  return defaultWsUrl();
}
