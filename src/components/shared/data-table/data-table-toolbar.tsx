"use client";

import { Button, Dropdown, Pagination } from "antd";
import { RefreshCw } from "lucide-react";

import ColumnVisibilityPopover from "./column-visibility-popover";
import type {
  DataTableColumnVisibilityItem,
  DataTableToolbarAction,
} from "./types";

type Props = {
  parameterText?: string;
  selectedCount: number;
  bulkActions?: DataTableToolbarAction[];
  actions?: DataTableToolbarAction[];
  columns: DataTableColumnVisibilityItem[];
  onColumnVisibilityChange: (key: string, checked: boolean) => void;
  onRefresh: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    onChange: (page: number, limit: number) => void;
  };
};

export default function DataTableToolbar({
  parameterText,
  selectedCount,
  bulkActions = [],
  actions = [],
  columns,
  onColumnVisibilityChange,
  onRefresh,
  pagination,
}: Props) {
  return (
    <div className="mb-3 rounded-sm bg-white p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm italic text-slate-700">
          🔍 Parameter: {parameterText || "belum ada parameter pencarian"}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {bulkActions.length > 0 ? (
            <Dropdown
              disabled={selectedCount === 0}
              menu={{
                items: bulkActions.map((action) => ({
                  key: action.key,
                  label: action.label,
                  disabled: action.disabled,
                  danger: action.danger,
                  onClick: action.onClick,
                })),
              }}
            >
              <Button disabled={selectedCount === 0}>
                Bulk action {selectedCount > 0 ? `(${selectedCount})` : ""}
              </Button>
            </Dropdown>
          ) : null}

          {actions.map((action) => (
            <Button
              key={action.key}
              type={action.type || "default"}
              danger={action.danger}
              disabled={action.disabled}
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-blue-500 transition hover:border-blue-400 hover:text-blue-600"
          >
            <RefreshCw size={16} />
          </button>

          <ColumnVisibilityPopover
            columns={columns}
            onChange={onColumnVisibilityChange}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Pagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          showSizeChanger
          onChange={pagination.onChange}
        />
      </div>
    </div>
  );
}
