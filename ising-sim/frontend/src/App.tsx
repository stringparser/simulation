import { useEffect } from "react";
import { LatticeView } from "./components/LatticeView";
import { SidePanel } from "./components/SidePanel";
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
      <div className="app__content">
        <header className="app__header">
          <h1>Ising Simulator</h1>
        </header>
        <LatticeView />
      </div>
      <SidePanel />
    </main>
  );
}
