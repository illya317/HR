"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Toast from "@/app/components/Toast";
import { useToast } from "@/app/hooks/useToast";

interface User {
  id: number;
  name: string;
  canAccessWorks: boolean;
  canAccessHR: boolean;
}

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, closeToast } = useToast();

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src="/company/logo.png"
          alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "公司"}
          width={200}
          height={60}
          className="h-auto w-auto max-w-[200px] object-contain"
        />
        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          {process.env.NEXT_PUBLIC_APP_NAME || "工作台"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">欢迎，{user?.name}</p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* 工作汇报 */}
        <button
          onClick={() => router.push("/reports")}
          className="group flex flex-col items-center rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-emerald-400"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">工作汇报</h2>
          <p className="mt-2 text-sm text-gray-500">填写周报、月报、季报、年报</p>
        </button>

        {/* 人事行政管理 */}
        <button
          onClick={() => {
            if (user?.canAccessHR) {
              router.push("/hr");
            } else {
              showToast("暂无权限，请联系管理员开通", "error");
            }
          }}
          className="group flex flex-col items-center rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-blue-400"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">人事行政管理</h2>
          <p className="mt-2 text-sm text-gray-500">花名册、考勤、工作查看、绩效</p>
        </button>

        {/* 文档中心 */}
        <button
          onClick={() => router.push("/docs")}
          className="group flex flex-col items-center rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-purple-400"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">文档中心</h2>
          <p className="mt-2 text-sm text-gray-500">员工手册、操作指南、规章制度</p>
        </button>

        {/* 财务数据 */}
        <button
          onClick={() => router.push("/finance")}
          className="group flex flex-col items-center rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-amber-400"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">财务数据</h2>
          <p className="mt-2 text-sm text-gray-500">财务数据库与报表</p>
        </button>
      </div>

      <Toast
        message={toast?.message || ""}
        type={toast?.type}
        show={!!toast}
        onClose={closeToast}
      />
    </div>
  );
}
