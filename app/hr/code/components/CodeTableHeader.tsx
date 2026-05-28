"use client";

interface CodeTableHeaderProps {
  sortField: "code" | "name" | "count";
  sortDirection: "asc" | "desc";
  toggleSort: (field: "code" | "name" | "count") => void;
}

export default function CodeTableHeader({
  sortField,
  sortDirection,
  toggleSort,
}: CodeTableHeaderProps) {
  return (
    <thead className="border-b bg-gray-50">
      <tr>
        <th
          onClick={() => toggleSort("code")}
          className="w-24 cursor-pointer whitespace-nowrap px-2 py-1.5 text-left font-medium text-gray-600 hover:bg-gray-100 select-none"
        >
          <span className="flex items-center gap-1">
            编号
            {sortField === "code" && (
              <span className="text-emerald-500">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </span>
        </th>
        <th
          onClick={() => toggleSort("name")}
          className="cursor-pointer whitespace-nowrap px-2 py-1.5 text-left font-medium text-gray-600 hover:bg-gray-100 select-none"
        >
          <span className="flex items-center gap-1">
            名称
            {sortField === "name" && (
              <span className="text-emerald-500">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </span>
        </th>
        <th
          onClick={() => toggleSort("count")}
          className="w-16 cursor-pointer whitespace-nowrap px-2 py-1.5 text-right font-medium text-gray-600 hover:bg-gray-100 select-none"
        >
          <span className="flex items-center justify-end gap-1">
            人数
            {sortField === "count" && (
              <span className="text-emerald-500">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </span>
        </th>
      </tr>
    </thead>
  );
}
