import { createCanvasRenderer } from "../rendering/canvasRenderer";

describe("createCanvasRenderer", () => {
  it("colors cells by neighbor count", () => {
    const container = document.createElement("div");
    const colors: string[] = [];
    const context = {
      fillStyle: "",
      fillRect: jest.fn(() => {
        colors.push(context.fillStyle);
      }),
    };

    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    const renderer = createCanvasRenderer({ cellSize: 10, padding: 0 });
    renderer.mount(container);
    renderer.draw(
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      4,
      4,
      "square_2d_open",
    );

    expect(context.fillRect).toHaveBeenCalledTimes(16);
    expect(colors[0]).toBe("#ff6b35");
    expect(colors[5]).toBe("#ff6b35");
  });
});
