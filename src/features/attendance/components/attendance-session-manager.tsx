"use client";

import { useEffect, useState } from "react";
import { Button, Card, Image, Tag, message } from "antd";
import dayjs from "dayjs";
import { Plus, Trash2 } from "lucide-react";

import AttendanceSessionModal from "./attendance-session-modal";

export default function AttendanceSessionManager({
  courseId,
}: {
  courseId: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  async function fetchData() {
    const res = await fetch(`/api/courses/${courseId}/attendance-sessions`, {
      cache: "no-store",
    });

    const json = await res.json();
    setData(json.data || []);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/attendance-sessions/${id}`, {
      method: "DELETE",
    });

    message.success("Deleted");
    fetchData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card
      title="Attendance Sessions"
      extra={
        <Button
          icon={<Plus size={14} />}
          type="primary"
          onClick={() => setOpen(true)}
        >
          Create
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((item) => {
          const now = dayjs();

          const isActive =
            now.isAfter(dayjs(item.startAt)) && now.isBefore(dayjs(item.endAt));

          return (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-xs text-slate-500">
                    {dayjs(item.startAt).format("HH:mm")} -{" "}
                    {dayjs(item.endAt).format("HH:mm")}
                  </p>
                </div>

                <Tag color={isActive ? "green" : "default"}>
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </Tag>
              </div>

              <div className="mt-3 flex justify-center">
                {item.qrCode ? <Image src={item.qrCode} width={140} /> : null}
              </div>

              <div className="mt-3 flex justify-between text-xs">
                <span>{item.records.length} hadir</span>

                <Button
                  danger
                  size="small"
                  icon={<Trash2 size={12} />}
                  onClick={() => handleDelete(item.id)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AttendanceSessionModal
        open={open}
        courseId={courseId}
        onClose={() => setOpen(false)}
        onSuccess={fetchData}
      />
    </Card>
  );
}
