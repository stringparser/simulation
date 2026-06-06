import { useEffect, useRef } from "react";
import { TICK_INTERVAL_MS, useSimulationStore } from "../store/simulationStore";

export function useSimulationLoop() {
  const running = useSimulationStore((state) => state.running);
  const tick = useSimulationStore((state) => state.tick);
  const tickRef = useRef(tick);

  tickRef.current = tick;

  useEffect(() => {
    if (!running) {
      return;
    }

    let lastTime = performance.now();
    let accumulator = 0;
    let frameId = 0;

    const loop = (now: number) => {
      accumulator += now - lastTime;
      lastTime = now;

      while (accumulator >= TICK_INTERVAL_MS) {
        tickRef.current();
        accumulator -= TICK_INTERVAL_MS;
      }

      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [running]);
}
