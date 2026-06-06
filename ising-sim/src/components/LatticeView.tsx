import { useLatticeRenderer } from "../hooks/useLatticeRenderer";
import { useLatticeViewState } from "../store/selectors";

export function LatticeView() {
  const latticeState = useLatticeViewState();
  const containerRef = useLatticeRenderer(latticeState);

  return (
    <div className="lattice-area">
      {!latticeState.initialized ? (
        <p className="lattice-area__placeholder">Waiting for simulation…</p>
      ) : null}
      <div ref={containerRef} className="lattice-view" />
    </div>
  );
}
