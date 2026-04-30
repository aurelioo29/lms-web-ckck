"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";

import DataTable from "@/components/shared/data-table/data-table";
import type { DataTableFilterValues } from "@/components/shared/data-table/types";

import CourseFormModal from "./course-form-modal";
import type {
  CourseItem,
  CoursesResponse,
  InstructorOption,
} from "../types/course.type";

const emptyFilters: DataTableFilterValues = {
  search: "",
  status: "",
  level: "",
  instructorId: "",
};

function buildQuery(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

function getStatusColor(status: string) {
  if (status === "PUBLISHED") return "green";
  if (status === "DRAFT") return "orange";
  if (status === "ARCHIVED") return "default";

  return "blue";
}

export default function CoursesTable() {
  const [modal, contextHolder] = Modal.useModal();

  const [data, setData] = useState<CourseItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [filters, setFilters] = useState<DataTableFilterValues>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DataTableFilterValues>(emptyFilters);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  const query = useMemo(
    () =>
      buildQuery({
        page,
        limit,
        search: String(appliedFilters.search || ""),
        status: String(appliedFilters.status || ""),
        level: String(appliedFilters.level || ""),
        instructorId: String(appliedFilters.instructorId || ""),
        sortBy,
        sortOrder,
      }),
    [page, limit, appliedFilters, sortBy, sortOrder],
  );

  async function fetchCourses() {
    try {
      setLoading(true);

      const res = await fetch(`/api/courses?${query}`, {
        cache: "no-store",
      });

      const json: CoursesResponse | { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil courses.",
        );
      }

      const response = json as CoursesResponse;

      setData(response.data || []);
      setTotal(response.meta.total || 0);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchInstructors() {
    try {
      const res = await fetch("/api/instructors/options", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengambil instructors.");
      }

      setInstructors(json.data || []);
    } catch {
      setInstructors([]);
    }
  }

  async function deleteCourse(course: CourseItem) {
    modal.confirm({
      title: "Delete course?",
      content: `Course "${course.title}" akan dihapus.`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        const res = await fetch(`/api/courses/${course.id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Gagal menghapus course.");
        }

        message.success(json.message || "Course berhasil dihapus.");
        fetchCourses();
      },
    });
  }

  function handleFilterChange(key: string, value: string | [string, string]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSearch() {
    setAppliedFilters({ ...filters });
    setPage(1);
  }

  function handleReset() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  const parameterText = useMemo(() => {
    const params: string[] = [];

    if (appliedFilters.search) params.push(`search=${appliedFilters.search}`);
    if (appliedFilters.status) params.push(`status=${appliedFilters.status}`);
    if (appliedFilters.level) params.push(`level=${appliedFilters.level}`);

    if (appliedFilters.instructorId) {
      const instructor = instructors.find(
        (item) => item.id === appliedFilters.instructorId,
      );
      params.push(
        `instructor=${instructor?.name || appliedFilters.instructorId}`,
      );
    }

    return params.length > 0 ? params.join(", ") : "";
  }, [appliedFilters, instructors]);

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const columns: ColumnsType<CourseItem> = [
    {
      title: "Course",
      key: "title",
      sorter: true,
      render: (_, record) => (
        <div>
          <p className="m-0 font-semibold text-slate-900">{record.title}</p>
          <p className="m-0 text-xs text-slate-500">{record.slug}</p>
        </div>
      ),
    },
    {
      title: "Instructor",
      key: "instructor",
      render: (_, record) => (
        <div>
          <p className="m-0 text-sm">{record.instructor.name}</p>
          <p className="m-0 text-xs text-slate-500">
            @{record.instructor.username}
          </p>
        </div>
      ),
    },
    {
      title: "Level",
      key: "level",
      dataIndex: "level",
      sorter: true,
      render: (value) => value || "-",
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      sorter: true,
      render: (value) => <Tag color={getStatusColor(value)}>{value}</Tag>,
    },
    {
      title: "Created At",
      key: "createdAt",
      dataIndex: "createdAt",
      sorter: true,
      render: (value) => new Date(value).toLocaleString("id-ID"),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center gap-1">
          <Link href={`/dashboard/courses/${record.id}`}>
            <Button type="link" icon={<Eye size={14} />} />
          </Link>

          <Button
            type="link"
            icon={<Edit size={14} />}
            onClick={() => {
              setSelectedCourse(record);
              setFormOpen(true);
            }}
          />

          <Button
            type="link"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => deleteCourse(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <DataTable<CourseItem>
        loading={loading}
        columns={columns}
        dataSource={data}
        filters={[
          {
            key: "search",
            label: "Search",
            type: "input",
            placeholder: "Search title, slug, description",
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            placeholder: "Select status",
            options: [
              { label: "Draft", value: "DRAFT" },
              { label: "Published", value: "PUBLISHED" },
              { label: "Archived", value: "ARCHIVED" },
            ],
          },
          {
            key: "level",
            label: "Level",
            type: "select",
            placeholder: "Select level",
            options: [
              { label: "Beginner", value: "Beginner" },
              { label: "Intermediate", value: "Intermediate" },
              { label: "Advanced", value: "Advanced" },
            ],
          },
          {
            key: "instructorId",
            label: "Instructor",
            type: "select",
            placeholder: "Select instructor",
            options: instructors.map((instructor) => ({
              label: `${instructor.name} (@${instructor.username})`,
              value: instructor.id,
            })),
          },
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
        parameterText={parameterText}
        actions={[
          {
            key: "create",
            label: "Tambah Course",
            type: "primary",
            icon: <Plus size={14} />,
            onClick: () => {
              setSelectedCourse(null);
              setFormOpen(true);
            },
          },
        ]}
        onRefresh={fetchCourses}
        pagination={{
          page,
          limit,
          total,
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage);
            setLimit(nextLimit);
          },
        }}
        onSortChange={(sort) => {
          if (!sort.field || !sort.order) {
            setSortBy("createdAt");
            setSortOrder("desc");
            return;
          }

          setSortBy(sort.field);
          setSortOrder(sort.order === "ascend" ? "asc" : "desc");
          setPage(1);
        }}
      />

      <CourseFormModal
        open={formOpen}
        course={selectedCourse}
        onClose={() => {
          setFormOpen(false);
          setSelectedCourse(null);
        }}
        onSuccess={fetchCourses}
      />
    </>
  );
}
