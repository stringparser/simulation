import {
  parseServerMessage,
  isMetricsMessage,
  isStateMessage,
} from "../types/messages";

describe("parseServerMessage", () => {
  it("parses a state message", () => {
    const message = parseServerMessage(
      JSON.stringify({
        type: "state",
        spins: [1, -1],
        width: 2,
        height: 1,
        step: 3,
        geometry: "square_2d_open",
      }),
    );

    expect(message).not.toBeNull();
    expect(isStateMessage(message!)).toBe(true);
    if (message && isStateMessage(message)) {
      expect(message.step).toBe(3);
      expect(message.spins).toEqual([1, -1]);
    }
  });

  it("parses a metrics message", () => {
    const message = parseServerMessage(
      JSON.stringify({
        type: "metrics",
        energy: -4,
        magnetization: 2,
        acceptance_rate: 0.4,
        temperature: 2.5,
        field: 0,
        coupling: 1,
      }),
    );

    expect(message).not.toBeNull();
    expect(isMetricsMessage(message!)).toBe(true);
  });

  it("returns null for invalid payloads", () => {
    expect(parseServerMessage("{")).toBeNull();
    expect(parseServerMessage(JSON.stringify({ type: "unknown" }))).toBeNull();
  });
});
