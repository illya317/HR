"use client";

interface ContractFiltersProps {
  q: string;
  onQChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  locations: string[];
  categories: string[];
  statuses: string[];
  onCreate: () => void;
}

export default function ContractFilters({
  q, onQChange,
  locationFilter, onLocationChange,
  categoryFilter, onCategoryChange,
  statusFilter, onStatusChange,
  locations, categories, statuses,
  onCreate,
}: ContractFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="搜索合同名称、签署方、内容..."
        value={q}
        onChange={(e) => onQChange(e.target.value)}
        className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      />
      <div className="relative">
        <input
          list="location-list"
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="全部位置"
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <datalist id="location-list">
          {locations.map((l) => <option key={l} value={l} />)}
        </datalist>
      </div>
      <div className="relative">
        <input
          list="category-list"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="全部类型"
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <datalist id="category-list">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div className="relative">
        <input
          list="status-list"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          placeholder="全部状态"
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <datalist id="status-list">
          {statuses.map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>
      <div className="flex-1" />
      <button
        onClick={onCreate}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        + 新增合同
      </button>
    </div>
  );
}
