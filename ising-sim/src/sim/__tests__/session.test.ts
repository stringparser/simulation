import { LATTICE_SIZE } from "../../config/lattice";
import { SimulationError } from "../errors";
import { SimulationSession } from "../session";

describe("SimulationSession", () => {
  it("initializes with default lattice size", () => {
    const session = SimulationSession.create();
    const snapshot = session.getSnapshot();

    expect(snapshot.width).toBe(LATTICE_SIZE.defaultWidth);
    expect(snapshot.height).toBe(LATTICE_SIZE.defaultHeight);
    expect(snapshot.step).toBe(0);
    expect(snapshot.spins).toHaveLength(snapshot.width * snapshot.height);
  });

  it("accepts custom lattice size and periodic geometry", () => {
    const session = SimulationSession.create({
      width: 8,
      height: 12,
      geometry: "square_2d_periodic",
      seed: 1,
    });
    const snapshot = session.getSnapshot();

    expect(snapshot.width).toBe(8);
    expect(snapshot.height).toBe(12);
    expect(snapshot.geometry).toBe("square_2d_periodic");
  });

  it("rejects invalid lattice size", () => {
    expect(() => SimulationSession.create({ width: 2, height: 16 })).toThrow(
      SimulationError,
    );
  });

  it("advances step count and updates metrics on manual steps", () => {
    const session = SimulationSession.create({ seed: 5 });
    session.runSweeps(3);
    const snapshot = session.getSnapshot();
    const metrics = session.getMetrics();

    expect(snapshot.step).toBe(3);
    expect(metrics.acceptanceRate).not.toBeNull();
    expect(Number.isFinite(metrics.energy)).toBe(true);
    expect(Number.isFinite(metrics.magnetization)).toBe(true);
  });

  it("rejects zero sweeps", () => {
    const session = SimulationSession.create();
    expect(() => session.runSweeps(0)).toThrow(SimulationError);
  });

  it("rejects non-positive temperature updates", () => {
    const session = SimulationSession.create();
    expect(() => session.setParams({ temperature: 0 })).toThrow(SimulationError);
  });

  it("tracks running state from start and pause", () => {
    const session = SimulationSession.create();
    expect(session.isRunning()).toBe(false);
    session.start(2);
    expect(session.isRunning()).toBe(true);
    expect(session.getSweepsPerTick()).toBe(2);
    session.pause();
    expect(session.isRunning()).toBe(false);
  });
});
