/**
 * Config-driven table normalizer.
 * Supports: rowArray, headerTable, genericTable, costStructure, custom.
 */

import {
  cleanText,
  isEmptyRow,
  isEmptyValue,
  source,
  makeColumns,
  rowToValues,
  transformValue,
  setNested,
  shouldSkip,
  parseMonthFromSheet,
  parseMonthFromDate,
} from "./transforms.mjs";

// ---------------------------------------------------------------------------
// Strategy: rowArray
// Fixed column index mapping, like shipments.
// ---------------------------------------------------------------------------
export function normalizeRowArray(raw, sheet, config) {
  const fields = config.fields || [];
  const skipRules = config.skip || [];
  const derived = config.derived || {};
  const records = [];

  let rows = config.skipEmptyRows
    ? sheet.rows.filter((r) => !isEmptyRow(r))
    : [...sheet.rows];

  // Skip header row if present (configurable)
  if (config.skipHeader !== false && sheet.headerRowIndex !== undefined) {
    rows = rows.filter((_, idx) => idx !== sheet.headerRowIndex);
  }

  for (const row of rows) {
    const record = {};
    for (const field of fields) {
      const rawValue = row.values[field.source];
      const transformed = transformValue(rawValue, field.transform);
      setNested(record, field.target, transformed);
    }

    // Apply skip rules
    if (shouldSkip(record, skipRules)) continue;

    // Apply derived fields
    for (const [key, rule] of Object.entries(derived)) {
      record[key] = computeDerived(rule, record, raw, sheet, row);
    }

    record.source = source(raw, sheet, row);
    records.push(record);
  }

  return records;
}

// ---------------------------------------------------------------------------
// Strategy: headerTable
// Detect header row by marker, then map by header name, like sales-salary.
// ---------------------------------------------------------------------------
export function normalizeHeaderTable(raw, sheet, config) {
  const hd = config.headerDetection || {};
  const fields = config.fields || [];
  const skipRules = config.skip || [];
  const derived = config.derived || {};
  const records = [];

  // Find header row
  let headerRow = null;
  if (hd.markerColumn !== undefined && hd.markerValue !== undefined) {
    headerRow = sheet.rows.find(
      (r) => r.values[hd.markerColumn] === hd.markerValue
    );
  }
  if (!headerRow) {
    console.warn(`[headerTable] Header not found in sheet: ${sheet.sheetName}`);
    return records;
  }

  const columns = makeColumns(headerRow.values);
  const headerMap = new Map(columns.map((c) => [c.key, c]));

  for (const row of sheet.rows) {
    if (row._sourceRow <= headerRow._sourceRow) continue;
    if (config.skipEmptyRows && isEmptyRow(row)) continue;

    const record = {};
    const values = rowToValues(row, columns);

    for (const field of fields) {
      const col = headerMap.get(field.source);
      const rawValue = col ? values[field.source] : null;
      const transformed = transformValue(rawValue, field.transform);
      setNested(record, field.target, transformed);
    }

    if (shouldSkip(record, skipRules)) continue;

    for (const [key, rule] of Object.entries(derived)) {
      record[key] = computeDerived(rule, record, raw, sheet, row, values);
    }

    record.source = source(raw, sheet, row);
    records.push(record);
  }

  return records;
}

// ---------------------------------------------------------------------------
// Strategy: genericTable
// Convert each sheet to a generic table with headers + records.
// ---------------------------------------------------------------------------
export function normalizeGenericTable(raw, sheet, config) {
  const headerRowIndex = sheet.headerRowIndex ?? 0;
  const headerRow = sheet.rows[headerRowIndex];
  const columns = makeColumns(headerRow?.values ?? sheet.headers ?? []);
  const records = [];

  const rows = config.skipEmptyRows
    ? sheet.rows.filter((r) => !isEmptyRow(r))
    : sheet.rows;

  for (const row of rows.slice(headerRowIndex + 1)) {
    if (isEmptyRow(row)) continue;
    const values = rowToValues(row, columns);
    records.push({
      source: source(raw, sheet, row),
      values,
    });
  }

  return {
    sheetName: sheet.sheetName,
    headerRow: headerRow?._sourceRow ?? null,
    columns,
    rowCount: records.length,
    records,
  };
}

// ---------------------------------------------------------------------------
// Strategy: costStructure
// Hybrid: genericTable for all sheets + standardRows for matching sheets.
// ---------------------------------------------------------------------------
export function normalizeCostStructure(raw, sheet, config) {
  const srConfig = config.standardRows || {};
  const result = {
    kind: classifyCostSheet(sheet.sheetName),
    period: costStructurePeriod(raw, sheet),
    table: null,
    standardRows: [],
  };

  // Always generate generic table
  if (config.useGenericTable) {
    result.table = normalizeGenericTable(raw, sheet, { skipEmptyRows: true });
    result.table.kind = result.kind;
    result.table.period = result.period;
  }

  // Extract standard rows if sheet matches filter
  if (srConfig.enabled && matchesStandardSheet(sheet, srConfig.sheetFilter)) {
    const fields = srConfig.fields || [];
    const skipRules = srConfig.skip || [];

    for (const row of sheet.rows) {
      if (isEmptyRow(row)) continue;
      const record = {};
      for (const field of fields) {
        const rawValue = row.values[field.source];
        const transformed = transformValue(rawValue, field.transform);
        setNested(record, field.target, transformed);
      }

      if (shouldSkip(record, skipRules)) continue;

      // Extra columns beyond defined fields
      if (srConfig.extraColumns && row.values.length > fields.length) {
        record.extraColumns = {};
        const { startIndex, prefix } = srConfig.extraColumns;
        for (let idx = startIndex; idx < row.values.length; idx++) {
          if (!isEmptyValue(row.values[idx])) {
            record.extraColumns[`${prefix}${idx + 1}`] = cleanText(row.values[idx]);
          }
        }
      }

      record.source = source(raw, sheet, row);
      record.sourceSheetKind = result.kind;
      record.year = result.period.year;
      record.month = result.period.month;
      result.standardRows.push(record);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Derived field computation
// ---------------------------------------------------------------------------
function computeDerived(rule, record, raw, sheet, row, allValues) {
  const src = rule.from;
  switch (rule.transform) {
    case "pass":
      if (src === "_raw.year") return raw.year;
      if (src === "_raw.sourceFile") return raw.sourceFile;
      return record[src];
    case "parseMonthFromDate":
      return parseMonthFromDate(record[src]);
    case "parseMonthFromSheet":
      return parseMonthFromSheet(sheet);
    case "parseMonthFromText":
      return parseMonthFromSheet(sheet); // reuse same logic
    case "recordTypeByName":
      return record[src] === "合计" ? "total" : "person";
    default:
      return record[src];
  }
}

// ---------------------------------------------------------------------------
// Cost-structure helpers (kept as code, not config)
// ---------------------------------------------------------------------------
function classifyCostSheet(sheetName) {
  if (/分摊工资/.test(sheetName)) return "salary-allocation";
  if (/制造费用分配/.test(sheetName)) return "manufacturing-overhead-allocation";
  if (/单位成本/.test(sheetName)) return "unit-cost-summary";
  if (/总成本/.test(sheetName)) return "total-cost-summary";
  if (/月|^\d{2}\.\d{1,2}$/.test(sheetName)) return "monthly-cost";
  return "other";
}

function costStructurePeriod(raw, sheet) {
  const month = parseMonthFromSheet(sheet);
  const yearMatch = sheet.sheetName.match(/(20)?(\d{2})/);
  const year = yearMatch ? 2000 + Number(yearMatch[2]) : raw.year;
  return { year, month };
}

function matchesStandardSheet(sheet, filter) {
  if (!filter || !filter.checkHeaders) return false;
  const headers = (sheet.headers || []).map((h) => cleanText(h));
  return filter.checkHeaders.every((h) => headers.includes(h));
}
