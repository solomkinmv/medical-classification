import achiData from "@/data/achi.json";
import mkh10Data from "@/data/mkh10.json";
import { getLevelOrder } from "./navigation";
import type {
  AchiData,
  CategoryChildren,
  ClassifierType,
  LeafCode,
  PathSegment,
} from "./types";
import { isLeafLevel } from "./types";

export const CLASSIFIERS: ClassifierType[] = ["achi", "mkh10"];

export const CLASSIFIER_EDITIONS: Record<ClassifierType, string> = {
  achi: "НК 026:2021",
  mkh10: "НК 025:2021",
};

export function getClassifierData(classifier: ClassifierType): AchiData {
  return (classifier === "achi" ? achiData : mkh10Data) as AchiData;
}

export interface IndexedCode {
  classifier: ClassifierType;
  leaf: LeafCode;
  /** Ancestors, shared by all codes of one leaf group */
  path: PathSegment[];
}

const indexes: Partial<Record<ClassifierType, IndexedCode[]>> = {};
let byCode: Map<string, IndexedCode> | null = null;

/** Flat list of all codes of a classifier in tree order, built once */
export function getCodeIndex(classifier: ClassifierType): IndexedCode[] {
  const cached = indexes[classifier];
  if (cached) return cached;

  const levelOrder = getLevelOrder(classifier);
  const entries: IndexedCode[] = [];

  function walk(children: CategoryChildren, path: PathSegment[]) {
    if (isLeafLevel(children)) {
      for (const leaf of children) entries.push({ classifier, leaf, path });
      return;
    }
    for (const [key, node] of Object.entries(children)) {
      walk(node.children, [
        ...path,
        {
          key,
          name_ua: node.name_ua,
          level: levelOrder[path.length] ?? "block",
          code: node.clazz ?? node.code,
        },
      ]);
    }
  }

  walk(getClassifierData(classifier).children, []);
  indexes[classifier] = entries;
  return entries;
}

/** Find a code in either classifier; АКМІ and МКХ-10 codes never overlap */
export function findCode(code: string): IndexedCode | null {
  if (!byCode) {
    byCode = new Map();
    for (const classifier of CLASSIFIERS) {
      for (const entry of getCodeIndex(classifier)) {
        byCode.set(entry.leaf.code, entry);
      }
    }
  }
  return byCode.get(code) ?? null;
}

/** Text a doctor pastes into a report: "30443-00 — Холецистектомія" */
export function formatCodeWithName(code: LeafCode): string {
  return `${code.code} — ${code.name_ua}`;
}

/** Name of the closest named ancestor, unless it repeats the code's name */
export function getCodeContext(
  code: LeafCode,
  path: PathSegment[],
): string | undefined {
  const parent = path.filter((segment) => segment.key !== "_").at(-1);
  return parent && parent.name_ua !== code.name_ua ? parent.name_ua : undefined;
}
