"use client";

import type { ResourceItem } from "../../types";

interface ResourceTreeProps {
  resources: ResourceItem[];
  selectedResource: string | null;
  onSelect: (key: string) => void;
  isChild?: boolean;
}

export default function ResourceTree({
  resources,
  selectedResource,
  onSelect,
  isChild = false,
}: ResourceTreeProps) {
  return (
    <div className={`space-y-1 ${isChild ? "pl-2" : ""}`}>
      {resources.map((r) => {
        const isSelected =
          selectedResource === r.key ||
          (!isChild && selectedResource?.startsWith(r.key + "."));
        return (
          <button
            key={r.key}
            onClick={() => onSelect(r.key)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
              isSelected
                ? "bg-emerald-50 text-emerald-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {r.name}
          </button>
        );
      })}
    </div>
  );
}
