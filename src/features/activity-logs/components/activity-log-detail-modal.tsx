"use client";

import { Descriptions, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { ActivityLogItem } from "../types/activity-log.type";

type ActivityLogDetailModalProps = {
  open: boolean;
  log: ActivityLogItem | null;
  onClose: () => void;
};

type JsonRow = {
  key: string;
  field: string;
  value: string;
};

function toRows(data: unknown): JsonRow[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [
      {
        key: "empty",
        field: "-",
        value: "-",
      },
    ];
  }

  return Object.entries(data as Record<string, unknown>).map(
    ([key, value]) => ({
      key,
      field: key,
      value:
        typeof value === "object" && value !== null
          ? JSON.stringify(value, null, 2)
          : String(value ?? "-"),
    }),
  );
}

function DataJsonSection({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="mt-5">
      <h4 className="mb-2 text-sm font-semibold text-slate-900">{title}</h4>

      <pre className="m-0 max-h-[260px] overflow-auto rounded border border-slate-200 bg-transparent p-3 text-xs text-slate-800">
        {JSON.stringify(data ?? {}, null, 2)}
      </pre>
    </div>
  );
}

export default function ActivityLogDetailModal({
  open,
  log,
  onClose,
}: ActivityLogDetailModalProps) {
  return (
    <Modal
      title="Activity Log Detail"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      {!log ? null : (
        <div>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Action">{log.action}</Descriptions.Item>
            <Descriptions.Item label="Module">{log.module}</Descriptions.Item>
            <Descriptions.Item label="Description">
              {log.description || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {log.user ? `${log.user.name} (@${log.user.username})` : "System"}
            </Descriptions.Item>
            <Descriptions.Item label="IP Address">
              {log.ipAddress || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(log.createdAt).toLocaleString("id-ID")}
            </Descriptions.Item>
          </Descriptions>

          <DataJsonSection title="Old Data" data={log.oldData} />
          <DataJsonSection title="New Data" data={log.newData} />
          <DataJsonSection title="Metadata" data={log.metadata} />
        </div>
      )}
    </Modal>
  );
}
