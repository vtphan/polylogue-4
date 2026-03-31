import { requireTeacher } from "@/lib/session";
import { getClassDetail } from "@/actions/class";
import { notFound } from "next/navigation";
import AddStudentsForm from "./form";

export default async function AddStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;

  let cls;
  try {
    cls = await getClassDetail(id);
  } catch {
    notFound();
  }

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-[18px] font-bold text-gray-900 mb-1">
          Add Students
        </h1>
        <p className="text-sm text-gray-500 mb-6">{cls.name}</p>
        <AddStudentsForm classId={id} />
      </div>
    </div>
  );
}
