"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UserMenu from "@/app/components/UserMenu";
import { SessionUser } from "@/lib/types";

interface ModuleCard {
  title: string;
  desc: string;
  path: string;
  color: string;
  icon: React.ReactNode;
  visible: boolean;
}

export default function AdministrationPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  const modules: ModuleCard[] = [
    {
      title: "合同台账",
      desc: "北京/上海办公区及股东合同管理",
      path: "/contracts",
      color: "indigo",
      visible: !!user?.canAccessContract,
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const visibleModules = modules.filter((m) => m.visible);

  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: { bg: "bg-indigo-100", text: "text-indigo-600", ring: "hover:ring-indigo-400" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/company/logo.png" alt="公司" width={100} height={30} className="h-auto w-auto max-w-[100px] object-contain" />
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-medium text-gray-700">行政管理</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/portal")} className="text-sm text-gray-500 hover:text-emerald-600">返回入口</button>
            <UserMenu user={user} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">行政事务</h1>

        {visibleModules.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">暂无可用行政模块，请联系管理员开通权限。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleModules.map((m) => {
              const c = colorMap[m.color];
              return (
                <button
                  key={m.title}
                  onClick={() => router.push(m.path)}
                  className={`flex flex-col items-center rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:ring-2 ${c.ring}`}
                >
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${c.bg} ${c.text}`}>
                    {m.icon}
                  </div>
                  <h2 className="text-base font-semibold text-gray-800">{m.title}</h2>
                  <p className="mt-1 text-xs text-gray-500">{m.desc}</p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
