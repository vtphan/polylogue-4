import { requireTeacher } from "@/lib/session";
import CreateClassForm from "./form";

export default async function NewClassPage() {
  await requireTeacher();

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-[18px] font-bold text-gray-900 mb-6">
          Create New Class
        </h1>
        <CreateClassForm />
      </div>
    </div>
  );
}
