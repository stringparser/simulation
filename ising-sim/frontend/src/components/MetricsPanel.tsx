import { useSimulationStore } from "../store/simulationStore";

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? "—" : value.toFixed(digits);
}

export function MetricsPanel() {
  const step = useSimulationStore((state) => state.step);
  const energy = useSimulationStore((state) => state.energy);
  const magnetization = useSimulationStore((state) => state.magnetization);
  const acceptanceRate = useSimulationStore((state) => state.acceptanceRate);
  const geometry = useSimulationStore((state) => state.geometry);
  const width = useSimulationStore((state) => state.width);
  const height = useSimulationStore((state) => state.height);

  return (
    <section className="metrics-panel">
      <h2>Metrics</h2>
      <dl>
        <div>
          <dt>Geometry</dt>
          <dd>
            {geometry} ({width}×{height})
          </dd>
        </div>
        <div>
          <dt>Step</dt>
          <dd>{step}</dd>
        </div>
        <div>
          <dt>Energy</dt>
          <dd>{formatNumber(energy, 4)}</dd>
        </div>
        <div>
          <dt>Magnetization</dt>
          <dd>{formatNumber(magnetization, 1)}</dd>
        </div>
        <div>
          <dt>Acceptance</dt>
          <dd>{formatNumber(acceptanceRate, 3)}</dd>
        </div>
      </dl>
    </section>
  );
}
