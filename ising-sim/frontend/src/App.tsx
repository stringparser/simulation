import { useEffect } from "react";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { ControlsPanel } from "./components/ControlsPanel";
import { LatticeView } from "./components/LatticeView";
import { MetricsPanel } from "./components/MetricsPanel";
import { useSimulationStore } from "./store/simulationStore";

export function App() {
  const connect = useSimulationStore((state) => state.connect);
  const disconnect = useSimulationStore((state) => state.disconnect);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Ising Simulator</h1>
        <ConnectionBanner />
      </header>

      <div className="app__layout">
        <LatticeView />
        <aside className="app__sidebar">
          <ControlsPanel />
          <MetricsPanel />
        </aside>
      </div>
    </main>
  );
}
