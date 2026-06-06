import { useEffect } from "react";
import { LatticeView } from "./components/LatticeView";
import { SidePanel } from "./components/SidePanel";
import { useSimulationLoop } from "./hooks/useSimulationLoop";
import { useSimulationStore } from "./store/simulationStore";

export function App() {
  const init = useSimulationStore((state) => state.init);

  useSimulationLoop();

  useEffect(() => {
    init();
  }, [init]);

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
