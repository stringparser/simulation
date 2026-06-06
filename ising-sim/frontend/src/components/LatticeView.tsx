import { useEffect, useRef } from "react";
import { createCanvasRenderer } from "../rendering/canvasRenderer";
import type { LatticeRenderer } from "../rendering/types";
import { useSimulationStore } from "../store/simulationStore";

export function LatticeView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<LatticeRenderer | null>(null);
  const spins = useSimulationStore((state) => state.spins);
  const width = useSimulationStore((state) => state.width);
  const height = useSimulationStore((state) => state.height);
  const geometry = useSimulationStore((state) => state.geometry);
  const initialized = useSimulationStore((state) => state.initialized);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const renderer = createCanvasRenderer();
    renderer.mount(containerRef.current);
    rendererRef.current = renderer;

    return () => {
      renderer.unmount();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (spins && rendererRef.current) {
      rendererRef.current.draw(spins, width, height, geometry);
    }
  }, [spins, width, height, geometry]);

  return (
    <div className="lattice-area">
      {!initialized ? (
        <p className="lattice-area__placeholder">Waiting for simulation…</p>
      ) : null}
      <div ref={containerRef} className="lattice-view" />
    </div>
  );
}
