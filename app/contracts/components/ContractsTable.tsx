"use client";

import type { Contract } from "../types";

interface ContractsTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (id: number) => void;
}

export default function ContractsTable({ contracts, onEdit, onDelete }: ContractsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3">编号</th>
            <th className="px-4 py-3">名称</th>
            <th className="px-4 py-3">签署方</th>
            <th className="px-4 py-3">签署对方</th>
            <th className="px-4 py-3">类型</th>
            <th className="px-4 py-3">签订日期</th>
            <th className="px-4 py-3">状态</th>
            <th className="px-4 py-3 text-right">金额</th>
            <th className="px-4 py-3">位置</th>
            <th className="px-4 py-3 text-center">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contracts.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">{c.contractNo || "-"}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
              <td className="px-4 py-3 text-gray-600">{c.partyA || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{c.partyB || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{c.category || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{c.signDate || "-"}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  c.status === "执行中" ? "bg-green-100 text-green-700" :
                  c.status === "已结束" ? "bg-gray-100 text-gray-600" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {c.status || "-"}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {c.amount != null ? c.amount.toLocaleString() : "-"}
              </td>
              <td className="px-4 py-3 text-gray-600">{c.location || "-"}</td>
              <td className="px-4 py-3 text-center">
                <button onClick={() => onEdit(c)} className="mr-2 text-xs text-emerald-600 hover:underline">编辑</button>
                <button onClick={() => onDelete(c.id)} className="text-xs text-red-500 hover:underline">删除</button>
              </td>
            </tr>
          ))}
          {contracts.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-gray-400">暂无数据</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
