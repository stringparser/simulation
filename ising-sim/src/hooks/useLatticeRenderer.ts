import { useEffect, useRef } from "react";
import type { GeometryName } from "../config/geometries";
import { createCanvasRenderer } from "../rendering/canvasRenderer";
import type { LatticeRenderer } from "../rendering/types";

export function useLatticeRenderer(
  spins: number[] | null,
  width: number,
  height: number,
  geometry: GeometryName,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<LatticeRenderer | null>(null);

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

  return containerRef;
}
