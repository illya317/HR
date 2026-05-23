import { readFileSync } from "fs";
import { resolve } from "path";
import { pinyin } from "pinyin-pro";

// ─── Schema auto-discovery ──────────────────────────────────

const SCHEMA_PATH = resolve(process.cwd(), "prisma/schema.prisma");
const schemaText = readFileSync(SCHEMA_PATH, "utf8");

/** 非业务字段，搜索时排除 */
const EXCLUDE_FIELDS = new Set([
  "id", "editedBy", "version", "sortOrder", "queryGroup",
  "userId", "password", "apiKey", "wxUserId",
  "dataJson", "itemsJson", "details", "contracts",
  "parentId", "childId", "employeeId", "departmentId", "positionId",
  "projectId", "workItemId", "reportId", "resourceId", "roleId",
  "scopeId", "targetId", "managerUserId",
  "headcount", "level", "isActive", "isPrimary", "isArchived",
  "isPrivate", "isConsolidated", "isResearch", "canLogin",
  "success", "gender", "isPrimary", "shareRatio",
]);

/** 每个 Prisma 模型的 String 字段列表，模块加载时解析一次 */
const modelStringFields: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  const models = schemaText.match(/model\s+(\w+)\s*\{/g) || [];
  for (const m of models) {
    const name = m.replace("model ", "").replace(" {", "").trim();
    const block = schemaText.match(new RegExp(`model\\s+${name}\\s*\\{([^}]+)\\}`));
    if (!block) continue;
    const fields = block[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//") && !l.startsWith("@@"));
    const stringFields: string[] = [];
    for (const f of fields) {
      const parts = f.split(/\s+/);
      if (parts.length < 3) continue;
      const fieldName = parts[0];
      const fieldType = parts[1].replace("?", "").replace("[]", "");
      if (fieldType === "String" && !EXCLUDE_FIELDS.has(fieldName)) {
        stringFields.push(fieldName);
      }
    }
    if (stringFields.length) map[name] = stringFields;
  }
  return map;
})();

// ─── Pinyin ─────────────────────────────────────────────────

export function getInitials(name: string): string {
  const result = pinyin(name, { type: "all" }) as Array<{ first: string }>;
  return result.map((r) => r.first).join("").toLowerCase();
}

// ─── Search ─────────────────────────────────────────────────

const PINYIN_FIELDS = new Set(["name", "alias", "departmentName"]);

/**
 * 通用搜索：自动匹配该模型所有 String 字段。
 * name/alias/departmentName 额外支持拼音首字母。
 */
export function matchAnyField(
  record: Record<string, unknown>,
  keyword: string,
  modelName: string
): boolean {
  const query = keyword.toLowerCase();
  const fields = modelStringFields[modelName];
  if (!fields) return false;

  for (const f of fields) {
    const val = String(record[f] ?? "").toLowerCase();
    if (val.includes(query)) return true;
    if (PINYIN_FIELDS.has(f)) {
      const initials = getInitials(val);
      if (initials.includes(query)) return true;
    }
  }
  return false;
}

/** 保留旧函数供 mapped 对象使用（有 employeeId + employeeName 的虚构字段） */
export function matchEmployee(
  employee: { name?: string | null; alias?: string | null; employeeId?: string | null; username?: string | null },
  keyword: string
): boolean {
  const query = keyword.toLowerCase();
  if ((employee.name || "").toLowerCase().includes(query)) return true;
  if ((employee.alias || "").toLowerCase().includes(query)) return true;
  if ((employee.employeeId || "").toLowerCase().includes(query)) return true;
  if ((employee.username || "").toLowerCase().includes(query)) return true;
  if (getInitials(employee.name || "").includes(query)) return true;
  return false;
}

/** 调试用：查看某模型的搜索字段 */
export function getSearchFields(modelName: string): string[] {
  return modelStringFields[modelName] || [];
}
