"use client";

import { Checkbox, Popover, Tooltip } from "antd";
import { Settings } from "lucide-react";

import type { DataTableColumnVisibilityItem } from "./types";

type Props = {
  columns: DataTableColumnVisibilityItem[];
  onChange: (key: string, checked: boolean) => void;
};

export default function ColumnVisibilityPopover({ columns, onChange }: Props) {
  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={
        <div className="w-[220px]">
          <Checkbox
            checked={columns.every((column) => column.visible)}
            indeterminate={
              columns.some((column) => column.visible) &&
              !columns.every((column) => column.visible)
            }
            onChange={(event) => {
              columns.forEach((column) => {
                onChange(column.key, event.target.checked);
              });
            }}
          >
            <span className="font-semibold">Column Display</span>
          </Checkbox>

          <div className="mt-2 space-y-2 pl-6">
            {columns.map((column) => (
              <Checkbox
                key={column.key}
                checked={column.visible}
                onChange={(event) => onChange(column.key, event.target.checked)}
              >
                {column.label}
              </Checkbox>
            ))}
          </div>
        </div>
      }
    >
      <Tooltip title="Setting">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-blue-500 transition hover:border-blue-400 hover:text-blue-600"
        >
          <Settings size={16} />
        </button>
      </Tooltip>
    </Popover>
  );
}
