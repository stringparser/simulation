import { GeometryOrchestrator } from "../../sim/geometry/orchestrator";
import {
  DEFAULT_ORBIT_VIEW,
  projectLatticeSites,
  rotatePoint,
} from "../projection3d";

describe("projection3d", () => {
  it("sorts projected sites back-to-front", () => {
    const layout = GeometryOrchestrator.create("cubic_3d_open", [4, 4, 4]);
    const projected = projectLatticeSites(layout, DEFAULT_ORBIT_VIEW);

    for (let index = 1; index < projected.length; index += 1) {
      expect(projected[index].depth).toBeGreaterThanOrEqual(projected[index - 1].depth);
    }
  });

  it("keeps the cube center fixed under rotation", () => {
    const [x, y, z] = rotatePoint(0, 0, 0, 1.2, 0.4);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it("projects every site for an 8x8x8 cube", () => {
    const layout = GeometryOrchestrator.create("cubic_3d_open", [8, 8, 8]);
    const projected = projectLatticeSites(layout, DEFAULT_ORBIT_VIEW);
    expect(projected).toHaveLength(512);
  });
});
