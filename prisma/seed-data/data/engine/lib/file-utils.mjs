/**
 * File identification utilities.
 * Pure functions — no hard-coded paths.
 */

import fs from "fs";

export function loadPatterns(patternsPath) {
  return JSON.parse(fs.readFileSync(patternsPath, "utf-8"));
}

export function identifyProfile(filename, patterns) {
  const base = filename.replace(/\.xlsx?$/i, "");
  for (const p of patterns) {
    if (p.patterns.some((reStr) => new RegExp(reStr).test(base))) {
      return p;
    }
  }
  return null;
}

export function getYearFromFilename(filename) {
  const m = filename.match(/(20)?(\d{2})/);
  if (!m) return null;
  const yy = parseInt(m[2], 10);
  return yy >= 25 && yy <= 99 ? 2000 + yy : 1900 + yy;
}
