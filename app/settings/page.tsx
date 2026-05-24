"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NavLink from "@/app/components/NavLink";
import UserMenu from "@/app/components/UserMenu";
import { SessionUser } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 修改密码
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // 修改账号
  const [newUsername, setNewUsername] = useState("");
  const [unameError, setUnameError] = useState("");
  const [unameSuccess, setUnameSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("not auth");
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPwd !== confirmPwd) {
      setPwdError("两次输入的新密码不一致");
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
    });

    const data = await res.json();
    if (!res.ok) {
      setPwdError(data.error || "修改失败");
      return;
    }

    setPwdSuccess("密码修改成功，请重新登录");
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setTimeout(() => { router.push("/login"); }, 1500);
  }

  async function handleChangeUsername(e: React.FormEvent) {
    e.preventDefault();
    setUnameError("");
    setUnameSuccess("");
    if (!newUsername.trim()) { setUnameError("用户名不能为空"); return; }
    if (!user) return;
    const res = await fetch("/api/admin/users/" + user.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: "username", value: newUsername.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setUnameError(data.error || "修改失败"); return; }
    setUnameSuccess("用户名已修改");
    setNewUsername("");
  }

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

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">设置</h1>

        <div className="space-y-6">
          {/* 修改账号 */}
          <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">修改账号</h2>
            <form onSubmit={handleChangeUsername} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">当前用户名</label>
                <p className="text-sm text-gray-700">{user?.username || "(未设置)"}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">新用户名</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                  className="w-44 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none" required />
              </div>
              <button type="submit" className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm text-white hover:bg-emerald-700 shrink-0">确认</button>
            </form>
            {unameError && <p className="mt-2 text-xs text-red-500">{unameError}</p>}
            {unameSuccess && <p className="mt-2 text-xs text-emerald-600">{unameSuccess}</p>}
          </div>

          {/* 修改密码 */}
          <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">修改密码</h2>
            <form onSubmit={handleChangePassword} className="flex items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">旧密码</label>
                <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)}
                  className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">新密码</label>
                <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                  className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none" required minLength={4} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">确认</label>
                <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none" required minLength={4} />
              </div>
              <button type="submit" className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm text-white hover:bg-emerald-700 shrink-0">确认</button>
            </form>
            {pwdError && <p className="mt-2 text-xs text-red-500">{pwdError}</p>}
            {pwdSuccess && <p className="mt-2 text-xs text-emerald-600">{pwdSuccess}</p>}
          </div>

          {/* API 接入 */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">API 接入</h2>
            <p className="mb-3 text-sm text-gray-600">
              机器人或外部系统可通过 API 接入，与网页版权限一致。
            </p>
            <Link
              href="/api-guide"
              className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
            >
              查看 API 接入指南 →
            </Link>
          </div>

          {/* 管理员入口 */}
          {user?.isWorkListAdmin && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">管理员</h2>
              <Link
                href="/admin"
                className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                进入管理后台 →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
