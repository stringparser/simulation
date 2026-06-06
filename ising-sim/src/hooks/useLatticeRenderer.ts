import { useEffect, useRef } from "react";
import type { GeometryName } from "../config/geometries";
import { createCanvasRenderer } from "../rendering/canvasRenderer";
import type { LatticeRenderer } from "../rendering/types";

interface LatticeRenderState {
  spins: number[] | null;
  dimensions: readonly number[];
  rank: number;
  maxNeighbors: number;
  step: number;
  geometry: GeometryName;
}

export function useLatticeRenderer({
  spins,
  dimensions,
  rank,
  maxNeighbors,
  step,
  geometry,
}: LatticeRenderState) {
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
    if (!spins || !rendererRef.current) {
      return;
    }

    rendererRef.current.draw({
      spins,
      dimensions,
      rank,
      maxNeighbors,
      step,
      geometry,
    });
  }, [spins, dimensions, rank, maxNeighbors, step, geometry]);

  return containerRef;
}
