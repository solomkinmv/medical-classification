/** Block range for categories */
export interface BlockRange {
  min: number;
  max: number;
}

/** Final procedure code (leaf node) */
export interface ProcedureCode {
  code: string;
  name_ua: string;
  name_en: string;
  ask_code: number;
}

/** Category node at any level (0-3) */
export interface CategoryNode {
  clazz?: string;
  code?: string;
  name_ua: string;
  blockRange?: BlockRange;
  children: CategoryChildren;
}

/** Children can be either nested categories or final procedure codes */
export type CategoryChildren =
  | Record<string, CategoryNode>
  | ProcedureCode[];

/** Root data structure */
export interface AchiData {
  children: Record<string, CategoryNode>;
}

/** Navigation path segment for breadcrumbs */
export interface PathSegment {
  key: string;
  name_ua: string;
  level: "class" | "anatomical" | "procedural" | "block";
  code?: string;
}

/** Check if children are procedure codes (leaf level) */
export function isLeafLevel(children: CategoryChildren): children is ProcedureCode[] {
  return Array.isArray(children);
}

/** Check if children are category nodes */
export function isCategoryChildren(
  children: CategoryChildren
): children is Record<string, CategoryNode> {
  return !Array.isArray(children);
}
