import { ControlsPanel } from "./ControlsPanel";
import { MetricsPanel } from "./MetricsPanel";

export function SidePanel() {
  return (
    <aside className="side-panel">
      <ControlsPanel />
      <MetricsPanel />
    </aside>
  );
}
