"use client";

import { useEffect, useState, useRef } from "react";
import { isTopLevelResource } from "./lib";
import { FENGHUA_BIO_GROUP } from "@/lib/company";
import type { ResourceItem } from "./types";

interface Props {
  user: { id: number; name: string; isWorkListAdmin: boolean; isAnyGroupAdmin: boolean };
  resources: ResourceItem[];
  showToast: (msg: string, type?: "success" | "error") => void;
}

interface EmployeeResult {
  rowId: number;
  employeeId: string;
  name: string;
  alias: string;
  dept1: string;
  position: string;
  userId: number | null;
}

interface SystemAdmin {
  id: number;
  name: string;
  username: string;
}

interface DeptAdminUser {
  id: number;
  name: string;
}

interface DeptAdminEntry {
  id: number;
  userId: number;
  user: DeptAdminUser;
}

interface DeptItem {
  id: number;
  name: string;
  company: string;
  admins: DeptAdminEntry[];
}

export function useByPermissionTab({ user, resources, showToast }: Props) {
  const topResources = resources.filter((r) => isTopLevelResource(r.key));

  const [systemAdmins, setSystemAdmins] = useState<SystemAdmin[]>([]);
  const [deptData, setDeptData] = useState<DeptItem[]>([]);
  const [sysLoading, setSysLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(true);
  const [companyTab, setCompanyTab] = useState<"全部" | "丰华制药" | "丰华生物">("全部");

  // Search states
  const [sysSearchQ, setSysSearchQ] = useState("");
  const [sysResults, setSysResults] = useState<EmployeeResult[]>([]);
  const [sysConfirm, setSysConfirm] = useState<number | null>(null);
  const sysTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deptAddOpen, setDeptAddOpen] = useState<number | null>(null);
  const [deptSearchQ, setDeptSearchQ] = useState("");
  const [deptResults, setDeptResults] = useState<EmployeeResult[]>([]);
  const [deptConfirm, setDeptConfirm] = useState<number | null>(null);
  const deptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadSystemAdmins() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setSystemAdmins(
          (data.users || [])
            .filter((u: any) =>
              u.resourceRoles?.some((rr: any) => rr.resource?.key === "system" && rr.role?.key === "admin")
            )
            .map((u: any) => ({ id: u.id, name: u.name, username: u.username }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadDeptAdmins() {
    try {
      const res = await fetch("/api/admin/department-admins");
      if (!res.ok) return;
      const data = await res.json();
      const depts = data.departments || [];
      const admins = data.admins || [];
      setDeptData(
        depts
          .map((d: any) => ({
            ...d,
            admins: admins.filter((a: any) => a.scopeId === String(d.id)),
          }))
          .sort((a: any, b: any) => {
            const ga = FENGHUA_BIO_GROUP.includes(a.company) ? "丰华生物" : a.company;
            const gb = FENGHUA_BIO_GROUP.includes(b.company) ? "丰华生物" : b.company;
            return ga.localeCompare(gb) || a.name.localeCompare(b.name);
          })
      );
    } catch (e) {
      console.error(e);
    }
  }

  // Load data — each section manages its own loading state independently
  useEffect(() => {
    (async () => {
      if (user.isWorkListAdmin) {
        setSysLoading(true);
        await loadSystemAdmins();
        setSysLoading(false);
      } else {
        setSysLoading(false);
      }
    })();
    (async () => {
      setDeptLoading(true);
      await loadDeptAdmins();
      setDeptLoading(false);
    })();
  }, []);

  // Debounced system admin search
  useEffect(() => {
    if (!sysSearchQ.trim()) {
      setSysResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/employees/search?q=${encodeURIComponent(sysSearchQ.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSysResults((data.items || []).filter((item: EmployeeResult) => item.userId != null));
        }
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [sysSearchQ]);

  // Debounced department admin search
  useEffect(() => {
    if (!deptSearchQ.trim() || deptAddOpen === null) {
      setDeptResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/employees/search?q=${encodeURIComponent(deptSearchQ.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setDeptResults((data.items || []).filter((item: EmployeeResult) => item.userId != null));
        }
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [deptSearchQ, deptAddOpen]);

  // Confirm helpers — using ref to avoid stale closure issues
  function handleRemoveSystemAdmin(adminId: number) {
    if (sysConfirm === adminId) {
      removeSystemAdmin(adminId);
      setSysConfirm(null);
      if (sysTimer.current) {
        clearTimeout(sysTimer.current);
        sysTimer.current = null;
      }
    } else {
      setSysConfirm(adminId);
      if (sysTimer.current) clearTimeout(sysTimer.current);
      sysTimer.current = setTimeout(() => setSysConfirm(null), 3000);
    }
  }

  function handleRemoveDeptAdmin(adminId: number) {
    if (deptConfirm === adminId) {
      removeDeptAdmin(adminId);
      setDeptConfirm(null);
      if (deptTimer.current) {
        clearTimeout(deptTimer.current);
        deptTimer.current = null;
      }
    } else {
      setDeptConfirm(adminId);
      if (deptTimer.current) clearTimeout(deptTimer.current);
      deptTimer.current = setTimeout(() => setDeptConfirm(null), 3000);
    }
  }

  async function addSystemAdmin(userId: number, name: string) {
    const res = await fetch("/api/admin/user-permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, resourceKey: "system", roleKey: "admin", value: true }),
    });
    if (res.ok) {
      showToast(`已添加：${name}`, "success");
      setSysSearchQ("");
      loadSystemAdmins();
    } else {
      const e = await res.json().catch(() => ({ error: "失败" }));
      showToast(e.error, "error");
    }
  }

  async function removeSystemAdmin(userId: number) {
    const res = await fetch("/api/admin/user-permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, resourceKey: "system", roleKey: "admin", value: false }),
    });
    if (res.ok) {
      showToast("已移除", "success");
      loadSystemAdmins();
    } else {
      const e = await res.json().catch(() => ({ error: "失败" }));
      showToast(e.error, "error");
    }
  }

  async function addDeptAdmin(departmentId: number, userId: number, name: string) {
    const res = await fetch("/api/admin/department-admins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId, userId }),
    });
    if (res.ok) {
      showToast(`已添加：${name}`, "success");
      setDeptAddOpen(null);
      setDeptSearchQ("");
      loadDeptAdmins();
    } else {
      const e = await res.json().catch(() => ({ error: "失败" }));
      showToast(e.error, "error");
    }
  }

  async function removeDeptAdmin(adminId: number) {
    const res = await fetch(`/api/admin/department-admins?id=${adminId}`, { method: "DELETE" });
    if (res.ok) {
      showToast("已移除", "success");
      loadDeptAdmins();
    } else {
      const e = await res.json().catch(() => ({ error: "失败" }));
      showToast(e.error, "error");
    }
  }

  const filteredDepts =
    companyTab === "全部"
      ? deptData
      : companyTab === "丰华制药"
        ? deptData.filter((d) => d.company === "丰华制药")
        : deptData.filter((d) => FENGHUA_BIO_GROUP.includes(d.company));

  return {
    topResources,
    systemAdmins,
    deptData,
    sysLoading,
    deptLoading,
    companyTab,
    setCompanyTab,
    sysSearchQ,
    setSysSearchQ,
    sysResults,
    sysConfirm,
    handleRemoveSystemAdmin,
    addSystemAdmin,
    deptAddOpen,
    setDeptAddOpen,
    deptSearchQ,
    setDeptSearchQ,
    deptResults,
    deptConfirm,
    handleRemoveDeptAdmin,
    addDeptAdmin,
    filteredDepts,
    user,
  };
}
