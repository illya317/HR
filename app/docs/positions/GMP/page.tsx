"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NavLink from "@/app/components/NavLink";
import UserMenu from "@/app/components/UserMenu";
import { SessionUser } from '@/lib/types';

interface PositionDesc {
  id: number; code: string; name: string;
  departmentName: string | null;
}

interface Group {
  code: string; name: string;
  positions: PositionDesc[];
  children: Group[];
}

export default function GmpPositionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") return new URLSearchParams(window.location.search).get("search") || "";
    return "";
  });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : Promise.reject()).then(d => setUser(d.user)).catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/position-descriptions")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const all = (data.positionDescriptions || []) as PositionDesc[];
        // Build tree from codes: GW-XXX-YYY → L1=XXX first 3 chars, L2=full XXX
        const map = new Map<string, Group>();
        for (const p of all) {
          const parts = p.code.split("-");
          const deptCode = parts[1] || "";
          const l1 = deptCode.slice(0, 3) + "000"; // e.g. CHM → CHM000
          const l2 = deptCode; // e.g. CHM100

          if (!map.has(l1)) map.set(l1, { code: l1, name: p.departmentName || l1, positions: [], children: [] });
          if (l1 !== l2) {
            if (!map.has(l2)) map.set(l2, { code: l2, name: p.departmentName || l2, positions: [], children: [] });
            if (!map.get(l1)!.children.find(c => c.code === l2)) {
              map.get(l1)!.children.push(map.get(l2)!);
            }
            map.get(l2)!.positions.push(p);
          } else {
            map.get(l1)!.positions.push(p);
          }
        }
        // Set proper names from positions
        for (const [, g] of map) {
          if (g.positions.length > 0 && g.name === g.code) {
            g.name = g.positions[0].departmentName || g.code;
          }
          for (const c of g.children) {
            if (c.positions.length > 0 && c.name === c.code) {
              c.name = c.positions[0].departmentName || c.code;
            }
          }
        }
        setGroups([...map.values()].filter(g => g.code.endsWith("000")));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggle(code: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  function filter(arr: PositionDesc[]) {
    if (!search) return arr;
    const q = search.toLowerCase();
    return arr.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }

  function renderGroup(g: Group, level: number) {
    const pos = filter(g.positions);
    const childMatch = g.children.filter(c => filter(c.positions).length > 0);
    if (!search && pos.length === 0 && childMatch.length === 0) return null;
    if (search && pos.length === 0 && childMatch.length === 0) return null;

    const isOpen = expanded.has(g.code) || !!search;
    const indent = level === 0 ? "" : "ml-4";
    const size = level === 0 ? "text-base font-bold" : "text-sm font-semibold";

    return (
      <div key={g.code} className={indent}>
        <button
          onClick={() => toggle(g.code)}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg ${size} text-gray-800 hover:bg-gray-100`}
        >
          <span className="text-gray-400 text-xs">{isOpen ? "▼" : "▶"}</span>
          {g.name}
          <span className="text-gray-400 font-normal text-xs">{pos.length} 岗</span>
        </button>
        {isOpen && pos.length > 0 && (
          <div className="divide-y divide-gray-50 border-t border-gray-100 ml-6">
            {pos.map(p => (
              <button
                key={p.code}
                onClick={() => router.push(`/docs/positions/GMP/${p.code}`)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-emerald-50 transition-colors"
              >
                <span className="text-xs text-gray-400 font-mono w-20 shrink-0">{p.code}</span>
                <span className="text-sm text-gray-700 flex-1">{p.name}</span>
                <span className="text-gray-300 text-xs">→</span>
              </button>
            ))}
          </div>
        )}
        {isOpen && g.children.map(c => renderGroup(c, level + 1))}
      </div>
    );
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">加载中...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/company/logo.png" alt="logo" width={100} height={30} className="h-auto w-auto max-w-[100px] object-contain" />
            <span className="text-sm text-gray-400">|</span><span className="text-sm font-medium text-gray-600">文档中心</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => router.push("/portal")} className="text-sm text-gray-500 hover:text-emerald-600">返回入口</button>
            <NavLink href="/reports">工作汇报</NavLink><NavLink href="/works">工作清单</NavLink><NavLink href="/history">历史记录</NavLink>
            <UserMenu user={user} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => router.push("/docs")} className="hover:text-emerald-600">文档中心</button>
          <span>/</span><span className="text-gray-700">岗位说明书</span>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800">岗位说明书</h1>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索岗位..." className="w-full sm:w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
        </div>

        {groups.length === 0 ? (
          <div className="rounded-lg bg-white py-16 text-center shadow-sm"><p className="text-gray-500">暂无数据</p></div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-2 space-y-1">
            {groups.map(g => renderGroup(g, 0))}
          </div>
        )}
      </main>
    </div>
  );
}
