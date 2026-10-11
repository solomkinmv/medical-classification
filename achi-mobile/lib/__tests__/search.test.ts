import { findCode, formatCodeWithName } from "../code-index";
import { searchAll, searchClassifier } from "../search";

function codes(classifier: "achi" | "mkh10", query: string, limit = 50) {
  return searchClassifier(classifier, query, limit).results.map(
    (r) => r.code.code,
  );
}

describe("searchClassifier", () => {
  it("puts an exact code first", () => {
    expect(codes("achi", "30443-00")[0]).toBe("30443-00");
    expect(codes("mkh10", "K80.00")[0]).toBe("K80.00");
  });

  it("ignores separators in codes", () => {
    expect(codes("achi", "3044300")[0]).toBe("30443-00");
    expect(codes("achi", "30443 00")[0]).toBe("30443-00");
    expect(codes("mkh10", "a000")[0]).toBe("A00.0");
  });

  it("accepts Cyrillic look-alikes and the Ukrainian layout in codes", () => {
    expect(codes("mkh10", "А00.0")[0]).toBe("A00.0");
    expect(codes("mkh10", "ф00.0")[0]).toBe("A00.0");
    expect(codes("mkh10", "К80.00")[0]).toBe("K80.00");
  });

  it("matches code prefixes", () => {
    const results = codes("mkh10", "K80");
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((code) => code.startsWith("K80"))).toBe(true);
  });

  it("matches words in any order", () => {
    expect(codes("achi", "холецистектомія лапароскопічна")).toContain(
      "30445-00",
    );
  });

  it("matches other word endings", () => {
    expect(codes("achi", "холецистектомії")).toContain("30443-00");
  });

  it("ranks word-start matches above substrings", () => {
    const results = codes("achi", "холецистектомія");
    expect(results.indexOf("30443-00")).toBeLessThan(5);
  });

  it("treats both apostrophes the same", () => {
    expect(codes("achi", "зв’язку з субдуральною")).toContain("39009-00");
    expect(codes("achi", "скелетно-м'язова")).toContain("L37001");
  });

  it("expands common abbreviations", () => {
    expect(codes("achi", "кт головного мозку")).toContain("56001-00");
  });

  it("reports the total beyond the limit", () => {
    const section = searchClassifier("mkh10", "K", 5);
    expect(section.results).toHaveLength(5);
    expect(section.total).toBeGreaterThan(5);
  });

  it("returns nothing for blank queries", () => {
    expect(searchClassifier("achi", "   ").total).toBe(0);
  });
});

describe("searchAll", () => {
  it("searches both classifiers and leads with the better match", () => {
    const sections = searchAll("K80.00", 10, "achi");
    expect(sections[0].classifier).toBe("mkh10");
    expect(sections[0].results[0].code.code).toBe("K80.00");
  });

  it("omits classifiers without matches", () => {
    const sections = searchAll("холецистектомія", 10, "mkh10");
    expect(sections.map((s) => s.classifier)).toEqual(["achi"]);
  });
});

describe("findCode", () => {
  it("finds codes from both classifiers with their path", () => {
    expect(findCode("30443-00")?.classifier).toBe("achi");
    expect(findCode("A00.0")?.classifier).toBe("mkh10");
    expect(findCode("A00.0")?.path.length).toBeGreaterThan(0);
    expect(findCode("missing")).toBeNull();
  });

  it("formats a code for reports", () => {
    const entry = findCode("30443-00");
    expect(entry && formatCodeWithName(entry.leaf)).toBe(
      "30443-00 — Холецистектомія",
    );
  });
});
