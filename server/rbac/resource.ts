import { prisma } from "@/lib/prisma";

let resourceCache: { id: number; parentId: number | null }[] | null = null;

export function invalidateResourceCache() {
  resourceCache = null;
}

export async function getResourceDescendants(resourceId: number): Promise<number[]> {
  if (!resourceCache) {
    resourceCache = await prisma.resource.findMany({
      select: { id: true, parentId: true },
    });
  }

  const byParent = new Map<number, number[]>();
  for (const r of resourceCache) {
    if (r.parentId != null) {
      byParent.set(r.parentId, [...(byParent.get(r.parentId) || []), r.id]);
    }
  }

  const result: number[] = [];
  function dfs(id: number) {
    result.push(id);
    for (const child of byParent.get(id) || []) dfs(child);
  }
  dfs(resourceId);
  return result;
}
