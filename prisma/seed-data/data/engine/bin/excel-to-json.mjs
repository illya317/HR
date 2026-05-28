#!/usr/bin/env node
/**
 * Excel → JSON 转换脚本
 * 支持 raw 模式和 normalized 模式
 *
 * 用法:
 *   node engine/bin/excel-to-json.mjs --mode=raw
 *   node engine/bin/excel-to-json.mjs --mode=normalized
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import XLSX from "xlsx";
import {
  loadPatterns,
  identifyProfile,
  getYearFromFilename,
} from "../lib/file-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_DIR = path.join(__dirname, "..");
const PROJECT_ROOT = path.join(ENGINE_DIR, "..");
const DATA_DIR = PROJECT_ROOT;
const RAW_DIR = path.join(DATA_DIR, "raw");
const INTERMEDIATE_DIR = path.join(DATA_DIR, "intermediate");
const CONFIG_DIR = path.join(PROJECT_ROOT, "config");
const PATTERNS_PATH = path.join(CONFIG_DIR, "file-patterns.json");

const PATTERNS = loadPatterns(PATTERNS_PATH);

const MODE = process.argv.includes("--mode=normalized")
  ? "normalized"
  : process.argv.includes("--mode=raw")
  ? "raw"
  : "raw";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function md5File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(data).digest("hex");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "number" && Number.isNaN(v)) return null;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "string") {
    const s = v.trim();
    return s === "" ? null : s;
  }
  return v;
}

function isEmptyRow(row) {
  if (!row || !row.values || row.values.length === 0) return true;
  return row.values.every((c) => c === null || c === undefined || String(c).trim() === "");
}

function detectHeaderRow(rows, maxScan = 10) {
  for (let i = 0; i < Math.min(maxScan, rows.length); i++) {
    const nonNull = rows[i].values.filter((c) => c !== null && c !== undefined).length;
    if (nonNull >= 2) return i;
  }
  return 0;
}

function expandMerges(ws, rawRows) {
  const merges = ws["!merges"] || [];
  for (const merge of merges) {
    const { s, e } = merge;
    const topLeftRef = XLSX.utils.encode_cell(s);
    const topLeftCell = ws[topLeftRef];
    const value = topLeftCell ? topLeftCell.v : null;
    if (value === null || value === undefined) continue;

    for (let r = s.r; r <= e.r; r++) {
      for (let c = s.c; c <= e.c; c++) {
        if (r === s.r && c === s.c) continue;
        if (!rawRows[r]) rawRows[r] = [];
        if (rawRows[r][c] === null || rawRows[r][c] === undefined) {
          rawRows[r][c] = value;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Raw export
// ---------------------------------------------------------------------------
function exportRaw(filePath, outDir) {
  const basename = path.basename(filePath);
  const year = getYearFromFilename(basename);
  const profile = identifyProfile(basename, PATTERNS);
  const checksum = md5File(filePath);

  const workbook = XLSX.readFile(filePath, { cellFormula: true, cellDates: true });
  const sheets = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const ref = ws["!ref"] || null;
    const merges = ws["!merges"] || [];

    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    const tempRows = rawRows.map((row, rowIdx) => ({
      _sourceRow: rowIdx + 1,
      values: row.map(cleanValue),
    }));
    const headerRowIdx = detectHeaderRow(tempRows);

    expandMerges(ws, rawRows);

    const rows = rawRows.map((row, rowIdx) => {
      const cleaned = row.map(cleanValue);
      let lastIdx = cleaned.length - 1;
      while (lastIdx >= 0 && cleaned[lastIdx] === null) lastIdx--;
      return {
        _sourceRow: rowIdx + 1,
        values: cleaned.slice(0, lastIdx + 1),
      };
    });

    const nonEmptyRows = rows.filter((r) => !isEmptyRow(r));
    const headers = rows[headerRowIdx]?.values || [];

    const formulas = {};
    if (ws && typeof ws === "object") {
      for (const [cell, cellObj] of Object.entries(ws)) {
        if (cell.startsWith("!")) continue;
        if (cellObj && cellObj.f) {
          formulas[cell] = { value: cellObj.v, formula: cellObj.f };
        }
      }
    }

    sheets.push({
      sheetName,
      range: ref,
      headerRowIndex: headerRowIdx,
      headers,
      rowCount: rows.length,
      nonEmptyRowCount: nonEmptyRows.length,
      columnCount: headers.length,
      merges: merges.map((m) => ({
        start: XLSX.utils.encode_cell(m.s),
        end: XLSX.utils.encode_cell(m.e),
      })),
      formulas,
      rows,
    });
  }

  const outName = basename.replace(/\.xlsx?$/i, "") + ".raw.json";
  const outPath = path.join(outDir, outName);

  const output = {
    sourceFile: basename,
    sourcePath: filePath,
    year,
    profile: profile ? { id: profile.id, name: profile.name } : null,
    checksum,
    exportedAt: new Date().toISOString(),
    sheets,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`[raw] ${basename} → ${outPath}`);
  return { basename, year, profile, checksum, sheetCount: sheets.length, outPath };
}

// ---------------------------------------------------------------------------
// Normalized export: workshop-reports (reuse existing Python JSONs)
// ---------------------------------------------------------------------------
function normalizeWorkshopReports(intermediateDir, outDir) {
  const years = [2025, 2026];
  const workshopIntermediateDir = path.join(intermediateDir, "workshop-reports");
  for (const year of years) {
    const linkedPath = path.join(workshopIntermediateDir, `${year}年车间报表_关联.json`);
    if (!fs.existsSync(linkedPath)) {
      console.log(`[skip] ${linkedPath} not found`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(linkedPath, "utf-8"));
    const normalized = data.map((month) => {
      const monthNum = month.月份;
      return {
        year,
        month: monthNum,
        title: month.报表标题,
        total: month.合计,
        unmatchedCount: (month.未匹配工分明细 || []).length,
        source: {
          file: `${year}年车间报表.xlsx`,
          sheet: `${year}年财务报表`,
          row: null,
          note: "原始 Excel 行号已在先前转换中丢失",
        },
        products: (month.品种记录 || []).map((p) => ({
          seq: p.序号,
          product: p.品种,
          spec: p.规格,
          source: {
            file: `${year}年车间报表.xlsx`,
            sheet: `${year}年财务报表`,
            row: null,
            note: "原始 Excel 行号已在先前转换中丢失",
          },
          batches: (p.批次记录 || []).map((b) => ({
            batchNo: b.批号,
            batchNoList: b.批号列表 || null,
            feedQty: b.投料量_万粒,
            workPoints: b.工分,
            quantity: b.生产数量,
            boxBottle: b.折合_盒瓶,
            wanli: b.折合_万粒,
            remark: b.备注,
            source: {
              file: `${year}年车间报表.xlsx`,
              sheet: `${year}年财务报表`,
              row: null,
              note: "原始 Excel 行号已在先前转换中丢失",
            },
            workDetails: (b.工分明细 || []).map((wd) => ({
              product: wd.品名,
              batchInfo: wd.批号信息,
              source: {
                file: `${year}年车间报表.xlsx`,
                sheet: `${monthNum}月工分明细`,
                row: null,
                note: "原始 Excel 行号已在先前转换中丢失",
              },
              people: (wd.人员工分明细 || []).map((person) => ({
                position: person.岗位类别,
                name: person.姓名,
                unitPrice: person.岗位工分单价,
                dailyScores: person.每日工分,
                remark: person.备注,
                total: person.合计,
              })),
            })),
            workDetailCount: (b.工分明细 || []).length,
            peopleCount: (b.工分明细 || []).reduce(
              (sum, wd) => sum + (wd.人员工分明细 || []).length,
              0
            ),
          })),
          batchCount: (p.批次记录 || []).length,
        })),
        productCount: (month.品种记录 || []).length,
      };
    });

    const outPath = path.join(outDir, `${year}.json`);
    fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2), "utf-8");
    console.log(`[normalized] workshop-reports ${year} → ${outPath}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  ensureDir(INTERMEDIATE_DIR);

  if (MODE === "raw") {
    ensureDir(INTERMEDIATE_DIR);

    const files = fs
      .readdirSync(RAW_DIR)
      .filter((f) => /\.xlsx?$/i.test(f))
      .sort();

    const manifest = {
      generatedAt: new Date().toISOString(),
      mode: "raw",
      rawFiles: [],
      normalizedFiles: [],
    };

    for (const file of files) {
      const filePath = path.join(RAW_DIR, file);
      const info = exportRaw(filePath, INTERMEDIATE_DIR);
      manifest.rawFiles.push({
        sourceFile: info.basename,
        year: info.year,
        profile: info.profile ? info.profile.id : null,
        checksum: info.checksum,
        sheetCount: info.sheetCount,
        outPath: info.outPath,
      });
    }

    const manifestPath = path.join(DATA_DIR, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`\n[manifest] → ${manifestPath}`);

    const reportLines = [
      "# Excel → JSON 转换报告",
      "",
      `**生成时间**: ${manifest.generatedAt}`,
      `**模式**: ${manifest.mode}`,
      "",
      "## 文件清单",
      "",
      "| 源文件 | 年份 | 业务主题 | Sheet 数 | Checksum |",
      "|--------|------|----------|----------|----------|",
    ];
    for (const f of manifest.rawFiles) {
      reportLines.push(
        `| ${f.sourceFile} | ${f.year || ""} | ${f.profile || "未识别"} | ${f.sheetCount} | ${f.checksum.slice(0, 8)}... |`
      );
    }
    reportLines.push("");
    reportLines.push("## 状态说明");
    reportLines.push("");
    reportLines.push("- 所有 Excel 文件已完成 **raw** 模式导出。");
    reportLines.push("- raw JSON 保留了完整的 sheet 结构、表头、原始行数据和合并单元格信息。");
    reportLines.push("- 5 个业务主题（shipments / cost-analysis / cost-structure / sales-salary / workshop-reports）均已配置化 normalized。");
    reportLines.push("- `workshop-reports` 仍依赖 Python 预处理的 intermediate JSON，其余 4 个主题由 `config/profiles/*.json` 完全驱动。");
    reportLines.push("");

    const reportPath = path.join(DATA_DIR, "conversion-report.md");
    fs.writeFileSync(reportPath, reportLines.join("\n"), "utf-8");
    console.log(`[report] → ${reportPath}`);
  }

  if (MODE === "normalized") {
    const manifestPath = path.join(DATA_DIR, "manifest.json");
    let manifest = { rawFiles: [], normalizedFiles: [] };
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }

    const normOutDir = path.join(DATA_DIR, "normalized", "workshop-reports");
    ensureDir(normOutDir);
    normalizeWorkshopReports(INTERMEDIATE_DIR, normOutDir);

    for (const year of [2025, 2026]) {
      const outPath = path.join(normOutDir, `${year}.json`);
      if (fs.existsSync(outPath)) {
        const stat = fs.statSync(outPath);
        manifest.normalizedFiles.push({
          profile: "workshop-reports",
          year,
          outPath,
          sizeBytes: stat.size,
        });
      }
    }

    manifest.generatedAt = new Date().toISOString();
    manifest.mode = "raw+normalized";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
    console.log(`[manifest updated] → ${manifestPath}`);
  }
}

main();
