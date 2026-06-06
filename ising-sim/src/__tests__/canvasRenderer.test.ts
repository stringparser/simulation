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
    renderer.draw({
      spins: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      dimensions: [4, 4],
      rank: 2,
      maxNeighbors: 4,
      step: 0,
      geometry: "square_2d_open",
    });

    expect(context.fillRect).toHaveBeenCalledTimes(16);
    expect(colors[0]).toBe("#ff6b35");
    expect(colors[5]).toBe("#ff6b35");
  });

  it("draws a depth slice from a 3D snapshot", () => {
    const container = document.createElement("div");
    const context = {
      fillStyle: "",
      fillRect: jest.fn(),
      clearRect: jest.fn(),
    };

    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    const renderer = createCanvasRenderer({ cellSize: 10, padding: 0 });
    renderer.mount(container);
    renderer.draw(
      {
        spins: new Array(64).fill(1),
        dimensions: [4, 4, 4],
        rank: 3,
        maxNeighbors: 6,
        step: 0,
        geometry: "cubic_3d_open",
      },
      { viewMode: "slice", slice: { axis: 2, index: 1 } },
    );

    expect(context.fillRect).toHaveBeenCalledTimes(16);
  });

  it("draws every site in orbit mode", () => {
    const container = document.createElement("div");
    const context = {
      fillStyle: "",
      fillRect: jest.fn(),
      clearRect: jest.fn(),
    };

    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    const renderer = createCanvasRenderer();
    renderer.mount(container);
    renderer.draw(
      {
        spins: new Array(64).fill(1),
        dimensions: [4, 4, 4],
        rank: 3,
        maxNeighbors: 6,
        step: 0,
        geometry: "cubic_3d_open",
      },
      { viewMode: "orbit", orbit: { yaw: 0.8, pitch: 0.5 } },
    );

    expect(context.fillRect).toHaveBeenCalledTimes(64);
  });
});
