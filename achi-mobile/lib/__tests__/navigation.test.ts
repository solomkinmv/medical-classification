import achiData from "@/data/achi.json";
import { resolveNavigationPath, findProcedurePath } from "../navigation";
import { isLeafLevel } from "../types";
import type { AchiData, CategoryChildren, LeafCode } from "../types";

const data = achiData as AchiData;

const placeholderData: AchiData = {
  children: {
    Lab: {
      clazz: "Клас 21",
      name_ua: "Lab",
      children: {
        _: {
          name_ua: "_",
          children: {
            _: {
              name_ua: "_",
              children: {
                Biochemistry: {
                  code: "3001",
                  name_ua: "Biochemistry",
                  children: [
                    {
                      code: "D34008",
                      name_ua: "Liver",
                      name_en: "",
                      ask_code: 3001,
                    },
                  ],
                },
                Haematology: {
                  code: "3002",
                  name_ua: "Haematology",
                  children: [
                    {
                      code: "A34036",
                      name_ua: "Smear",
                      name_en: "",
                      ask_code: 3002,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
};

function collectCodes(children: CategoryChildren, out: LeafCode[] = []) {
  if (isLeafLevel(children)) {
    out.push(...children);
  } else {
    for (const node of Object.values(children))
      collectCodes(node.children, out);
  }
  return out;
}

describe("resolveNavigationPath", () => {
  it("skips hidden levels when a class has only underscore categories", () => {
    const state = resolveNavigationPath(placeholderData, ["Lab"]);

    expect(state.path.map((s) => s.key)).toEqual(["Lab", "_", "_"]);
    expect(Object.keys(state.children ?? {})).toEqual([
      "Biochemistry",
      "Haematology",
    ]);
  });

  it("resolves a segment behind consecutive underscore categories", () => {
    const state = resolveNavigationPath(placeholderData, [
      "Lab",
      "Biochemistry",
    ]);

    expect(state.isLeaf).toBe(true);
    expect(state.path.map((s) => s.level)).toEqual([
      "class",
      "anatomical",
      "procedural",
      "block",
    ]);
  });
});

describe("bundled АКМІ data", () => {
  const codes = collectCodes(data.children);

  it("contains every code once", () => {
    expect(codes).toHaveLength(6728);
    expect(new Set(codes.map((c) => c.code)).size).toBe(codes.length);
  });

  it("opens every code's block from its breadcrumb URL", () => {
    const unreachable = codes.filter(({ code }) => {
      const path = findProcedurePath(data, code) ?? [];
      const url = path.filter((s) => s.key !== "_").map((s) => s.key);
      const state = resolveNavigationPath(data, url);
      return !(
        state.isLeaf &&
        state.children !== null &&
        isLeafLevel(state.children) &&
        state.children.some((c) => c.code === code)
      );
    });

    expect(unreachable).toEqual([]);
  });
});
