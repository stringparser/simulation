import { useCallback, useEffect, useRef } from "react";
import type { GeometryName } from "../config/geometries";
import { createCanvasRenderer } from "../rendering/canvasRenderer";
import {
  clampOrbitPitch,
  DEFAULT_ORBIT_VIEW,
  type OrbitView,
} from "../rendering/projection3d";
import type { LatticeRenderer, LatticeViewMode } from "../rendering/types";
import type { SessionSnapshot } from "../sim/session";

interface LatticeRenderState {
  spins: number[] | null;
  dimensions: readonly number[];
  rank: number;
  maxNeighbors: number;
  step: number;
  geometry: GeometryName;
  sliceAxis: 0 | 1 | 2;
  sliceIndex: number;
  viewMode: LatticeViewMode;
}

const ORBIT_DRAG_SENSITIVITY = 0.008;

function buildSnapshot(state: LatticeRenderState): SessionSnapshot | null {
  if (!state.spins) {
    return null;
  }

  return {
    spins: state.spins,
    dimensions: state.dimensions,
    rank: state.rank,
    maxNeighbors: state.maxNeighbors,
    step: state.step,
    geometry: state.geometry,
  };
}

export function useLatticeRenderer(state: LatticeRenderState) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<LatticeRenderer | null>(null);
  const orbitRef = useRef<OrbitView>({ ...DEFAULT_ORBIT_VIEW });
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef(state);
  stateRef.current = state;

  const redraw = useCallback((orbitOverride?: OrbitView) => {
    const snapshot = buildSnapshot(stateRef.current);
    if (!snapshot || !rendererRef.current) {
      return;
    }

    const current = stateRef.current;
    rendererRef.current.draw(snapshot, {
      viewMode: current.rank === 3 ? current.viewMode : undefined,
      orbit: orbitOverride ?? orbitRef.current,
      slice:
        current.rank === 3 && current.viewMode === "slice"
          ? { axis: current.sliceAxis, index: current.sliceIndex }
          : undefined,
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const renderer = createCanvasRenderer();
    renderer.mount(containerRef.current);
    rendererRef.current = renderer;
    redraw();

    return () => {
      renderer.unmount();
      rendererRef.current = null;
    };
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [
    state.spins,
    state.dimensions,
    state.rank,
    state.maxNeighbors,
    state.step,
    state.geometry,
    state.sliceAxis,
    state.sliceIndex,
    state.viewMode,
    redraw,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (stateRef.current.rank !== 3 || stateRef.current.viewMode !== "orbit") {
        return;
      }

      draggingRef.current = true;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      container.setPointerCapture(event.pointerId);
      container.classList.add("lattice-view--dragging");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }

      const deltaX = event.clientX - lastPointerRef.current.x;
      const deltaY = event.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: event.clientX, y: event.clientY };

      orbitRef.current = {
        yaw: orbitRef.current.yaw + deltaX * ORBIT_DRAG_SENSITIVITY,
        pitch: clampOrbitPitch(orbitRef.current.pitch + deltaY * ORBIT_DRAG_SENSITIVITY),
      };
      redraw(orbitRef.current);
    };

    const stopDragging = (event: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }

      draggingRef.current = false;
      container.classList.remove("lattice-view--dragging");
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", stopDragging);
    container.addEventListener("pointercancel", stopDragging);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", stopDragging);
      container.removeEventListener("pointercancel", stopDragging);
    };
  }, [redraw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const orbitEnabled = state.rank === 3 && state.viewMode === "orbit";
    container.classList.toggle("lattice-view--orbit", orbitEnabled);
  }, [state.rank, state.viewMode]);

  return containerRef;
}
