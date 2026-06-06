import { geometryLabel } from "../config/geometries";
import { useMetricsPanelState } from "../store/selectors";
import { formatDimensions, formatNumber } from "../utils/format";
import { MetricRow } from "./MetricRow";
import { PanelSection } from "./PanelSection";
import { Sparkline } from "./Sparkline";

export function MetricsPanel() {
  const {
    step,
    energy,
    magnetization,
    acceptanceRate,
    energyHistory,
    magnetizationHistory,
    geometry,
    dimensions,
  } = useMetricsPanelState();

  return (
    <PanelSection title="Metrics" className="metrics-panel">
      <dl className="metrics-panel__list">
        <MetricRow
          label="Geometry"
          value={`${geometryLabel(geometry)} (${formatDimensions(dimensions)})`}
        />
        <MetricRow label="Step" value={step} />
        <MetricRow label="Energy" value={formatNumber(energy, 4)} />
        <MetricRow label="Magnetization" value={formatNumber(magnetization, 1)} />
        <MetricRow label="Acceptance" value={formatNumber(acceptanceRate, 3)} />
      </dl>

      <div className="metrics-panel__charts">
        <div className="metrics-panel__chart">
          <span className="metrics-panel__chart-label">Energy</span>
          <Sparkline values={energyHistory} stroke="#4dabf7" />
        </div>
        <div className="metrics-panel__chart">
          <span className="metrics-panel__chart-label">Magnetization</span>
          <Sparkline values={magnetizationHistory} stroke="#ffa94d" />
        </div>
      </div>
    </PanelSection>
  );
}
