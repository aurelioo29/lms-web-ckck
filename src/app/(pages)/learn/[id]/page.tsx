import { requirePermission } from "@/lib/require-permission";
import LearningPageClient from "@/features/learning/components/learning-page";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LearnPage({ params }: Props) {
  const { id } = await params;

  return <LearningPageClient courseId={id} />;
}
