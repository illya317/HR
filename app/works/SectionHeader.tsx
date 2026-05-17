"use client";

export default function SectionHeader({
  title,
  count,
  expanded,
  onToggle,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800"
    >
      <span
        className={`text-xs transition-transform ${expanded ? "rotate-90" : ""}`}
      >
        ▶
      </span>
      {title}
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        {count}
      </span>
    </button>
  );
}
