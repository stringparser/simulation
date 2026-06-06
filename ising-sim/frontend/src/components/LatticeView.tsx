import { useLatticeRenderer } from "../hooks/useLatticeRenderer";
import { useLatticeViewState } from "../store/selectors";

export function LatticeView() {
  const { spins, width, height, geometry, initialized } = useLatticeViewState();
  const containerRef = useLatticeRenderer(spins, width, height, geometry);

  return (
    <div className="lattice-area">
      {!initialized ? (
        <p className="lattice-area__placeholder">Waiting for simulation…</p>
      ) : null}
      <div ref={containerRef} className="lattice-view" />
    </div>
  );
}
