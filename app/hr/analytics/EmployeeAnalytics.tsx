"use client";

import { useMemo, useState } from "react";
import type { Employee, Employment } from "./useAnalyticsData";

function StatCard({ label, value, color = "emerald" }: { label: string; value: string | number; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className={`rounded-lg p-4 ${colorMap[color] || colorMap.emerald}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs opacity-80">{label}</div>
    </div>
  );
}

function DistributionBar({ label, count, total, color = "bg-emerald-500" }: { label: string; count: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 shrink-0 text-xs text-gray-600 truncate">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
        <div className={`h-full ${color} rounded transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs text-gray-700 font-medium">{count}</span>
      <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-gray-700 mb-3 mt-6">{children}</h3>;
}

function sortEntries(entries: [string, number][]) {
  return entries.sort((a, b) => b[1] - a[1]);
}

export default function EmployeeAnalytics({ employees, employments }: { employees: Employee[]; employments: Employment[] }) {
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employments.filter((e) => e.isActive).length;
    const inactive = employments.filter((e) => !e.isActive).length;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const joinedThisMonth = employments.filter((e) => {
      if (!e.joinDate) return false;
      const d = new Date(e.joinDate);
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    }).length;

    const leftThisMonth = employments.filter((e) => {
      if (!e.leaveDate) return false;
      const d = new Date(e.leaveDate);
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    }).length;

    // gender
    const genderMap = new Map<string, number>();
    employees.forEach((e) => {
      const g = e.gender || "未知";
      genderMap.set(g, (genderMap.get(g) || 0) + 1);
    });

    // education
    const eduMap = new Map<string, number>();
    employees.forEach((e) => {
      const v = e.education || "未知";
      eduMap.set(v, (eduMap.get(v) || 0) + 1);
    });

    // politics
    const politicsMap = new Map<string, number>();
    employees.forEach((e) => {
      const v = e.politics || "未知";
      politicsMap.set(v, (politicsMap.get(v) || 0) + 1);
    });

    // ethnicity
    const ethnicityMap = new Map<string, number>();
    employees.forEach((e) => {
      const v = e.ethnicity || "未知";
      ethnicityMap.set(v, (ethnicityMap.get(v) || 0) + 1);
    });

    // company from employment
    const companyMap = new Map<string, number>();
    employments.forEach((e) => {
      const c = e.currentCompany || "未知";
      companyMap.set(c, (companyMap.get(c) || 0) + 1);
    });

    // age groups
    const ageMap = new Map<string, number>();
    employees.forEach((e) => {
      if (!e.birthDate) {
        ageMap.set("未知", (ageMap.get("未知") || 0) + 1);
        return;
      }
      const birth = new Date(e.birthDate);
      const age = now.getFullYear() - birth.getFullYear();
      let group = "";
      if (age < 25) group = "25岁以下";
      else if (age < 30) group = "25-29岁";
      else if (age < 35) group = "30-34岁";
      else if (age < 40) group = "35-39岁";
      else if (age < 45) group = "40-44岁";
      else if (age < 50) group = "45-49岁";
      else group = "50岁及以上";
      ageMap.set(group, (ageMap.get(group) || 0) + 1);
    });

    const ageOrder = ["25岁以下", "25-29岁", "30-34岁", "35-39岁", "40-44岁", "45-49岁", "50岁及以上", "未知"];
    const ageEntries = ageOrder.map((k) => [k, ageMap.get(k) || 0] as [string, number]).filter(([, v]) => v > 0);

    // recent joins / leaves
    const recentJoins = employments
      .filter((e) => e.joinDate)
      .sort((a, b) => new Date(b.joinDate!).getTime() - new Date(a.joinDate!).getTime())
      .slice(0, 10);
    const recentLeaves = employments
      .filter((e) => e.leaveDate)
      .sort((a, b) => new Date(b.leaveDate!).getTime() - new Date(a.leaveDate!).getTime())
      .slice(0, 10);

    return {
      total,
      active,
      inactive,
      joinedThisMonth,
      leftThisMonth,
      gender: sortEntries([...genderMap.entries()]),
      education: sortEntries([...eduMap.entries()]),
      politics: sortEntries([...politicsMap.entries()]),
      ethnicity: sortEntries([...ethnicityMap.entries()]),
      company: sortEntries([...companyMap.entries()]),
      age: ageEntries,
      recentJoins,
      recentLeaves,
    };
  }, [employees, employments]);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        (e.alias || "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="员工总数" value={stats.total} color="emerald" />
        <StatCard label="在职人数" value={stats.active} color="blue" />
        <StatCard label="离职人数" value={stats.inactive} color="rose" />
        <StatCard label="本月入职" value={stats.joinedThisMonth} color="amber" />
        <StatCard label="本月离职" value={stats.leftThisMonth} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>性别分布</SectionTitle>
          {stats.gender.map(([k, v]) => (
            <DistributionBar key={k} label={k} count={v} total={stats.total} color="bg-blue-400" />
          ))}
        </div>

        {/* Age */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>年龄分布</SectionTitle>
          {stats.age.map(([k, v]) => (
            <DistributionBar key={k} label={k} count={v} total={stats.total} color="bg-emerald-400" />
          ))}
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>学历分布</SectionTitle>
          {stats.education.map(([k, v]) => (
            <DistributionBar key={k} label={k} count={v} total={stats.total} color="bg-amber-400" />
          ))}
        </div>

        {/* Politics */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>政治面貌</SectionTitle>
          {stats.politics.map(([k, v]) => (
            <DistributionBar key={k} label={k} count={v} total={stats.total} color="bg-purple-400" />
          ))}
        </div>

        {/* Company */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>公司分布</SectionTitle>
          {stats.company.map(([k, v]) => (
            <DistributionBar key={k} label={k} count={v} total={stats.active + stats.inactive} color="bg-sky-400" />
          ))}
        </div>

        {/* Ethnicity */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>民族分布（前10）</SectionTitle>
          {stats.ethnicity.slice(0, 10).map(([k, v]) => (
            <DistributionBar key={k} label={k} count={v} total={stats.total} color="bg-rose-400" />
          ))}
        </div>
      </div>

      {/* Recent changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>最近入职（前10）</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2">姓名</th>
                <th className="text-left py-2">公司</th>
                <th className="text-left py-2">入职日期</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentJoins.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-medium">{e.employeeName}</td>
                  <td className="py-2 text-gray-500">{e.currentCompany || "—"}</td>
                  <td className="py-2 text-gray-500">{e.joinDate}</td>
                </tr>
              ))}
              {stats.recentJoins.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-gray-400">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <SectionTitle>最近离职（前10）</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2">姓名</th>
                <th className="text-left py-2">公司</th>
                <th className="text-left py-2">离职日期</th>
                <th className="text-left py-2">原因</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLeaves.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-medium">{e.employeeName}</td>
                  <td className="py-2 text-gray-500">{e.currentCompany || "—"}</td>
                  <td className="py-2 text-gray-500">{e.leaveDate}</td>
                  <td className="py-2 text-gray-500">{e.leaveReason || "—"}</td>
                </tr>
              ))}
              {stats.recentLeaves.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-gray-400">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee search */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-700">员工搜索</h3>
          <input
            type="text"
            placeholder="搜索姓名、工号、别名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-sm px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-emerald-400"
          />
          <span className="text-xs text-gray-400">共 {filteredEmployees.length} 人</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2 px-2">工号</th>
                <th className="text-left py-2 px-2">姓名</th>
                <th className="text-left py-2 px-2">性别</th>
                <th className="text-left py-2 px-2">学历</th>
                <th className="text-left py-2 px-2">政治面貌</th>
                <th className="text-left py-2 px-2">民族</th>
                <th className="text-left py-2 px-2">入职日期</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.slice(0, 50).map((e) => {
                const em = employments.find((em) => em.employeeId === e.id);
                return (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-gray-500">{e.employeeId}</td>
                    <td className="py-2 px-2 font-medium">{e.name}</td>
                    <td className="py-2 px-2 text-gray-500">{e.gender || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{e.education || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{e.politics || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{e.ethnicity || "—"}</td>
                    <td className="py-2 px-2 text-gray-500">{em?.joinDate || "—"}</td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-gray-400">暂无匹配数据</td></tr>
              )}
            </tbody>
          </table>
          {filteredEmployees.length > 50 && (
            <p className="text-xs text-gray-400 text-center py-2">还有 {filteredEmployees.length - 50} 条数据未显示，请使用搜索筛选</p>
          )}
        </div>
      </div>
    </div>
  );
}
