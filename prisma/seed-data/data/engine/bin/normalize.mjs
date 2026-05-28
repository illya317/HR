#!/usr/bin/env node
/**
 * Config-driven normalizer for finance raw JSON themes.
 *
 * Reads config/profiles/*.json configuration and produces normalized JSON
 * for shipments, cost-analysis, sales-salary, and cost-structure.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  loadProfile,
  listProfiles,
} from "../lib/profile-loader.mjs";
import {
  normalizeRowArray,
  normalizeHeaderTable,
  normalizeGenericTable,
  normalizeCostStructure,
} from "../lib/table-normalizer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_DIR = path.join(__dirname, "..");
const PROJECT_ROOT = path.join(ENGINE_DIR, "..");
const DATA_DIR = PROJECT_ROOT;
const INTERMEDIATE_DIR = path.join(DATA_DIR, "intermediate");
const NORMALIZED_DIR = path.join(DATA_DIR, "normalized");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
const REPORT_PATH = path.join(DATA_DIR, "conversion-report.md");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function rawFilesByProfile(profileId) {
  return fs
    .readdirSync(INTERMEDIATE_DIR)
    .filter((name) => name.endsWith(".raw.json"))
    .map((name) => path.join(INTERMEDIATE_DIR, name))
    .map(readJson)
    .filter((raw) => raw.profile?.id === profileId)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
}

function getSheet(raw, config) {
  const strategy = config.normalizer?.strategy;
  const sheetCfg = config.normalizer?.sheet ?? "first";

  if (sheetCfg === "first") return raw.sheets[0] ?? null;
  if (sheetCfg === "all") return raw.sheets;
  if (typeof sheetCfg === "string" && raw.sheets.find((s) => s.sheetName === sheetCfg)) {
    return raw.sheets.find((s) => s.sheetName === sheetCfg);
  }
  return raw.sheets;
}

// ---------------------------------------------------------------------------
// Config-driven normalizer dispatcher
// ---------------------------------------------------------------------------
function normalizeByProfile(profileId) {
  const config = loadProfile(profileId);
  const outDir = path.join(NORMALIZED_DIR, config.output.dir);
  ensureDir(outDir);

  const outputs = [];
  const raws = rawFilesByProfile(profileId);

  for (const raw of raws) {
    const sheets = getSheet(raw, config);
    const isArray = Array.isArray(sheets);
    const sheetList = isArray ? sheets : [sheets];

    let records = [];
    let tables = [];
    let standardRows = [];

    for (const sheet of sheetList) {
      if (!sheet) continue;
      const strategy = config.normalizer?.strategy;

      switch (strategy) {
        case "rowArray": {
          const result = normalizeRowArray(raw, sheet, config.normalizer);
          records.push(...result);
          break;
        }
        case "headerTable": {
          const result = normalizeHeaderTable(raw, sheet, config.normalizer);
          records.push(...result);
          break;
        }
        case "genericTable": {
          const result = normalizeGenericTable(raw, sheet, config.normalizer);
          tables.push(result);
          break;
        }
        case "costStructure": {
          const result = normalizeCostStructure(raw, sheet, config.normalizer);
          if (result.table) tables.push(result.table);
          if (result.standardRows) standardRows.push(...result.standardRows);
          break;
        }
        case "custom": {
          console.warn(`[skip] Profile ${profileId} uses custom strategy; not handled here.`);
          break;
        }
        default:
          throw new Error(`Unknown strategy: ${strategy} for profile ${profileId}`);
      }
    }

    let output;
    if (config.output.format === "array") {
      output = records;
    } else if (config.output.format === "tablesObject") {
      output = {
        year: raw.year,
        profile: profileId,
        sourceFile: raw.sourceFile,
        tables,
      };
    } else if (config.output.format === "standardRowsObject") {
      output = {
        year: raw.year,
        profile: profileId,
        sourceFile: raw.sourceFile,
        standardRows,
        tables,
      };
    } else {
      throw new Error(`Unknown output format: ${config.output.format}`);
    }

    const outPath = path.join(outDir, `${raw.year}.json`);
    writeJson(outPath, output);

    const recordCount = Array.isArray(output)
      ? output.length
      : (output.standardRows?.length ?? output.tables?.reduce((s, t) => s + (t.rowCount ?? 0), 0) ?? 0);
    const tableCount = Array.isArray(output) ? 0 : (output.tables?.length ?? 0);

    outputs.push({
      profile: profileId,
      year: raw.year,
      outPath,
      sizeBytes: fs.statSync(outPath).size,
      recordCount,
      tableCount,
    });
    console.log(`[normalized] ${profileId} ${raw.year}: ${recordCount} records${tableCount ? `, ${tableCount} tables` : ""}`);
  }

  return outputs;
}

// ---------------------------------------------------------------------------
// Manifest & Report
// ---------------------------------------------------------------------------
function updateManifest(newOutputs) {
  const manifest = fs.existsSync(MANIFEST_PATH)
    ? readJson(MANIFEST_PATH)
    : { generatedAt: null, mode: "raw+normalized", rawFiles: [], normalizedFiles: [] };

  const existing = Array.isArray(manifest.normalizedFiles) ? manifest.normalizedFiles : [];
  const byKey = new Map();
  for (const item of existing) byKey.set(`${item.profile}:${item.year}`, item);
  for (const item of newOutputs) byKey.set(`${item.profile}:${item.year}`, item);

  manifest.normalizedFiles = [...byKey.values()].map((item) => {
    if (!item.outPath || !fs.existsSync(item.outPath)) return item;
    const data = readJson(item.outPath);
    const enriched = { ...item, sizeBytes: fs.statSync(item.outPath).size };
    if (enriched.recordCount === undefined) {
      if (Array.isArray(data)) enriched.recordCount = data.length;
      else if (Array.isArray(data.standardRows)) enriched.recordCount = data.standardRows.length;
      else if (Array.isArray(data.tables)) {
        enriched.recordCount = data.tables.reduce((sum, table) => sum + (table.rowCount ?? 0), 0);
      }
    }
    if (enriched.tableCount === undefined && !Array.isArray(data) && Array.isArray(data.tables)) {
      enriched.tableCount = data.tables.length;
    }
    return enriched;
  }).sort((a, b) =>
    String(a.profile).localeCompare(String(b.profile)) || (a.year ?? 0) - (b.year ?? 0)
  );
  manifest.generatedAt = new Date().toISOString();
  manifest.mode = "raw+normalized";
  writeJson(MANIFEST_PATH, manifest);
}

function writeReport(manifest) {
  const normalized = Array.isArray(manifest.normalizedFiles) ? manifest.normalizedFiles : [];
  const done = new Set(normalized.map((f) => f.profile));
  const rawFiles = Array.isArray(manifest.rawFiles) ? manifest.rawFiles : [];

  const lines = [
    "# Excel → JSON 转换报告",
    "",
    `**生成时间**: ${manifest.generatedAt}`,
    `**模式**: ${manifest.mode}`,
    "",
    "## Raw 文件清单",
    "",
    "| 源文件 | 年份 | 业务主题 | Sheet 数 | Checksum |",
    "|--------|------|----------|----------|----------|",
  ];

  for (const f of rawFiles) {
    lines.push(`| ${f.sourceFile} | ${f.year || ""} | ${f.profile || "未识别"} | ${f.sheetCount} | ${String(f.checksum || "").slice(0, 8)}... |`);
  }

  lines.push("", "## Normalized 输出清单", "");
  lines.push("| 业务主题 | 年份 | 记录数 | Sheet/Table 数 | 输出 |");
  lines.push("|----------|------|-------:|---------------:|------|");
  for (const f of normalized) {
    lines.push(`| ${f.profile} | ${f.year} | ${f.recordCount ?? ""} | ${f.tableCount ?? ""} | ${path.relative(DATA_DIR, f.outPath)} |`);
  }

  lines.push("", "## 标准化状态", "");
  lines.push("| 业务主题 | raw | normalized | 说明 |");
  lines.push("|----------|-----|------------|------|");
  for (const profileId of listProfiles()) {
    const config = loadProfile(profileId);
    const label = config.file?.patterns?.[0] || profileId;
    const strategy = config.normalizer?.strategy;
    const note = strategy === "custom" ? "custom code" : "config-driven";
    lines.push(`| ${profileId} (${label}) | ✅ | ${done.has(profileId) ? "✅" : "⏳"} | ${note} |`);
  }

  lines.push("", "## 说明", "");
  lines.push("- raw JSON 保留 Excel 原始 sheet/row/value/formula/merge 信息。");
  lines.push("- normalized JSON 面向业务入库和分析，均包含 source 信息。");
  lines.push("- 配置化 normalizer 定义在 `config/profiles/*.json`。");
  lines.push("- `workshop-reports` 仍由 custom code 处理（Python intermediate → normalized）。");

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  ensureDir(NORMALIZED_DIR);

  const outputs = [];
  for (const profileId of ["shipments", "sales-salary", "cost-analysis", "cost-structure"]) {
    outputs.push(...normalizeByProfile(profileId));
  }

  updateManifest(outputs);
  writeReport(readJson(MANIFEST_PATH));
  console.log(`[manifest] updated ${MANIFEST_PATH}`);
  console.log(`[report] updated ${REPORT_PATH}`);
}

main();
