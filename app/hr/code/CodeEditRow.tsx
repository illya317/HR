"use client";

import DetailModal from "@/app/components/DetailModal";

import type { Employee, CodeItem } from "@/app/hr/code/useCodeTab";

// ── EditRow ──────────────────────────────────────────────────────────

interface EditRowProps {
  item: CodeItem;
  editCodeValue: string;
  setEditCodeValue: (v: string) => void;
  editNameValue: string;
  setEditNameValue: (v: string) => void;
  count: number;
  selectedCode?: string;
  setDetailModal: (v: {
    open: boolean;
    code: string;
    name: string;
  } | null) => void;
}

export function EditRow({
  item,
  editCodeValue,
  setEditCodeValue,
  editNameValue,
  setEditNameValue,
  count,
  selectedCode,
  setDetailModal,
}: EditRowProps) {
  const isSelected = selectedCode === item.code;

  return (
    <tr
      key={item.code}
      className={`border-b last:border-0 hover:bg-gray-50 ${isSelected ? "bg-emerald-50" : ""}`}
    >
      <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">
        <input
          value={editCodeValue}
          onChange={(e) => setEditCodeValue(e.target.value)}
          className="w-full rounded border border-emerald-400 px-1 py-0.5 text-xs focus:outline-none"
        />
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">
        <input
          value={editNameValue}
          onChange={(e) => setEditNameValue(e.target.value)}
          className="w-full rounded border border-emerald-400 px-1 py-0.5 text-xs focus:outline-none"
        />
      </td>
      <td className="whitespace-nowrap px-2 py-1.5 text-right text-gray-700">
        <span
          className="cursor-pointer rounded-full bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200"
          onClick={() =>
            setDetailModal({
              open: true,
              code: item.code,
              name: item.name,
            })
          }
        >
          {count}
        </span>
      </td>
    </tr>
  );
}

// ── PersonListModal ──────────────────────────────────────────────────

interface PersonListModalProps {
  detailModal: {
    open: boolean;
    code: string;
    name: string;
  } | null;
  setDetailModal: (v: {
    open: boolean;
    code: string;
    name: string;
  } | null) => void;
  getDetailList: (item: CodeItem) => Employee[];
}

export function PersonListModal({
  detailModal,
  setDetailModal,
  getDetailList,
}: PersonListModalProps) {
  return (
    <DetailModal
      open={!!detailModal?.open}
      title={`${detailModal?.name || ""} — 人员名单`}
      onClose={() => setDetailModal(null)}
    >
      {(() => {
        if (!detailModal) return null;
        const list = getDetailList({
          code: detailModal.code,
          name: detailModal.name,
        });
        if (list.length === 0)
          return <p className="text-sm text-gray-500">暂无人员</p>;
        return (
          <table className="w-full text-xs">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  姓名
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  部门
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  岗位
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-gray-700">{emp.name}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {emp.dept1 || "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {emp.position || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })()}
    </DetailModal>
  );
}

// ── PositionDeptModal ────────────────────────────────────────────────

interface PositionDeptModalProps {
  positionDeptModal: {
    open: boolean;
    code: string;
    name: string;
    departments: string[];
  } | null;
  setPositionDeptModal: (v: {
    open: boolean;
    code: string;
    name: string;
    departments: string[];
  } | null) => void;
}

export function PositionDeptModal({
  positionDeptModal,
  setPositionDeptModal,
}: PositionDeptModalProps) {
  return (
    <DetailModal
      open={!!positionDeptModal?.open}
      title={`${positionDeptModal?.name || ""} — 所属部门`}
      onClose={() => setPositionDeptModal(null)}
      maxWidth="max-w-md"
    >
      {positionDeptModal &&
      positionDeptModal.departments.length === 0 ? (
        <p className="text-sm text-gray-500">暂无关联部门</p>
      ) : (
        <ul className="space-y-2">
          {positionDeptModal?.departments.map((dept) => (
            <li
              key={dept}
              className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              {dept}
            </li>
          ))}
        </ul>
      )}
    </DetailModal>
  );
}
