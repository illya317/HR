// 为所有审计表生成 V0 快照（tag=当天日期）
// 仅对今天有编辑记录的表/记录生成，没编辑则跳过
// 用法: node scripts/gen-v0-snapshots.js [YYYY-MM-DD]

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const AUDITED_MODELS = [
  "Employee", "Employment", "Company", "CompanyRelation",
  "Department", "Position", "EDP", "Project", "EmployeeProject",
];

function clientKey(name) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

async function main() {
  const date = process.argv[2] || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const tag = `V0:${date}`;

  const todayStart = new Date(`${date}T00:00:00+08:00`);
  const todayEnd = new Date(`${date}T23:59:59+08:00`);

  let totalCreated = 0;

  for (const model of AUDITED_MODELS) {
    // 查今天该模型是否有编辑记录
    const hasEdits = await prisma.editHistory.findFirst({
      where: {
        entityType: model,
        createdAt: { gte: todayStart, lte: todayEnd },
        tag: null, // 排除已有 V0
      },
    });

    if (!hasEdits) {
      console.log(`${model}: 今天无编辑，跳过`);
      continue;
    }

    // 查该模型所有记录
    const records = await prisma[clientKey(model)].findMany({
      select: { id: true },
    });

    let modelCount = 0;
    for (const r of records) {
      // 检查今天是否已有 V0
      const existing = await prisma.editHistory.findFirst({
        where: { entityType: model, entityId: String(r.id), tag },
      });
      if (existing) continue;

      // 保存当前快照
      const record = await prisma[clientKey(model)].findUnique({
        where: { id: r.id },
      });
      if (!record) continue;

      await prisma.editHistory.create({
        data: {
          entityType: model,
          entityId: String(r.id),
          version: 0,
          tag,
          dataJson: JSON.stringify(record),
          editedBy: 0, // 系统自动
        },
      });
      modelCount++;
    }

    console.log(`${model}: 创建 ${modelCount} 条 V0 (${tag})`);
    totalCreated += modelCount;
  }

  console.log(`\n完成: 共 ${totalCreated} 条 V0 快照`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
