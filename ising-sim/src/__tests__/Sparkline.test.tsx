import { render } from "@testing-library/react";
import { Sparkline } from "../components/Sparkline";

describe("Sparkline", () => {
  it("renders an empty placeholder for fewer than two points", () => {
    const { container } = render(<Sparkline values={[1]} />);
    expect(container.querySelector(".sparkline--empty")).toBeTruthy();
  });

  it("renders a polyline for two or more points", () => {
    const { container } = render(<Sparkline values={[1, 2, 1.5]} />);
    expect(container.querySelector("polyline")).toBeTruthy();
  });
});
