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

function parseCSV(filePath: string): ParsedRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const rows: ParsedRow[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(";");
    if (parts.length < 11) continue;

    // Skip rows with "__" placeholders (specialist consultations without hierarchy)
    if (parts[2] === "__" || parts[4] === "__" || parts[6] === "__") {
      continue;
    }

    rows.push({
      clazz: parts[0].trim(),
      clazzName: parts[1].trim(),
      anatomicalAxis: parts[2].trim(),
      anatomicalName: parts[3].trim(),
      proceduralAxis: parts[4].trim(),
      proceduralName: parts[5].trim(),
      blockAxis: parts[6].trim(),
      blockName: parts[7].trim(),
      code: parts[8].trim(),
      nameUkr: parts[9].trim(),
      nameEng: parts[10].trim(),
    });
  }

  return rows;
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
    const anatomicalName = toTitleCase(row.anatomicalName);
    const anatomicalKey = anatomicalName;
    const clazzChildren = clazzNode.children as Record<string, CategoryNode>;
    if (!clazzChildren[anatomicalKey]) {
      clazzChildren[anatomicalKey] = {
        code: row.anatomicalAxis,
        name_ua: anatomicalName,
        children: {},
      };
    }
    const anatomicalNode = clazzChildren[anatomicalKey];

    // Level 2: Procedural typology (e.g., "Обстеження")
    const proceduralName = toTitleCase(row.proceduralName);
    const proceduralKey = proceduralName;
    const anatomicalChildren = anatomicalNode.children as Record<string, CategoryNode>;
    if (!anatomicalChildren[proceduralKey]) {
      anatomicalChildren[proceduralKey] = {
        code: row.proceduralAxis,
        name_ua: proceduralName,
        children: {},
      };
    }
    const proceduralNode = anatomicalChildren[proceduralKey];

    // Level 3: Block (e.g., "Обстеження черепа, оболонок мозку або головного мозку")
    const blockKey = row.blockName;
    const proceduralChildren = proceduralNode.children as Record<string, CategoryNode>;
    if (!proceduralChildren[blockKey]) {
      proceduralChildren[blockKey] = {
        code: row.blockAxis,
        name_ua: row.blockName,
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
    node: CategoryNode
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
  const csvPath = path.resolve(
    __dirname,
    "../../data-source/nk-026-2021.csv"
  );
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
