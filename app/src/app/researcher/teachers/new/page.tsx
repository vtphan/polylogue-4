import { requireResearcher } from "@/lib/session";
import CreateTeacherForm from "./form";

export default async function NewTeacherPage() {
  await requireResearcher();

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-6 py-8">
        <h1 className="text-[18px] font-bold text-gray-900 mb-6">
          Add Teacher
        </h1>
        <CreateTeacherForm />
      </div>
    </div>
  );
}
