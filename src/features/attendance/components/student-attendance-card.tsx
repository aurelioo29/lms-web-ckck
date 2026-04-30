"use client";

import { useEffect, useState } from "react";
import { Button, Card, Tag, message } from "antd";
import dayjs from "dayjs";

export default function StudentAttendanceCard({
  courseId,
}: {
  courseId: string;
}) {
  const [sessions, setSessions] = useState<any[]>([]);

  async function fetchData() {
    const res = await fetch(
      `/api/courses/${courseId}/attendance-sessions`,
      { cache: "no-store" },
    );

    const json = await res.json();
    setSessions(json.data || []);
  }

  async function checkIn(id: string) {
    const res = await fetch("/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({ sessionId: id }),
    });

    const json = await res.json();

    if (!res.ok) {
      message.error(json.message);
      return;
    }

    message.success(json.message);
    fetchData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  const now = dayjs();

  const activeSessions = sessions.filter(
    (s) =>
      now.isAfter(dayjs(s.startAt)) && now.isBefore(dayjs(s.endAt)),
  );

  if (activeSessions.length === 0) {
    return null;
  }

  return (
    <Card title="Attendance">
      {activeSessions.map((item) => (
        <div key={item.id} className="flex justify-between py-2">
          <div>
            <p className="m-0 font-semibold">{item.title}</p>
            <Tag color="green">OPEN</Tag>
          </div>

          <Button onClick={() => checkIn(item.id)}>
            Check In
          </Button>
        </div>
      ))}
    </Card>
  );
}