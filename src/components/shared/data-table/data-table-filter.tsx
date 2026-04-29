"use client";

import dayjs from "dayjs";
import { Button, DatePicker, Input, Select } from "antd";
import { Search } from "lucide-react";

import type { DataTableFilterItem, DataTableFilterValues } from "./types";

const { RangePicker } = DatePicker;

type Props = {
  filters: DataTableFilterItem[];
  values: DataTableFilterValues;
  onChange: (key: string, value: string | [string, string]) => void;
  onSearch: () => void;
  onReset: () => void;
};

export default function DataTableFilter({
  filters,
  values,
  onChange,
  onSearch,
  onReset,
}: Props) {
  return (
    <div className="mb-4 rounded-sm bg-white p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filters.map((filter) => {
          const value = values[filter.key];

          return (
            <div key={filter.key}>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                {filter.label}
              </label>

              {filter.type === "input" ? (
                <Input
                  allowClear
                  value={typeof value === "string" ? value : ""}
                  placeholder={filter.placeholder}
                  onChange={(event) => onChange(filter.key, event.target.value)}
                />
              ) : null}

              {filter.type === "select" ? (
                <Select
                  allowClear
                  className="w-full"
                  value={typeof value === "string" && value ? value : undefined}
                  placeholder={filter.placeholder}
                  options={filter.options || []}
                  onChange={(nextValue) =>
                    onChange(filter.key, nextValue || "")
                  }
                />
              ) : null}

              {filter.type === "dateRange" ? (
                <RangePicker
                  className="w-full"
                  format="YYYY-MM-DD"
                  value={
                    Array.isArray(value) && value[0] && value[1]
                      ? [dayjs(value[0]), dayjs(value[1])]
                      : null
                  }
                  placeholder={["Start date", "End date"]}
                  onChange={(_, dateStrings) => {
                    onChange(filter.key, [
                      dateStrings[0] || "",
                      dateStrings[1] || "",
                    ]);
                  }}
                />
              ) : null}
            </div>
          );
        })}

        <div className="col-span-full flex justify-end gap-2">
          <Button type="primary" icon={<Search size={14} />} onClick={onSearch}>
            Cari
          </Button>

          <Button onClick={onReset}>Reset</Button>
        </div>
      </div>
    </div>
  );
}
