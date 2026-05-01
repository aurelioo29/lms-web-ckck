"use client";

import { useMemo, useState } from "react";
import type { Key } from "react";
import { Table } from "antd";
import type { TableProps } from "antd";
import type { ColumnsType, TableRowSelection } from "antd/es/table/interface";

import DataTableFilter from "./data-table-filter";
import DataTableToolbar from "./data-table-toolbar";
import type {
  DataTableColumnVisibilityItem,
  DataTableFilterItem,
  DataTableFilterValues,
  DataTableToolbarAction,
} from "./types";

export type DataTableSort = {
  field: string;
  order: "ascend" | "descend" | null;
};

type DataTableProps<T extends { id: string }> = {
  rowKey?: string;
  loading?: boolean;
  columns: ColumnsType<T>;
  dataSource: T[];
  filters?: DataTableFilterItem[];
  filterValues?: DataTableFilterValues;
  onFilterChange?: (key: string, value: string | [string, string]) => void;
  onSearch?: () => void;
  onReset?: () => void;
  parameterText?: string;
  actions?: DataTableToolbarAction[];
  bulkActions?: DataTableToolbarAction[];
  onRefresh: () => void;
  onSortChange?: (sort: DataTableSort) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    onChange: (page: number, limit: number) => void;
  };
};

function getColumnDataIndex<T extends { id: string }>(
  column: ColumnsType<T>[number],
) {
  if ("dataIndex" in column) {
    return column.dataIndex;
  }

  return undefined;
}

function getColumnKey<T extends { id: string }>(
  column: ColumnsType<T>[number],
  index: number,
) {
  const dataIndex = getColumnDataIndex(column);

  return String(column.key || dataIndex || index);
}

function getColumnLabel<T extends { id: string }>(
  column: ColumnsType<T>[number],
  index: number,
) {
  if (typeof column.title === "string") {
    return column.title;
  }

  return getColumnKey(column, index);
}

export default function DataTable<T extends { id: string }>({
  rowKey = "id",
  loading,
  columns,
  dataSource,
  filters = [],
  filterValues = {},
  onFilterChange,
  onSearch,
  onReset,
  parameterText,
  actions = [],
  bulkActions = [],
  onRefresh,
  onSortChange,
  pagination,
}: DataTableProps<T>) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const initialVisibility = useMemo<DataTableColumnVisibilityItem[]>(
    () =>
      columns.map((column, index) => ({
        key: getColumnKey(column, index),
        label: getColumnLabel(column, index),
        visible: true,
      })),
    [columns],
  );

  const [columnVisibility, setColumnVisibility] =
    useState<DataTableColumnVisibilityItem[]>(initialVisibility);

  function handleColumnVisibilityChange(key: string, checked: boolean) {
    setColumnVisibility((current) =>
      current.map((column) =>
        column.key === key ? { ...column, visible: checked } : column,
      ),
    );
  }

  const visibleColumns = useMemo<ColumnsType<T>>(() => {
    return columns.filter((column, index) => {
      const key = getColumnKey(column, index);
      const visibility = columnVisibility.find((item) => item.key === key);

      return visibility?.visible !== false;
    });
  }, [columns, columnVisibility]);

  const rowSelection: TableRowSelection<T> = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const handleTableChange: TableProps<T>["onChange"] = (
    nextPagination,
    _filters,
    sorter,
  ) => {
    pagination.onChange(
      nextPagination.current || pagination.page,
      nextPagination.pageSize || pagination.limit,
    );

    if (!Array.isArray(sorter)) {
      const field = String(sorter.field || sorter.columnKey || "");

      onSortChange?.({
        field,
        order: sorter.order || null,
      });
    }
  };

  return (
    <div>
      {filters.length > 0 ? (
        <DataTableFilter
          filters={filters}
          values={filterValues}
          onChange={(key, value) => onFilterChange?.(key, value)}
          onSearch={() => onSearch?.()}
          onReset={() => onReset?.()}
        />
      ) : null}

      <DataTableToolbar
        parameterText={parameterText}
        selectedCount={selectedRowKeys.length}
        bulkActions={bulkActions}
        actions={actions}
        columns={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onRefresh={onRefresh}
        pagination={pagination}
      />

      <Table<T>
        rowKey={rowKey}
        bordered
        size="small"
        loading={loading}
        rowSelection={rowSelection}
        columns={visibleColumns}
        dataSource={dataSource}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}
