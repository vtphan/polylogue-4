import { prisma } from "@/lib/db";
import { getAvailableScenarios } from "@/actions/teacher";
import NewSessionForm from "./form";

export default async function NewSessionPage() {
  const teacher = await prisma.user.findFirst({
    where: { role: { in: ["teacher", "researcher"] } },
  });
  if (!teacher) {
    return <div className="teacher-ui p-8 text-gray-500">No teacher account found.</div>;
  }

  const scenarios = await getAvailableScenarios();

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-[18px] font-bold text-gray-900 mb-6">Create New Session</h1>
        <NewSessionForm teacherId={teacher.id} scenarios={scenarios} />
      </div>
    </div>
  );
}
