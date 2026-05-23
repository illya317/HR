"use client";

import { useMemo, useState } from "react";
import type { Position, EDP, Department } from "./useAnalyticsData";

function StatCard({ label, value, sub, color = "emerald" }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-lg p-4 ${colorMap[color] || colorMap.emerald}`}>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-[10px] opacity-70">{sub}</div>}
      <div className="mt-0.5 text-xs opacity-80">{label}</div>
    </div>
  );
}

export default function PositionAnalytics({ positions, edps, departments }: { positions: Position[]; edps: EDP[]; departments: Department[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"code" | "name" | "headcount" | "dept">("headcount");
  const [sortDesc, setSortDesc] = useState(true);

  const activeEdps = useMemo(() => edps.filter((e) => !e.endDate), [edps]);

  const activeHeadcounts = useMemo(() => {
    const map = new Map<number, number>();
    activeEdps.forEach((e) => {
      if (e.positionId) {
        map.set(e.positionId, (map.get(e.positionId) || 0) + 1);
      }
    });
    return map;
  }, [activeEdps]);

  const positionsWithActive = useMemo(() => {
    return positions.map((p) => ({ ...p, activeHeadcount: activeHeadcounts.get(p.id) || 0 })) as (Position & { activeHeadcount: number })[];
  }, [positions, activeHeadcounts]);

  const stats = useMemo(() => {
    const total = positionsWithActive.length;
    const occupied = positionsWithActive.filter((p) => p.activeHeadcount > 0).length;
    const vacant = total - occupied;
    const pharma = positionsWithActive.filter((p) => p.company === "丰华制药").length;
    const bio = positionsWithActive.filter((p) => p.company === "丰华生物").length;

    // dept distribution
    const deptMap = new Map<string, { count: number; positions: number }>();
    positionsWithActive.forEach((p) => {
      const dn = p.departmentName || "未分配";
      const curr = deptMap.get(dn) || { count: 0, positions: 0 };
      curr.positions++;
      curr.count += p.activeHeadcount;
      deptMap.set(dn, curr);
    });

    return { total, occupied, vacant, pharma, bio, deptDistribution: sortEntries([...deptMap.entries()]) };
  }, [positionsWithActive]);

  function sortEntries(entries: [string, { count: number; positions: number }][]) {
    return entries.sort((a, b) => b[1].count - a[1].count);
  }

  const filtered = useMemo(() => {
    let list: (Position & { activeHeadcount: number })[] = [...positionsWithActive];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.alias || "").toLowerCase().includes(q) ||
          (p.departmentName || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "code": av = a.code; bv = b.code; break;
        case "name": av = a.name; bv = b.name; break;
        case "headcount": av = a.activeHeadcount; bv = b.activeHeadcount; break;
        case "dept": av = a.departmentName || ""; bv = b.departmentName || ""; break;
        default: av = a.activeHeadcount; bv = b.activeHeadcount;
      }
      if (typeof av === "string") return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
      return sortDesc ? bv - av : av - bv;
    });
  }, [positionsWithActive, search, sortKey, sortDesc]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else { setSortKey(key); setSortDesc(true); }
  };

  const sortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return "↕";
    return sortDesc ? "↓" : "↑";
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="岗位总数" value={stats.total} color="emerald" />
        <StatCard label="有任职" value={stats.occupied} sub={`占比 ${stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}%`} color="blue" />
        <StatCard label="空岗" value={stats.vacant} color="amber" />
        <StatCard label="制药岗位" value={stats.pharma} color="rose" />
        <StatCard label="生物岗位" value={stats.bio} color="purple" />
      </div>

      {/* Dept distribution */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">部门岗位分布</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {stats.deptDistribution.map(([name, data]) => {
            const pct = stats.total > 0 ? Math.round((data.positions / stats.total) * 100) : 0;
            return (
              <div key={name} className="flex items-center gap-3 py-1.5">
                <span className="w-32 shrink-0 text-xs text-gray-600 truncate">{name}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-sky-400 rounded transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-xs text-gray-700">{data.positions}</span>
                <span className="w-8 text-right text-xs text-gray-400">{data.count}人</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Position table */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700">岗位明细</h3>
          <input
            type="text"
            placeholder="搜索岗位名、编码、部门..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-sm px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-emerald-400"
          />
          <span className="text-xs text-gray-400">共 {filtered.length} 个岗位</span>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-gray-500">
                <th className="text-left py-2 px-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("code")}>
                  编码 {sortIcon("code")}
                </th>
                <th className="text-left py-2 px-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("name")}>
                  岗位名 {sortIcon("name")}
                </th>
                <th className="text-left py-2 px-2">别名</th>
                <th className="text-left py-2 px-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("dept")}>
                  部门 {sortIcon("dept")}
                </th>
                <th className="text-left py-2 px-2">公司</th>
                <th className="text-right py-2 px-2 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("headcount")}>
                  任职人数 {sortIcon("headcount")}
                </th>
                <th className="text-left py-2 px-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isVacant = p.activeHeadcount === 0;
                return (
                  <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isVacant ? "bg-amber-50/30" : ""}`}>
                    <td className="py-2 px-2 font-mono text-gray-500">{p.code}</td>
                    <td className="py-2 px-2 font-medium">{p.name}</td>
                    <td className="py-2 px-2 text-gray-400">{p.alias || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{p.departmentName || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{p.company}</td>
                    <td className="py-2 px-2 text-right font-medium">{p.activeHeadcount}</td>
                    <td className="py-2 px-2">
                      {isVacant ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">空岗</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">在岗</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-gray-400">暂无匹配数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
