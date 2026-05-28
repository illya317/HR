/**
 * Profile configuration loader.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(__dirname, "..", "..", "config", "profiles");

const cache = new Map();

export function loadProfile(profileId) {
  if (cache.has(profileId)) return cache.get(profileId);

  const filePath = path.join(PROFILES_DIR, `${profileId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Profile config not found: ${filePath}`);
  }

  const config = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  cache.set(profileId, config);
  return config;
}

export function listProfiles() {
  return fs
    .readdirSync(PROFILES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function clearCache() {
  cache.clear();
}
