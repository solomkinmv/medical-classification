/** Classifier type: ACHI (procedures) or MKH-10 (diseases) */
export type ClassifierType = "achi" | "mkh10";

/** Block range for categories */
export interface BlockRange {
  min: number;
  max: number;
}

/** Final procedure code (leaf node) — ACHI */
export interface ProcedureCode {
  code: string;
  name_ua: string;
  name_en: string;
  ask_code: number;
}

/** Final diagnosis code (leaf node) — МКХ-10 */
export interface DiagnosisCode {
  code: string;
  name_ua: string;
  name_en?: string;
}

/** Any leaf code (procedure or diagnosis) */
export type LeafCode = ProcedureCode | DiagnosisCode;

/** Category node at any level */
export interface CategoryNode {
  clazz?: string;
  code?: string;
  name_ua: string;
  name_en?: string;
  blockRange?: BlockRange;
  children: CategoryChildren;
}

/** Children can be either nested categories or final leaf codes */
export type CategoryChildren = Record<string, CategoryNode> | LeafCode[];

/** Root data structure — used by both ACHI and МКХ-10 */
export interface AchiData {
  children: Record<string, CategoryNode>;
}

/** ACHI hierarchy levels */
export type AchiLevel = "class" | "anatomical" | "procedural" | "block";

/** MKH-10 hierarchy levels */
export type Mkh10Level = "class" | "block" | "nosology" | "disease";

/** Navigation path segment for breadcrumbs */
export interface PathSegment {
  key: string;
  name_ua: string;
  level: AchiLevel | Mkh10Level;
  code?: string;
}

/** Check if children are leaf codes (leaf level) */
export function isLeafLevel(
  children: CategoryChildren,
): children is LeafCode[] {
  return Array.isArray(children);
}

/** Check if children are category nodes */
export function isCategoryChildren(
  children: CategoryChildren,
): children is Record<string, CategoryNode> {
  return !Array.isArray(children);
}
