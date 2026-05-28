#!/usr/bin/env node
/**
 * API Route Governance Check
 *
 * 规则：
 * 1. 已废弃的兼容路由（旧入口）只能包含纯代理逻辑
 * 2. 新 API 必须放在对应域名的子目录下（/api/hr/*、/api/finance/* 等）
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../app/api");

// 已知兼容路由：只能纯代理
const LEGACY_ROUTES = [
  "employees",
  "positions",
  "departments",
  "employee-positions",
  "employee-projects",
  "projects",
];

const ALLOWED_LEGACY_PATTERNS = [
  /new URL\(/,
  /fetch\(/,
  /request\.url/,
  /request\.headers/,
  /request\.method/,
  /request\.text\(/,
  /await request\.text\(/,
  /export async function/,
  /^\s*\/\//,
  /^\s*$/,
  /^\s*\*\s*/,
  /^\s*@deprecated/,
  /^\s*\/\*\*/,
  /^\s*\*\/\s*$/,
  /proxy/,
  /target/,
  /url/,
  /origin/,
  /search/,
  /searchParams/,
  /pageSize/,
  /headers/,
  /method/,
  /body/,
  /return/,
  /\{/,
  /\}/,
  /^\s*import/,
  /^\s*const\s+url/,
  /^\s*const\s+target/,
];

const FORBIDDEN_LEGACY_PATTERNS = [
  /prisma\./,
  /NextResponse\.json\(.*\{/,
  /checkHRAccess/,
  /checkHRWrite/,
  /checkPermission/,
  /handleUpdateField/,
  /handleDelete/,
  /handleCreate/,
];

function isPureProxy(content) {
  const lines = content.split("\n");
  const codeLines = lines.filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  });

  // 如果包含任何禁止模式，就不是纯代理
  for (const line of codeLines) {
    for (const pattern of FORBIDDEN_LEGACY_PATTERNS) {
      if (pattern.test(line)) return false;
    }
  }

  // 检查是否有代理模式（inline 或 createProxyHandler）
  const hasProxy = codeLines.some((l) =>
    /fetch\(|new URL\(|target|createProxyHandler/.test(l)
  );
  return hasProxy;
}

let errors = 0;

for (const route of LEGACY_ROUTES) {
  const routeFile = path.join(ROOT, route, "route.ts");
  if (!fs.existsSync(routeFile)) continue;

  const content = fs.readFileSync(routeFile, "utf-8");

  if (!content.includes("@deprecated")) {
    console.error(`❌ ${route}/route.ts 缺少 @deprecated 标记`);
    errors++;
    continue;
  }

  if (!isPureProxy(content)) {
    console.error(`❌ ${route}/route.ts 包含非代理业务逻辑（必须纯代理）`);
    errors++;
  } else {
    console.log(`✓ ${route}/route.ts 纯代理`);
  }
}

// 额外检查：根级 route.ts 不允许新增非代理逻辑
const rootRoutes = fs.readdirSync(ROOT).filter((f) => {
  const full = path.join(ROOT, f);
  return fs.statSync(full).isDirectory() && !f.startsWith(".") && fs.existsSync(path.join(full, "route.ts"));
});

for (const route of rootRoutes) {
  const routeFile = path.join(ROOT, route, "route.ts");
  const content = fs.readFileSync(routeFile, "utf-8");

  // 根级目录下如果不是兼容路由，也应该有合理的域名前缀
  const hasDomainPrefix =
    ["admin", "auth", "finance", "hr", "inventory", "contracts", "reports", "user", "week-info", "works", "my-api-key", "my-targets", "position-descriptions", "employments"].includes(route) ||
    LEGACY_ROUTES.includes(route);

  if (!hasDomainPrefix) {
    console.error(`❌ ${route}/route.ts 缺少域名前缀，应放到 /api/<domain>/*`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\nAPI route governance check failed: ${errors} error(s)`);
  process.exit(1);
} else {
  console.log("\n✓ API route governance check passed");
}
