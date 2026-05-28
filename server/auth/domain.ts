import { checkPermission } from "@/server/rbac/check";

export async function checkHRAccess(userId: number): Promise<boolean> {
  return (
    (await checkPermission(userId, "system", "admin")) ||
    (await checkPermission(userId, "people", "access"))
  );
}

export async function checkWorksAccess(userId: number): Promise<boolean> {
  return (
    (await checkPermission(userId, "system", "admin")) ||
    (await checkPermission(userId, "work", "access"))
  );
}

export async function checkFinanceAccess(userId: number): Promise<boolean> {
  return (
    (await checkPermission(userId, "system", "admin")) ||
    (await checkPermission(userId, "finance", "access"))
  );
}

export async function checkInventoryAccess(userId: number): Promise<boolean> {
  return (
    (await checkPermission(userId, "system", "admin")) ||
    (await checkPermission(userId, "inventory", "access"))
  );
}

export async function checkContractAccess(userId: number): Promise<boolean> {
  return (
    (await checkPermission(userId, "system", "admin")) ||
    (await checkPermission(userId, "contract", "access"))
  );
}
