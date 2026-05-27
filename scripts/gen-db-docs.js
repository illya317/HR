const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const outPath = path.join(__dirname, "..", "docs", "database.md");

const content = fs.readFileSync(schemaPath, "utf8");

// Extract model blocks
const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/gs;
const models = [];
let m;
while ((m = modelRegex.exec(content)) !== null) {
  const name = m[1];
  const body = m[2];
  const fields = [];
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    // Match field definitions: name Type [attributes] // comment
    const match = trimmed.match(/^(\w+)\s+(\S+)(.*)$/);
    if (match) {
      const [, fieldName, type, rest] = match;
      const commentMatch = rest.match(/\/\/(.*)$/);
      const comment = commentMatch ? commentMatch[1].trim() : "";
      const attrs = rest.replace(/\/\/.*$/, "").trim();
      fields.push({ name: fieldName, type, attrs, comment });
    }
  }
  models.push({ name, fields });
}

let md = "# 数据库表结构\n\n";
md += "> 本文档由 `scripts/gen-db-docs.js` 自动生成，基于 `prisma/schema.prisma`。\n\n";
md += "## 模型列表\n\n";
for (const model of models) {
  md += `### ${model.name}\n\n`;
  md += "| 字段 | 类型 | 属性 | 说明 |\n";
  md += "|------|------|------|------|\n";
  for (const f of model.fields) {
    md += `| ${f.name} | ${f.type} | ${f.attrs || "-"} | ${f.comment} |\n`;
  }
  md += "\n";
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md);
console.log("Generated", outPath);
