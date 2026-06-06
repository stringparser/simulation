import { ConnectionBanner } from "./ConnectionBanner";
import { ControlsPanel } from "./ControlsPanel";
import { MetricsPanel } from "./MetricsPanel";

export function SidePanel() {
  return (
    <aside className="side-panel">
      <ConnectionBanner />
      <ControlsPanel />
      <MetricsPanel />
    </aside>
  );
}
