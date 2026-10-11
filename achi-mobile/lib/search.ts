import { CLASSIFIERS, getCodeIndex, type IndexedCode } from "./code-index";
import type { ClassifierType, LeafCode, PathSegment } from "./types";

export interface SearchResult {
  classifier: ClassifierType;
  code: LeafCode;
  path: PathSegment[];
}

export interface ClassifierSearchResults {
  classifier: ClassifierType;
  results: SearchResult[];
  /** All matches, including the ones cut by the limit */
  total: number;
  /** Rank of the best match; lower is better */
  bestRank: number;
}

const RANK_EXACT_CODE = 0;
const RANK_CODE_PREFIX = 1;
const RANK_WORD_PREFIX = 2;
const RANK_WORD_STEM = 3;
const RANK_SUBSTRING = 4;
const RANK_COUNT = 5;

// Cyrillic letters that look like the Latin ones in МКХ-10 codes (А00.0)
const CYRILLIC_LOOKALIKES: Record<string, string> = {
  а: "a",
  в: "b",
  е: "e",
  з: "z",
  і: "i",
  к: "k",
  м: "m",
  н: "h",
  о: "o",
  р: "p",
  с: "c",
  т: "t",
  у: "y",
  х: "x",
};

// Latin letter on the same key of the Ukrainian layout (ф00 typed for A00)
const UKRAINIAN_LAYOUT: Record<string, string> = {
  ф: "a",
  и: "b",
  с: "c",
  в: "d",
  у: "e",
  а: "f",
  п: "g",
  р: "h",
  ш: "i",
  о: "j",
  л: "k",
  д: "l",
  ь: "m",
  т: "n",
  щ: "o",
  з: "p",
  й: "q",
  к: "r",
  і: "s",
  е: "t",
  г: "u",
  м: "v",
  ц: "w",
  ч: "x",
  н: "y",
  я: "z",
};

// Abbreviations doctors type; the classifiers spell them out
const ABBREVIATIONS: Record<string, string[]> = {
  кт: ["комп'ютерн", "томограф"],
  мрт: ["магнітно", "резонансн"],
  узд: ["ультразвук"],
  екг: ["електрокардіограф"],
};

const CODE_QUERY = /^\p{L}?[\d\s.\-–—]*\d[\d\s.\-–—]*$/u;
const STEM_MIN_LENGTH = 5;
const STEM_TRIM = 2;

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[’ʼ‘`´]/g, "'");
}

function splitWords(text: string): string[] {
  return text.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
}

function codeKey(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function codeQueryKeys(query: string): string[] {
  const lower = query.toLowerCase();
  const first = lower[0];
  const rest = lower.slice(1);
  const firsts = /\p{L}/u.test(first)
    ? [first, CYRILLIC_LOOKALIKES[first], UKRAINIAN_LAYOUT[first]]
    : [first];
  const keys = firsts
    .filter((letter): letter is string => letter !== undefined)
    .map((letter) => codeKey(letter + rest))
    .filter(Boolean);
  return [...new Set(keys)];
}

interface NormalizedEntry {
  entry: IndexedCode;
  code: string;
  text: string;
  words: string[];
}

const normalizedIndexes: Partial<Record<ClassifierType, NormalizedEntry[]>> =
  {};

function getNormalizedIndex(classifier: ClassifierType): NormalizedEntry[] {
  const cached = normalizedIndexes[classifier];
  if (cached) return cached;
  const normalized = getCodeIndex(classifier).map((entry) => {
    const text = normalizeText(
      `${entry.leaf.name_ua} ${entry.leaf.name_en ?? ""}`,
    );
    return {
      entry,
      code: codeKey(entry.leaf.code),
      text,
      words: splitWords(text),
    };
  });
  normalizedIndexes[classifier] = normalized;
  return normalized;
}

function rankCode(item: NormalizedEntry, keys: string[]): number | null {
  if (keys.includes(item.code)) return RANK_EXACT_CODE;
  if (keys.some((key) => item.code.startsWith(key))) return RANK_CODE_PREFIX;
  return null;
}

function hasWordPrefix(item: NormalizedEntry, prefix: string): boolean {
  return item.words.some((word) => word.startsWith(prefix));
}

function rankName(item: NormalizedEntry, tokens: string[]): number | null {
  let rank = RANK_WORD_PREFIX;
  for (const token of tokens) {
    if (hasWordPrefix(item, token)) continue;
    const expansion = ABBREVIATIONS[token];
    if (expansion?.every((prefix) => hasWordPrefix(item, prefix))) continue;
    const stem =
      token.length >= STEM_MIN_LENGTH ? token.slice(0, -STEM_TRIM) : null;
    if (stem && hasWordPrefix(item, stem)) {
      rank = Math.max(rank, RANK_WORD_STEM);
      continue;
    }
    if (item.text.includes(token)) {
      rank = RANK_SUBSTRING;
      continue;
    }
    return null;
  }
  return rank;
}

export function searchClassifier(
  classifier: ClassifierType,
  query: string,
  limit: number = 50,
): ClassifierSearchResults {
  const trimmed = query.trim();
  const empty = { classifier, results: [], total: 0, bestRank: Infinity };
  if (!trimmed) return empty;

  const isCodeQuery = CODE_QUERY.test(trimmed);
  const keys = isCodeQuery ? codeQueryKeys(trimmed) : [];
  const tokens = splitWords(normalizeText(trimmed));
  if (isCodeQuery ? keys.length === 0 : tokens.length === 0) return empty;

  const buckets: SearchResult[][] = Array.from(
    { length: RANK_COUNT },
    () => [],
  );
  let total = 0;
  for (const item of getNormalizedIndex(classifier)) {
    const rank = isCodeQuery ? rankCode(item, keys) : rankName(item, tokens);
    if (rank === null) continue;
    total++;
    if (buckets[rank].length < limit) {
      buckets[rank].push({
        classifier,
        code: item.entry.leaf,
        path: item.entry.path,
      });
    }
  }

  const bestRank = buckets.findIndex((bucket) => bucket.length > 0);
  return {
    classifier,
    results: buckets.flat().slice(0, limit),
    total,
    bestRank: bestRank === -1 ? Infinity : bestRank,
  };
}

/**
 * Search both classifiers. Sections with a better match come first; on a tie
 * the preferred classifier wins.
 */
export function searchAll(
  query: string,
  limit: number,
  preferred: ClassifierType,
): ClassifierSearchResults[] {
  return CLASSIFIERS.map((classifier) =>
    searchClassifier(classifier, query, limit),
  )
    .filter((section) => section.total > 0)
    .sort(
      (a, b) =>
        a.bestRank - b.bestRank ||
        Number(b.classifier === preferred) - Number(a.classifier === preferred),
    );
}
