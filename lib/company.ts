// 公司编码 ↔ 名称（同步自 Company 表，手动维护）
export const CODE_TO_NAME: Record<string, string> = {
  "01": "丰华生物",
  "02": "丰华天力通",
  "03": "丰华悦通",
  "04": "丰华制药",
  "05": "加拿大",
};

export const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_NAME).map(([k, v]) => [v, k])
);

// 丰华生物集团 — 除丰华制药外的所有实体（共享查询数据）
export const FENGHUA_BIO_GROUP = ["丰华生物", "丰华天力通", "丰华悦通", "加拿大"];

// 共享代码池的公司（部门/岗位编码共用前缀）
export const SHARED_GROUP_CODES = ["01", "02", "03"];

export const ALL_COMPANIES = [...FENGHUA_BIO_GROUP, "丰华制药"];

// 公司名筛选：丰华生物集团内任一公司 → 返回全集团
export function resolveCompanyFilter(companyName: string): string[] {
  if (companyName === "全部") return ALL_COMPANIES;
  if (FENGHUA_BIO_GROUP.includes(companyName)) return FENGHUA_BIO_GROUP;
  return [companyName];
}

// 编码 → 公司名（兼容2位公司码和多位部门/岗位码前缀）
export function getCompanyFromCode(code: string): string {
  const prefix = code.slice(0, 2);
  return CODE_TO_NAME[prefix] || "";
}

// 是否为丰华制药编码
export function isPharma(code: string): boolean {
  return code.slice(0, 2) === "04";
}

// 是否为丰华生物体系编码
export function isBio(code: string): boolean {
  return code.slice(0, 2) !== "04";
}

