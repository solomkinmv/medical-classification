import type {
  AchiData,
  CategoryNode,
  CategoryChildren,
  PathSegment,
  ProcedureCode,
} from "./types";
import { isLeafLevel, isCategoryChildren } from "./types";

export interface NavigationState {
  path: PathSegment[];
  currentNode: CategoryNode | null;
  children: CategoryChildren | null;
  isLeaf: boolean;
}

/**
 * Resolve navigation path and auto-skip single-child nodes
 */
export function resolveNavigationPath(
  data: AchiData,
  pathSegments: string[]
): NavigationState {
  const resolvedPath: PathSegment[] = [];
  let currentNode: CategoryNode | null = null;
  let currentChildren: CategoryChildren = data.children;

  // Navigate through path segments
  for (const segment of pathSegments) {
    if (!isCategoryChildren(currentChildren)) {
      break;
    }

    const decodedSegment = decodeURIComponent(segment);
    if (decodedSegment in currentChildren) {
      currentNode = currentChildren[decodedSegment];
      resolvedPath.push({
        key: decodedSegment,
        name_ua: currentNode.name_ua,
      });
      currentChildren = currentNode.children;
    }
  }

  // Auto-skip: while current level has only one child category, include it
  while (
    currentNode &&
    isCategoryChildren(currentChildren) &&
    Object.keys(currentChildren).length === 1
  ) {
    const [onlyKey] = Object.keys(currentChildren);
    currentNode = currentChildren[onlyKey];
    resolvedPath.push({
      key: onlyKey,
      name_ua: currentNode.name_ua,
    });
    currentChildren = currentNode.children;
  }

  return {
    path: resolvedPath,
    currentNode,
    children: currentChildren,
    isLeaf: isLeafLevel(currentChildren),
  };
}

/**
 * Get root categories (Level 0)
 */
export function getRootCategories(data: AchiData): [string, CategoryNode][] {
  return Object.entries(data.children);
}

/**
 * Build URL path from path segments
 */
export function buildPathUrl(segments: PathSegment[]): string {
  if (segments.length === 0) return "/browse";
  return "/browse/" + segments.map((s) => encodeURIComponent(s.key)).join("/");
}

/**
 * Get child categories from a node
 */
export function getChildCategories(
  children: CategoryChildren
): [string, CategoryNode][] | null {
  if (isLeafLevel(children)) return null;
  return Object.entries(children);
}

/**
 * Get procedure codes from leaf level
 */
export function getProcedureCodes(
  children: CategoryChildren
): ProcedureCode[] | null {
  if (!isLeafLevel(children)) return null;
  return children;
}

/**
 * Find the full path to a procedure code in the ACHI tree
 */
export function findProcedurePath(
  data: AchiData,
  targetCode: string
): PathSegment[] | null {
  function searchNode(
    children: CategoryChildren,
    currentPath: PathSegment[]
  ): PathSegment[] | null {
    if (isLeafLevel(children)) {
      const found = children.find((proc) => proc.code === targetCode);
      if (found) {
        return currentPath;
      }
      return null;
    }

    for (const [key, node] of Object.entries(children)) {
      const newPath = [...currentPath, { key, name_ua: node.name_ua }];
      const result = searchNode(node.children, newPath);
      if (result) {
        return result;
      }
    }

    return null;
  }

  return searchNode(data.children, []);
}
