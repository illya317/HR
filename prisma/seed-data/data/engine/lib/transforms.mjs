/**
 * Shared transform utilities for Excel normalizers.
 */

export function cleanText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed === "" ? null : trimmed;
}

export function isEmptyValue(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function isEmptyRow(row) {
  return !row?.values || row.values.every(isEmptyValue);
}

export function source(raw, sheet, row, note) {
  return {
    file: raw.sourceFile,
    sheet: sheet?.sheetName ?? null,
    row: row?._sourceRow ?? null,
    ...(note ? { note } : {}),
  };
}

export function parseMonthFromText(text) {
  if (!text) return null;
  const s = String(text);
  const monthMatch = s.match(/(?:^|[^0-9])([1-9]|1[0-2])\s*月/);
  if (monthMatch) return Number(monthMatch[1]);
  const dotMatch = s.match(/\.(1[0-2]|[1-9])(?:月)?$/);
  if (dotMatch) return Number(dotMatch[1]);
  return null;
}

export function parseMonthFromSheet(sheet) {
  const title = sheet.rows.find((r) => !isEmptyRow(r))?.values?.join(" ");
  return parseMonthFromText(title) ?? parseMonthFromText(sheet.sheetName);
}

export function parseMonthFromDate(dateValue) {
  if (!dateValue) return null;
  const match = String(dateValue).match(/^\d{4}[-/.](\d{1,2})[-/.]\d{1,2}/);
  return match ? Number(match[1]) : null;
}

export function makeColumns(headers) {
  const used = new Map();
  return headers.map((header, index) => {
    const original = cleanText(header);
    const base = original ? String(original) : `col_${index + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    const key = seen === 0 ? base : `${base}_${seen + 1}`;
    return { index, key, original };
  });
}

export function rowToValues(row, columns) {
  const values = {};
  const maxLen = Math.max(row.values.length, columns.length);
  for (let index = 0; index < maxLen; index += 1) {
    const col = columns[index] ?? { key: `col_${index + 1}`, original: null };
    values[col.key] = cleanText(row.values[index] ?? null);
  }
  return values;
}

export function transformValue(value, type) {
  if (value === null || value === undefined) return null;
  switch (type) {
    case "string":
      return cleanText(value);
    case "float": {
      const n = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    case "int": {
      const n = typeof value === "number" ? value : parseInt(String(value).replace(/,/g, ""), 10);
      return Number.isFinite(n) ? n : null;
    }
    case "date":
      return cleanText(value);
    default:
      return cleanText(value);
  }
}

export function setNested(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!current[k]) current[k] = {};
    current = current[k];
  }
  current[keys[keys.length - 1]] = value;
}

export function shouldSkip(record, rules) {
  if (!rules || rules.length === 0) return false;
  for (const rule of rules) {
    const v = record[rule.field];
    if (rule.match !== undefined) {
      if (String(v).trim() === rule.match) return true;
    }
    if (rule.contains !== undefined) {
      if (v && String(v).includes(rule.contains)) return true;
    }
    if (rule.equals !== undefined) {
      if (v === rule.equals || String(v) === String(rule.equals)) return true;
    }
    if (rule.isEmpty) {
      if (!v || String(v).trim() === "") return true;
    }
  }
  return false;
}
