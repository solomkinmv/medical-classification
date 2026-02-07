import type {
  AchiData,
  CategoryNode,
  CategoryChildren,
  PathSegment,
  LeafCode,
  ClassifierType,
} from "./types";
import { isLeafLevel, isCategoryChildren } from "./types";

export interface NavigationState {
  path: PathSegment[];
  currentNode: CategoryNode | null;
  children: CategoryChildren | null;
  isLeaf: boolean;
}

const ACHI_LEVEL_ORDER: PathSegment["level"][] = ["class", "anatomical", "procedural", "block"];
const MKH10_LEVEL_ORDER: PathSegment["level"][] = ["class", "block", "nosology", "disease"];

export function getLevelOrder(classifier: ClassifierType): PathSegment["level"][] {
  return classifier === "mkh10" ? MKH10_LEVEL_ORDER : ACHI_LEVEL_ORDER;
}

/**
 * Resolve navigation path and auto-skip single-child nodes and underscore categories
 */
export function resolveNavigationPath(
  data: AchiData,
  pathSegments: string[],
  classifier: ClassifierType = "achi"
): NavigationState {
  const levelOrder = getLevelOrder(classifier);
  const resolvedPath: PathSegment[] = [];
  let currentNode: CategoryNode | null = null;
  let currentChildren: CategoryChildren = data.children;
  let levelIndex = 0;

  // Navigate through path segments
  for (const segment of pathSegments) {
    if (!isCategoryChildren(currentChildren)) {
      break;
    }

    const decodedSegment = decodeURIComponent(segment);

    // Try to find segment directly, or look through underscore category
    let foundNode: CategoryNode | null = null;
    let foundKey: string = decodedSegment;

    const categoryChildren = currentChildren as Record<string, CategoryNode>;
    if (decodedSegment in categoryChildren) {
      foundNode = categoryChildren[decodedSegment];
    } else if ("_" in categoryChildren) {
      // Look inside underscore category
      const underscoreNode = categoryChildren["_"];
      if (isCategoryChildren(underscoreNode.children)) {
        const underscoreChildren = underscoreNode.children as Record<string, CategoryNode>;
        if (decodedSegment in underscoreChildren) {
          // Auto-include underscore in path (but it won't be in URL)
          resolvedPath.push({
            key: "_",
            name_ua: underscoreNode.name_ua,
            level: levelOrder[levelIndex] ?? "block",
            code: underscoreNode.code,
          });
          levelIndex++;
          currentChildren = underscoreNode.children;
          foundNode = underscoreChildren[decodedSegment];
        }
      }
    }

    if (foundNode) {
      currentNode = foundNode;
      resolvedPath.push({
        key: foundKey,
        name_ua: currentNode.name_ua,
        level: levelOrder[levelIndex] ?? "block",
        code: currentNode.clazz ?? currentNode.code,
      });
      currentChildren = currentNode.children;
      levelIndex++;
    }
  }

  // Auto-skip: while current level has only one child category or only underscore, include it
  while (currentNode && isCategoryChildren(currentChildren)) {
    const keys = Object.keys(currentChildren);
    if (keys.length === 1) {
      const [onlyKey] = keys;
      currentNode = currentChildren[onlyKey];
      resolvedPath.push({
        key: onlyKey,
        name_ua: currentNode.name_ua,
        level: levelOrder[levelIndex] ?? "block",
        code: currentNode.code,
      });
      currentChildren = currentNode.children;
      levelIndex++;
    } else {
      break;
    }
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
 * Get leaf codes from leaf level
 */
export function getLeafCodes(
  children: CategoryChildren
): LeafCode[] | null {
  if (!isLeafLevel(children)) return null;
  return children;
}

/**
 * Find the full path to a code in the tree
 */
export function findProcedurePath(
  data: AchiData,
  targetCode: string,
  classifier: ClassifierType = "achi"
): PathSegment[] | null {
  const levelOrder = getLevelOrder(classifier);

  function searchNode(
    children: CategoryChildren,
    currentPath: PathSegment[],
    levelIndex: number
  ): PathSegment[] | null {
    if (isLeafLevel(children)) {
      const found = children.find((proc) => proc.code === targetCode);
      if (found) {
        return currentPath;
      }
      return null;
    }

    for (const [key, node] of Object.entries(children)) {
      const newPath: PathSegment[] = [
        ...currentPath,
        {
          key,
          name_ua: node.name_ua,
          level: levelOrder[levelIndex] ?? "block",
          code: node.clazz ?? node.code,
        },
      ];
      const result = searchNode(node.children, newPath, levelIndex + 1);
      if (result) {
        return result;
      }
    }

    return null;
  }

  return searchNode(data.children, [], 0);
}
