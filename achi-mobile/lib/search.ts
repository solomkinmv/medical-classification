import type { AchiData, CategoryNode, ProcedureCode } from "./types";
import { isLeafLevel } from "./types";

export interface SearchResult {
  code: ProcedureCode;
  path: string[];
}

export function searchProcedures(
  data: AchiData,
  query: string,
  limit: number = 50
): SearchResult[] {
  const results: SearchResult[] = [];
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return [];

  function traverse(node: CategoryNode, path: string[]): boolean {
    if (isLeafLevel(node.children)) {
      for (const code of node.children) {
        const matches =
          code.code.toLowerCase().includes(normalizedQuery) ||
          code.name_ua.toLowerCase().includes(normalizedQuery) ||
          code.name_en.toLowerCase().includes(normalizedQuery);

        if (matches) {
          results.push({ code, path: [...path] });
          if (results.length >= limit) return true;
        }
      }
    } else {
      for (const [key, child] of Object.entries(node.children)) {
        if (traverse(child, [...path, key])) return true;
      }
    }
    return false;
  }

  for (const [key, child] of Object.entries(data.children)) {
    if (traverse(child, [key])) break;
  }

  return results;
}
