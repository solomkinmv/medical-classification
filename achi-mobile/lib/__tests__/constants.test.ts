import { getClassifierColors, colors } from "../constants";

describe("getClassifierColors", () => {
  it("returns sky colors for achi classifier", () => {
    const result = getClassifierColors("achi");
    expect(result.accent500).toBe(colors.sky[500]);
    expect(result.accent600).toBe(colors.sky[600]);
  });

  it("returns emerald colors for mkh10 classifier", () => {
    const result = getClassifierColors("mkh10");
    expect(result.accent500).toBe(colors.emerald[500]);
    expect(result.accent600).toBe(colors.emerald[600]);
  });
});
