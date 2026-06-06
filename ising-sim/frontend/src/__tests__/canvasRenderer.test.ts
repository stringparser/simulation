import { createCanvasRenderer } from "../rendering/canvasRenderer";

describe("createCanvasRenderer", () => {
  it("draws spin colors to the canvas", () => {
    const container = document.createElement("div");
    const fillRect = jest.fn();
    const context = {
      fillStyle: "",
      fillRect,
    };

    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    const renderer = createCanvasRenderer({ cellSize: 10, padding: 0 });
    renderer.mount(container);
    renderer.draw([1, -1, -1, 1], 2, 2);

    expect(fillRect).toHaveBeenCalledTimes(4);
    expect(context.fillStyle).toMatch(/#[0-9a-f]{6}/i);
  });
});
