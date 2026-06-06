import { render, screen, fireEvent } from "@testing-library/react";
import { ControlsPanel } from "../components/ControlsPanel";
import { useSimulationStore } from "../store/simulationStore";

describe("ControlsPanel", () => {
  beforeEach(() => {
    useSimulationStore.setState({
      connectionStatus: "connected",
      initialized: true,
      running: false,
      temperature: 2.5,
      field: 0,
      coupling: 1,
    });
  });

  it("calls start when Start is clicked", () => {
    const start = jest.fn();
    useSimulationStore.setState({ start });

    render(<ControlsPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(start).toHaveBeenCalled();
  });
});
