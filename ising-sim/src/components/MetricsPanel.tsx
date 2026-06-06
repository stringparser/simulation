import { geometryLabel } from "../config/geometries";
import { useMetricsPanelState } from "../store/selectors";
import { formatNumber } from "../utils/format";
import { MetricRow } from "./MetricRow";
import { PanelSection } from "./PanelSection";

export function MetricsPanel() {
  const {
    step,
    energy,
    magnetization,
    acceptanceRate,
    geometry,
    width,
    height,
  } = useMetricsPanelState();

  return (
    <PanelSection title="Metrics" className="metrics-panel">
      <dl className="metrics-panel__list">
        <MetricRow
          label="Geometry"
          value={`${geometryLabel(geometry)} (${width}×${height})`}
        />
        <MetricRow label="Step" value={step} />
        <MetricRow label="Energy" value={formatNumber(energy, 4)} />
        <MetricRow label="Magnetization" value={formatNumber(magnetization, 1)} />
        <MetricRow label="Acceptance" value={formatNumber(acceptanceRate, 3)} />
      </dl>
    </PanelSection>
  );
}
