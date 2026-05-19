"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UserMenu from "@/app/components/UserMenu";
import NavLink from "@/app/components/NavLink";
import DepartmentSwitcher from "@/app/components/DepartmentSwitcher";
import ConfirmModal from "@/app/components/ConfirmModal";
import Toast from "@/app/components/Toast";
import { useToast } from "@/app/hooks/useToast";
import WorkCard from "./WorkCard";
import WorkForm from "./WorkForm";
import SectionHeader from "./SectionHeader";
import type { WorkItem } from "./types";
import { SessionUser } from '@/lib/types';

export default function WorksPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);

  const [routineExpanded, setRoutineExpanded] = useState(true);
  const [nonRoutineExpanded, setNonRoutineExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const { toast, showToast, closeToast } = useToast();

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({ show: false, title: "", message: "", onConfirm: null });

  function openConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirmModal({ show: true, title, message, onConfirm });
  }

  function closeConfirm() {
    setConfirmModal({ show: false, title: "", message: "", onConfirm: null });
  }

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      await fetchWorks();
    } catch {
      router.push("/login");
    }
  }

  async function fetchWorks() {
    const selectedDept = typeof window !== "undefined" ? localStorage.getItem("selectedDeptId") : null;
    const deptParam = selectedDept ? `&deptId=${selectedDept}` : "";
    const res = await fetch(`/api/works?includeArchived=true${deptParam}`);
    const data = await res.json();
    setWorks(data.works || []);
    setLoading(false);
  }

  async function handleCreate(data: {
    category: string;
    content: string;
    importance: number;
    urgency: number;
    participants: string;
    sortOrder: number;
  }) {
    const selectedDept = typeof window !== "undefined" ? localStorage.getItem("selectedDeptId") : null;
    const body = selectedDept ? { ...data, deptId: parseInt(selectedDept) } : data;
    const res = await fetch("/api/works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      fetchWorks();
    } else {
      const err = await res.json();
      showToast(err.error || "添加失败", "error");
    }
  }

  async function handleUpdate(data: {
    category: string;
    content: string;
    importance: number;
    urgency: number;
    participants: string;
    sortOrder: number;
  }) {
    if (!editingWork) return;
    const res = await fetch(`/api/works/${editingWork.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditingWork(null);
      fetchWorks();
    } else {
      const err = await res.json();
      showToast(err.error || "更新失败", "error");
    }
  }

  async function handleDelete(id: number) {
    openConfirm("确认删除", "确定删除该工作项？", async () => {
      const res = await fetch(`/api/works/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchWorks();
      } else {
        const err = await res.json();
        showToast(err.error || "删除失败", "error");
      }
      closeConfirm();
    });
  }

  async function handleArchive(id: number) {
    const res = await fetch(`/api/works/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    if (res.ok) {
      fetchWorks();
    } else {
      const err = await res.json();
      showToast(err.error || "归档失败", "error");
    }
  }

  async function handleRestore(id: number) {
    const res = await fetch(`/api/works/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false }),
    });
    if (res.ok) {
      fetchWorks();
    } else {
      const err = await res.json();
      showToast(err.error || "恢复失败", "error");
    }
  }

  async function handleMove(id: number, direction: number) {
    const categoryWorks = works.filter(
      (w) => w.category === works.find((w) => w.id === id)?.category && !w.isArchived
    );
    const sorted = categoryWorks.sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((w) => w.id === id);
    const target = idx + direction;
    if (target < 0 || target >= sorted.length) return;

    const currentWork = sorted[idx];
    const targetWork = sorted[target];

    await Promise.all([
      fetch(`/api/works/${currentWork.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: targetWork.sortOrder }),
      }),
      fetch(`/api/works/${targetWork.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: currentWork.sortOrder }),
      }),
    ]);

    fetchWorks();
  }

  const isAdmin = user?.isWorkListAdmin ?? false;

  const routineWorks = works
    .filter((w) => w.category === "routine" && !w.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const nonRoutineWorks = works
    .filter((w) => w.category === "non-routine" && !w.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const archivedWorks = works
    .filter((w) => w.isArchived)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/company/logo.png" alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "公司"} width={100} height={30} className="h-auto w-auto max-w-[100px] object-contain" />
            <DepartmentSwitcher onChange={() => { setLoading(true); fetchWorks(); }} />
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/portal")}
              className="text-sm text-gray-500 hover:text-emerald-600"
            >
              返回入口
            </button>
            <NavLink href="/reports">工作汇报</NavLink>
            <NavLink href="/works">工作清单</NavLink>
            <NavLink href="/history">历史记录</NavLink>
            <UserMenu user={user} />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">部门工作清单</h2>
          {isAdmin && !showForm && !editingWork && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
            >
              + 添加工作项
            </button>
          )}
        </div>

        {!isAdmin && (
          <div className="mb-4 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-500">
            仅部门管理员可编辑工作清单
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <WorkForm
              onSave={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* 日常工作 */}
        <div className="mb-8">
          <SectionHeader
            title="日常工作"
            count={routineWorks.length}
            expanded={routineExpanded}
            onToggle={() => setRoutineExpanded(!routineExpanded)}
          />
          {routineExpanded && (
            <div className="space-y-3">
              {routineWorks.map((work, index) =>
                editingWork?.id === work.id ? (
                  <WorkForm
                    key={work.id}
                    initial={work}
                    onSave={handleUpdate}
                    onCancel={() => setEditingWork(null)}
                  />
                ) : (
                  <WorkCard
                    key={work.id}
                    work={work}
                    isAdmin={isAdmin}
                    onEdit={setEditingWork}
                    onDelete={handleDelete}
                    onMove={handleMove}
                    onArchive={handleArchive}
                    isFirst={index === 0}
                    isLast={index === routineWorks.length - 1}
                  />
                )
              )}
              {routineWorks.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  暂无日常工作项
                </div>
              )}
            </div>
          )}
        </div>

        {/* 其他工作 */}
        <div className="mb-8">
          <SectionHeader
            title="其他工作"
            count={nonRoutineWorks.length}
            expanded={nonRoutineExpanded}
            onToggle={() => setNonRoutineExpanded(!nonRoutineExpanded)}
          />
          {nonRoutineExpanded && (
            <div className="space-y-3">
              {nonRoutineWorks.map((work, index) =>
                editingWork?.id === work.id ? (
                  <WorkForm
                    key={work.id}
                    initial={work}
                    onSave={handleUpdate}
                    onCancel={() => setEditingWork(null)}
                  />
                ) : (
                  <WorkCard
                    key={work.id}
                    work={work}
                    isAdmin={isAdmin}
                    onEdit={setEditingWork}
                    onDelete={handleDelete}
                    onMove={handleMove}
                    onArchive={handleArchive}
                    isFirst={index === 0}
                    isLast={index === nonRoutineWorks.length - 1}
                  />
                )
              )}
              {nonRoutineWorks.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  暂无其他工作项
                </div>
              )}
            </div>
          )}
        </div>

        {/* 已归档 */}
        {archivedWorks.length > 0 && (
          <div>
            <SectionHeader
              title="已归档"
              count={archivedWorks.length}
              expanded={archivedExpanded}
              onToggle={() => setArchivedExpanded(!archivedExpanded)}
            />
            {archivedExpanded && (
              <div className="space-y-3">
                {archivedWorks.map((work) =>
                  editingWork?.id === work.id ? (
                    <WorkForm
                      key={work.id}
                      initial={work}
                      onSave={handleUpdate}
                      onCancel={() => setEditingWork(null)}
                    />
                  ) : (
                    <WorkCard
                      key={work.id}
                      work={work}
                      isAdmin={isAdmin}
                      onEdit={setEditingWork}
                      onDelete={handleDelete}
                      onMove={handleMove}
                      onRestore={handleRestore}
                      isFirst={false}
                      isLast={false}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Toast
        message={toast?.message || ""}
        type={toast?.type}
        show={!!toast}
        onClose={closeToast}
      />

      <ConfirmModal
        open={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => confirmModal.onConfirm?.()}
        onCancel={closeConfirm}
      />
    </div>
  );
}
