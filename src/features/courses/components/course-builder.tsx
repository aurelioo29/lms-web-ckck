"use client";

import { useEffect, useState } from "react";
import { Button, Card, Empty, Modal, Space, Tag, message } from "antd";
import { BookOpen, Edit, FileText, Plus, Trash2, Video } from "lucide-react";

import SectionFormModal from "./section-form-modal";
import LessonFormModal from "./lesson-form-modal";
import type {
  CourseSectionItem,
  LessonItem,
  LessonType,
} from "../types/course-builder.type";

type CourseBuilderProps = {
  courseId: string;
};

type SectionFormValues = {
  title: string;
  order: number;
};

type LessonFormValues = {
  title: string;
  type: LessonType;
  contentHtml?: string;
  videoUrl?: string;
  fileUrl?: string;
  order: number;
  isPreview: boolean;
};

function getLessonIcon(type: LessonType) {
  if (type === "VIDEO") return <Video size={15} />;
  if (type === "FILE") return <FileText size={15} />;
  return <BookOpen size={15} />;
}

function getLessonColor(type: LessonType) {
  if (type === "TEXT") return "blue";
  if (type === "VIDEO") return "purple";
  if (type === "FILE") return "orange";
  if (type === "QUIZ") return "green";
  if (type === "ASSIGNMENT") return "volcano";

  return "default";
}

export default function CourseBuilder({ courseId }: CourseBuilderProps) {
  const [modal, contextHolder] = Modal.useModal();

  const [sections, setSections] = useState<CourseSectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] =
    useState<CourseSectionItem | null>(null);

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  async function fetchSections() {
    try {
      setLoading(true);

      const res = await fetch(`/api/courses/${courseId}/sections`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengambil sections.");
      }

      setSections(json.data || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function submitSection(values: SectionFormValues) {
    try {
      setSaving(true);

      const url = selectedSection
        ? `/api/sections/${selectedSection.id}`
        : `/api/courses/${courseId}/sections`;

      const method = selectedSection ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal menyimpan section.");
      }

      message.success(json.message || "Section berhasil disimpan.");
      setSectionModalOpen(false);
      setSelectedSection(null);
      fetchSections();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection(section: CourseSectionItem) {
    modal.confirm({
      title: "Delete section?",
      content: `Section "${section.title}" dan semua lesson di dalamnya akan dihapus.`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      async onOk() {
        const res = await fetch(`/api/sections/${section.id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Gagal menghapus section.");
        }

        message.success(json.message || "Section berhasil dihapus.");
        fetchSections();
      },
    });
  }

  async function submitLesson(values: LessonFormValues) {
    if (!activeSectionId && !selectedLesson) return;

    try {
      setSaving(true);

      const url = selectedLesson
        ? `/api/lessons/${selectedLesson.id}`
        : `/api/sections/${activeSectionId}/lessons`;

      const method = selectedLesson ? "PATCH" : "POST";

      const payload = {
        title: values.title,
        type: values.type,
        contentHtml: values.contentHtml || null,
        contentJson: null,
        videoUrl: values.videoUrl || null,
        fileUrl: values.fileUrl || null,
        order: values.order || 0,
        isPreview: values.isPreview || false,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal menyimpan lesson.");
      }

      message.success(json.message || "Lesson berhasil disimpan.");
      setLessonModalOpen(false);
      setSelectedLesson(null);
      setActiveSectionId(null);
      fetchSections();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLesson(lesson: LessonItem) {
    modal.confirm({
      title: "Delete lesson?",
      content: `Lesson "${lesson.title}" akan dihapus.`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      async onOk() {
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Gagal menghapus lesson.");
        }

        message.success(json.message || "Lesson berhasil dihapus.");
        fetchSections();
      },
    });
  }

  useEffect(() => {
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return (
    <>
      {contextHolder}

      <Card
        loading={loading}
        title="Course Builder"
        extra={
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              setSelectedSection(null);
              setSectionModalOpen(true);
            }}
          >
            Add Section
          </Button>
        }
      >
        {sections.length === 0 ? (
          <Empty description="Belum ada section. Course tanpa section itu kayak buku tanpa bab. Sedih." />
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h4 className="m-0 text-base font-semibold text-slate-900">
                      {section.order}. {section.title}
                    </h4>
                    <p className="m-0 text-xs text-slate-500">
                      {section.lessons.length} lesson
                    </p>
                  </div>

                  <Space>
                    <Button
                      icon={<Plus size={14} />}
                      onClick={() => {
                        setActiveSectionId(section.id);
                        setSelectedLesson(null);
                        setLessonModalOpen(true);
                      }}
                    >
                      Add Lesson
                    </Button>

                    <Button
                      icon={<Edit size={14} />}
                      onClick={() => {
                        setSelectedSection(section);
                        setSectionModalOpen(true);
                      }}
                    />

                    <Button
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={() => deleteSection(section)}
                    />
                  </Space>
                </div>

                <div className="divide-y divide-slate-100">
                  {section.lessons.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-slate-500">
                      Belum ada lesson di section ini.
                    </div>
                  ) : (
                    section.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-600">
                            {getLessonIcon(lesson.type)}
                          </div>

                          <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-medium text-slate-900">
                              {lesson.order}. {lesson.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Tag color={getLessonColor(lesson.type)}>
                                {lesson.type}
                              </Tag>

                              {lesson.isPreview ? (
                                <Tag color="cyan">PREVIEW</Tag>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <Space>
                          <Button
                            type="link"
                            icon={<Edit size={14} />}
                            onClick={() => {
                              setSelectedLesson(lesson);
                              setActiveSectionId(section.id);
                              setLessonModalOpen(true);
                            }}
                          />

                          <Button
                            type="link"
                            danger
                            icon={<Trash2 size={14} />}
                            onClick={() => deleteLesson(lesson)}
                          />
                        </Space>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SectionFormModal
        open={sectionModalOpen}
        section={selectedSection}
        loading={saving}
        onClose={() => {
          setSectionModalOpen(false);
          setSelectedSection(null);
        }}
        onSubmit={submitSection}
      />

      <LessonFormModal
        open={lessonModalOpen}
        lesson={selectedLesson}
        loading={saving}
        onClose={() => {
          setLessonModalOpen(false);
          setSelectedLesson(null);
          setActiveSectionId(null);
        }}
        onSubmit={submitLesson}
      />
    </>
  );
}
