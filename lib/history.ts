import { prisma } from "./prisma";

// 有审计字段（editedBy + version）的表，必须在此注册 entityType。
// entityType = Prisma 模型名。
// 新增审计表时在此数组加一条即可。
const AUDITED_MODELS = [
  "Employee",
  "Employment",
  "Company",
  "CompanyRelation",
  "Department",
  "Position",
  "EDP",
  "Project",
  "EmployeeProject",
] as const;

type EntityType = (typeof AUDITED_MODELS)[number];

function assertEntityType(type: string): asserts type is EntityType {
  if (!(AUDITED_MODELS as readonly string[]).includes(type)) {
    throw new Error(
      `[snapshotHistory] 未注册的 entityType: "${type}"。请在 lib/history.ts 的 AUDITED_MODELS 数组中添加。`
    );
  }
}

/**
 * 记录编辑历史快照
 */
export async function snapshotHistory(
  entityType: string,
  entityId: string,
  oldData: Record<string, unknown> | null,
  userId: number
) {
  if (!oldData) return;
  assertEntityType(entityType);
  const maxVer = await prisma.editHistory.findFirst({
    where: { entityType, entityId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (maxVer?.version || 0) + 1;
  await prisma.editHistory.create({
    data: {
      entityType,
      entityId,
      version: nextVersion,
      dataJson: JSON.stringify(oldData),
      editedBy: userId,
    },
  });
}
