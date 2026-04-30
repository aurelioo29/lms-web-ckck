"use client";

import { Form, Input, Modal, DatePicker, message } from "antd";
import dayjs from "dayjs";

type Props = {
  open: boolean;
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AttendanceSessionModal({
  open,
  courseId,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();

  async function onFinish(values: any) {
    try {
      const res = await fetch(`/api/courses/${courseId}/attendance-sessions`, {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          startAt: values.range[0].toISOString(),
          endAt: values.range[1].toISOString(),
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message);

      message.success("Session dibuat");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
  }

  return (
    <Modal
      title="Create Attendance Session"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="title" label="Title" required>
          <Input placeholder="Session 1 - Introduction" />
        </Form.Item>

        <Form.Item name="range" label="Time Range" required>
          <DatePicker.RangePicker
            showTime
            className="w-full"
            defaultValue={[dayjs(), dayjs().add(1, "hour")]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
