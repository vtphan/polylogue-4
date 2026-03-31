import { requireTeacher } from "@/lib/session";
import { getTeacherSessions } from "@/actions/teacher";
import { getClassesForTeacher } from "@/actions/class";
import Link from "next/link";

export default async function TeacherDashboardPage() {
  const teacher = await requireTeacher();

  const [classes, sessions] = await Promise.all([
    getClassesForTeacher(),
    getTeacherSessions(teacher.id),
  ]);

  // Sessions not linked to a class
  const unlinkedSessions = sessions.filter(
    (s) => s.status === "active" && !classes.some((c) =>
      c.id === (s as { classId?: string }).classId
    )
  );

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[18px] font-bold text-gray-900">
            Perspectives — {teacher.displayName}
          </h1>
          <Link
            href="/teacher/classes/new"
            className="px-4 py-1.5 text-sm bg-indigo-500 text-white rounded-lg
              hover:bg-indigo-600 transition-colors font-medium"
          >
            Create New Class
          </Link>
        </div>

        {/* Classes */}
        <section className="mb-8">
          <h2 className="text-[16px] font-semibold text-gray-800 mb-3">
            My Classes
          </h2>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-500">
              No classes yet.{" "}
              <Link
                href="/teacher/classes/new"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Create one
              </Link>
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/teacher/classes/${c.id}`}
                  className="block bg-white border border-gray-200 rounded-lg px-4 py-3
                    hover:border-indigo-300 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {c.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.studentCount} student{c.studentCount !== 1 ? "s" : ""} ·{" "}
                    {c.sessionCount} session{c.sessionCount !== 1 ? "s" : ""}
                    {c.activeSessionCount > 0 && (
                      <span className="text-green-600 ml-1">
                        ({c.activeSessionCount} active)
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Active Sessions (quick access) */}
        {sessions.filter((s) => s.status === "active").length > 0 && (
          <section className="mb-8">
            <h2 className="text-[16px] font-semibold text-gray-800 mb-3">
              Active Sessions
            </h2>
            <div className="space-y-2">
              {sessions
                .filter((s) => s.status === "active")
                .map((s) => (
                  <Link
                    key={s.sessionId}
                    href={`/teacher/session/${s.sessionId}`}
                    className="block bg-white border border-gray-200 rounded-lg px-4 py-3
                      hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {s.topic}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Code: {s.sessionCode} · Phase {s.activePhase} ·{" "}
                          {s.studentCount} student
                          {s.studentCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <span className="text-xs text-indigo-600 font-medium">
                        Open &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Past Sessions */}
        {sessions.filter((s) => s.status === "archived").length > 0 && (
          <details className="mb-8">
            <summary className="text-[14px] font-medium text-gray-500 cursor-pointer hover:text-gray-700">
              Past Sessions (
              {sessions.filter((s) => s.status === "archived").length})
            </summary>
            <div className="mt-2 space-y-2">
              {sessions
                .filter((s) => s.status === "archived")
                .map((s) => (
                  <Link
                    key={s.sessionId}
                    href={`/teacher/session/${s.sessionId}`}
                    className="block bg-white border border-gray-200 rounded-lg px-4 py-3
                      opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <div className="text-sm text-gray-700">{s.topic}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Code: {s.sessionCode} · Phase {s.activePhase} ·{" "}
                      {s.studentCount} students
                    </div>
                  </Link>
                ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
