"use client";

export default function StarRating({
  value,
  onChange,
  readOnly,
  label,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(s)}
            className={`text-sm ${
              s <= value ? "text-amber-400" : "text-gray-300"
            } ${readOnly ? "" : "cursor-pointer hover:text-amber-500"}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
