import { render, screen, fireEvent } from "@testing-library/react";
import { SliderControl } from "../components/SliderControl";

describe("SliderControl", () => {
  it("renders label on its own line and calls onChange", () => {
    const onChange = jest.fn();

    render(
      <SliderControl
        label="Temperature"
        min={0}
        max={5}
        step={0.1}
        value={2.5}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Temperature")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "3.1" } });
    expect(onChange).toHaveBeenCalledWith(3.1);
  });
});
