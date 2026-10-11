/**
 * ACHI Data Generator
 *
 * Generates achi.json from the source CSV file.
 *
 * Usage:
 *   cd achi-mobile
 *   npx ts-node scripts/generate-achi-data.ts
 *
 * Input:  ../data-source/nk-026-2021.csv
 * Output: ./data/achi.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProcedureCode {
  code: string;
  name_ua: string;
  name_en: string;
  ask_code: number;
}

interface CategoryNode {
  clazz?: string;
  code?: string;
  name_ua: string;
  blockRange?: { min: number; max: number };
  children: Record<string, CategoryNode> | ProcedureCode[];
}

interface AchiData {
  children: Record<string, CategoryNode>;
}

interface ParsedRow {
  clazz: string;
  clazzName: string;
  anatomicalAxis: string;
  anatomicalName: string;
  proceduralAxis: string;
  proceduralName: string;
  blockAxis: string;
  blockName: string;
  code: string;
  nameUkr: string;
  nameEng: string;
}

function toTitleCase(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// The source mixes look-alike Latin letters into Ukrainian words ("соннiй")
// and a Cyrillic letter into two codes ("А67007"); the official PDF uses the
// expected script, and mixed spellings break search.
const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: "а",
  c: "с",
  e: "е",
  i: "і",
  o: "о",
  p: "р",
  x: "х",
  y: "у",
  A: "А",
  B: "В",
  C: "С",
  E: "Е",
  H: "Н",
  I: "І",
  K: "К",
  M: "М",
  O: "О",
  P: "Р",
  T: "Т",
  X: "Х",
};
const CYRILLIC_TO_LATIN: Record<string, string> = Object.fromEntries(
  Object.entries(LATIN_TO_CYRILLIC).map(([latin, cyrillic]) => [
    cyrillic,
    latin,
  ]),
);

function fixMixedScriptWords(text: string): string {
  return text.replace(/[\p{L}]+/gu, (word) =>
    /[\u0400-\u04FF]/.test(word) && /[A-Za-z]/.test(word)
      ? word.replace(/[A-Za-z]/g, (ch) => LATIN_TO_CYRILLIC[ch] ?? ch)
      : word,
  );
}

function fixCode(code: string): string {
  return code.replace(/[\u0400-\u04FF]/g, (ch) => CYRILLIC_TO_LATIN[ch] ?? ch);
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === ";") {
      fields.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

function parseCSV(filePath: string): ParsedRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const rows: ParsedRow[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = splitCsvLine(line);
    if (parts.length < 11) continue;

    rows.push({
      clazz: parts[0].trim(),
      clazzName: fixMixedScriptWords(parts[1].trim()),
      anatomicalAxis: parts[2].trim(),
      anatomicalName: fixMixedScriptWords(parts[3].trim()),
      proceduralAxis: parts[4].trim(),
      proceduralName: fixMixedScriptWords(parts[5].trim()),
      blockAxis: parts[6].trim(),
      blockName: fixMixedScriptWords(parts[7].trim()),
      code: fixCode(parts[8].trim()),
      nameUkr: fixMixedScriptWords(parts[9].trim()),
      nameEng: parts[10].trim(),
    });
  }

  return rows;
}

// Classes 20-22 and a few class 13 rows use "__" for levels they don't have.
// A level without a name becomes the "_" category, which navigation skips.
const PLACEHOLDER = "__";

function levelKey(name: string): string {
  return name === PLACEHOLDER ? "_" : name;
}

function levelCode(code: string): string | undefined {
  return code === PLACEHOLDER ? undefined : code;
}

function buildHierarchy(rows: ParsedRow[]): AchiData {
  const data: AchiData = { children: {} };

  for (const row of rows) {
    // Level 0: Class (e.g., "Клас 1" -> "Процедури на нервовій системі")
    const clazzName = toTitleCase(row.clazzName);
    const clazzKey = clazzName;
    if (!data.children[clazzKey]) {
      data.children[clazzKey] = {
        clazz: row.clazz,
        name_ua: clazzName,
        children: {},
      };
    }
    const clazzNode = data.children[clazzKey];

    // Level 1: Anatomical location (e.g., "Череп, оболонки мозку та головний мозок")
    const anatomicalKey = levelKey(toTitleCase(row.anatomicalName));
    const clazzChildren = clazzNode.children as Record<string, CategoryNode>;
    if (!clazzChildren[anatomicalKey]) {
      clazzChildren[anatomicalKey] = {
        code: levelCode(row.anatomicalAxis),
        name_ua: anatomicalKey,
        children: {},
      };
    }
    const anatomicalNode = clazzChildren[anatomicalKey];

    // Level 2: Procedural typology (e.g., "Обстеження")
    const proceduralKey = levelKey(toTitleCase(row.proceduralName));
    const anatomicalChildren = anatomicalNode.children as Record<
      string,
      CategoryNode
    >;
    if (!anatomicalChildren[proceduralKey]) {
      anatomicalChildren[proceduralKey] = {
        code: levelCode(row.proceduralAxis),
        name_ua: proceduralKey,
        children: {},
      };
    }
    const proceduralNode = anatomicalChildren[proceduralKey];

    // Level 3: Block (e.g., "Обстеження черепа, оболонок мозку або головного мозку")
    const proceduralChildren = proceduralNode.children as Record<
      string,
      CategoryNode
    >;
    const blockName = levelKey(row.blockName);
    const blockCode = levelCode(row.blockAxis);
    // A few distinct blocks share a truncated name; keep their keys unique
    const blockKey =
      proceduralChildren[blockName] &&
      proceduralChildren[blockName].code !== blockCode
        ? `${blockName} (${row.blockAxis})`
        : blockName;
    if (!proceduralChildren[blockKey]) {
      proceduralChildren[blockKey] = {
        code: blockCode,
        name_ua: blockName,
        children: [],
      };
    }
    const blockNode = proceduralChildren[blockKey];

    // Add procedure code
    const blockNumber = parseInt(row.blockAxis, 10);
    const procedureCode: ProcedureCode = {
      code: row.code,
      name_ua: row.nameUkr,
      name_en: row.nameEng,
      ask_code: isNaN(blockNumber) ? 0 : blockNumber,
    };

    (blockNode.children as ProcedureCode[]).push(procedureCode);
  }

  return data;
}

function calculateBlockRanges(data: AchiData): void {
  function getBlockRange(
    node: CategoryNode,
  ): { min: number; max: number } | null {
    if (Array.isArray(node.children)) {
      // Leaf level - get min/max from procedure codes
      const codes = node.children as ProcedureCode[];
      if (codes.length === 0) return null;

      const askCodes = codes.map((c) => c.ask_code).filter((c) => c > 0);
      if (askCodes.length === 0) return null;

      return {
        min: Math.min(...askCodes),
        max: Math.max(...askCodes),
      };
    } else {
      // Category level - aggregate from children
      const children = node.children as Record<string, CategoryNode>;
      let min = Infinity;
      let max = -Infinity;

      for (const child of Object.values(children)) {
        const range = getBlockRange(child);
        if (range) {
          min = Math.min(min, range.min);
          max = Math.max(max, range.max);
        }
      }

      if (min === Infinity || max === -Infinity) return null;

      return { min, max };
    }
  }

  function applyBlockRanges(node: CategoryNode): void {
    if (Array.isArray(node.children)) {
      // Leaf level - calculate range for block
      const range = getBlockRange(node);
      if (range) {
        node.blockRange = range;
      }
    } else {
      // Category level - recursively apply and calculate range
      const children = node.children as Record<string, CategoryNode>;
      for (const child of Object.values(children)) {
        applyBlockRanges(child);
      }

      const range = getBlockRange(node);
      if (range) {
        node.blockRange = range;
      }
    }
  }

  for (const node of Object.values(data.children)) {
    applyBlockRanges(node);
  }
}

function main(): void {
  const csvPath = path.resolve(__dirname, "../../data-source/nk-026-2021.csv");
  const outputPath = path.resolve(__dirname, "../data/achi.json");

  console.log("Parsing CSV from:", csvPath);
  const rows = parseCSV(csvPath);
  console.log(`Parsed ${rows.length} rows`);

  console.log("Building hierarchy...");
  const data = buildHierarchy(rows);

  console.log("Calculating block ranges...");
  calculateBlockRanges(data);

  console.log("Writing output to:", outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  // Print statistics
  let classCount = 0;
  let procedureCount = 0;

  function countNodes(node: CategoryNode): void {
    if (Array.isArray(node.children)) {
      procedureCount += node.children.length;
    } else {
      for (const child of Object.values(node.children)) {
        countNodes(child);
      }
    }
  }

  for (const node of Object.values(data.children)) {
    classCount++;
    countNodes(node);
  }

  console.log(`\nStatistics:`);
  console.log(`- Classes: ${classCount}`);
  console.log(`- Total procedures: ${procedureCount}`);
  console.log("\nDone!");
}

main();
