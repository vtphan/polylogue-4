import { requireTeacher } from "@/lib/session";
import { getClassDetail } from "@/actions/class";
import { getAvailableScenarios } from "@/actions/teacher";
import { notFound } from "next/navigation";
import ClassSessionForm from "./form";

export default async function NewClassSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const teacher = await requireTeacher();
  const { id } = await params;

  let cls;
  try {
    cls = await getClassDetail(id);
  } catch {
    notFound();
  }

  const scenarios = await getAvailableScenarios();

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-[18px] font-bold text-gray-900 mb-1">
          Create Session
        </h1>
        <p className="text-sm text-gray-500 mb-6">{cls.name}</p>
        <ClassSessionForm
          teacherId={teacher.id}
          classId={id}
          students={cls.students}
          scenarios={scenarios}
        />
      </div>
    </div>
  );
}
