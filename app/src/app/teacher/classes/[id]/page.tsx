import { requireTeacher } from "@/lib/session";
import { getClassDetail } from "@/actions/class";
import { notFound } from "next/navigation";
import Link from "next/link";
import RemoveStudentButton from "./remove-student-button";

export default async function ClassDetailPage({
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
      <div className="max-w-3xl mx-auto px-6 py-6">
        <Link
          href="/teacher"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          &larr; Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
          <h1 className="text-[18px] font-bold text-gray-900">{cls.name}</h1>
          <Link
            href={`/teacher/classes/${id}/session/new`}
            className="px-4 py-1.5 text-sm bg-indigo-500 text-white rounded-lg
              hover:bg-indigo-600 transition-colors font-medium"
          >
            Create Session
          </Link>
        </div>

        {/* Student Roster */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-gray-800">
              Students ({cls.students.length})
            </h2>
            <Link
              href={`/teacher/classes/${id}/students/add`}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add Students
            </Link>
          </div>

          {cls.students.length === 0 ? (
            <p className="text-sm text-gray-500">
              No students yet.{" "}
              <Link
                href={`/teacher/classes/${id}/students/add`}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Add some
              </Link>
            </p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {cls.students.map((s) => (
                  <div
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full"
                  >
                    <span className="text-sm text-gray-700">{s.displayName}</span>
                    <RemoveStudentButton classId={id} userId={s.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sessions */}
        <section>
          <h2 className="text-[16px] font-semibold text-gray-800 mb-3">
            Sessions
          </h2>
          {cls.sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {cls.sessions.map((s) => (
                <Link
                  key={s.sessionId}
                  href={`/teacher/session/${s.sessionId}`}
                  className={`block bg-white border border-gray-200 rounded-lg px-4 py-3
                    hover:border-indigo-300 transition-colors
                    ${s.status === "archived" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {s.topic}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Code: {s.sessionCode} · Phase {s.activePhase} ·{" "}
                        {s.studentCount} student{s.studentCount !== 1 ? "s" : ""}
                        {s.status === "archived" && " · Archived"}
                      </div>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium">
                      Open &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
