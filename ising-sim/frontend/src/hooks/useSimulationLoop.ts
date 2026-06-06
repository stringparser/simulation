import { useEffect } from "react";
import { TICK_INTERVAL_MS, useSimulationStore } from "../store/simulationStore";

export function useSimulationLoop() {
  const running = useSimulationStore((state) => state.running);
  const tick = useSimulationStore((state) => state.tick);

  useEffect(() => {
    if (!running) {
      return;
    }

    const intervalId = window.setInterval(() => {
      tick();
    }, TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [running, tick]);
}
