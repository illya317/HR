"use client";

import FilterBar from "@/app/components/FilterBar";
import { useByDepartmentTab } from "./useByDepartmentTab";

interface Props {
  user: { id: number; name: string; isWorkListAdmin: boolean; isAnyGroupAdmin: boolean };
  resources: Array<{ id: number; key: string; name: string; description: string | null }>;
  allDepts: Array<{ id: number; name: string; company: string; count: number }>;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export default function ByDepartmentTab({ user, resources, allDepts, showToast }: Props) {
  const {
    grants,
    loading,
    filterCompany,
    setFilterCompany,
    searchText,
    setSearchText,
    togglePerm,
    companies,
    filteredDepts,
    topResources,
    deptHasPerm,
  } = useByDepartmentTab(resources, allDepts, showToast);

  if (loading) {
    return <p className="text-sm text-gray-500">加载中...</p>;
  }

  return (
    <div className="space-y-4">
      <FilterBar>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        >
          <option value="">全部公司</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="搜索部门..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </FilterBar>

      {filteredDepts.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">暂无数据</p>
      )}

      {filteredDepts.map((dept) => (
        <div key={dept.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-800">{dept.name}</span>
              <span className="ml-2 text-xs text-gray-400">{dept.company}</span>
            </div>
            <span className="text-xs text-gray-400">{dept.count}人</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topResources.map((r) => {
              const has = deptHasPerm(grants, dept.id, r.key, "access");
              return (
                <button
                  key={r.key}
                  onClick={() => togglePerm(dept.id, r.key, !has)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    has
                      ? "border border-emerald-300 bg-emerald-100 text-emerald-700"
                      : "border border-gray-200 bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
