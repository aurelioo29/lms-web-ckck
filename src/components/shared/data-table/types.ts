import type { ReactNode } from "react";

export type DataTableFilterType = "input" | "select" | "dateRange";

export type DataTableFilterItem = {
  key: string;
  label: string;
  type: DataTableFilterType;
  placeholder?: string;
  value?: string;
  options?: {
    label: string;
    value: string;
  }[];
};

export type DataTableFilterValues = Record<string, string | [string, string]>;

export type DataTableToolbarAction = {
  key: string;
  label?: string;
  icon?: ReactNode;
  type?: "primary" | "default" | "dashed" | "link" | "text";
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export type DataTableColumnVisibilityItem = {
  key: string;
  label: string;
  visible: boolean;
};
