"use client";

interface ContractPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ContractPagination({ page, totalPages, onPageChange }: ContractPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
      >
        上一页
      </button>
      <span className="text-sm text-gray-600">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
      >
        下一页
      </button>
    </div>
  );
}
