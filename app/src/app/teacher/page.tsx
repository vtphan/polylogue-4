import { prisma } from "@/lib/db";
import { getTeacherSessions, getAvailableScenarios } from "@/actions/teacher";
import Link from "next/link";

export default async function TeacherDashboardPage() {
  // For dev: use first teacher/researcher user
  const teacher = await prisma.user.findFirst({
    where: { role: { in: ["teacher", "researcher"] } },
  });
  if (!teacher) {
    return (
      <div className="teacher-ui min-h-screen bg-gray-50 p-8">
        <p className="text-gray-500">No teacher account found. Run the seed script.</p>
      </div>
    );
  }

  const sessions = await getTeacherSessions(teacher.id);
  const scenarios = await getAvailableScenarios();

  const activeSessions = sessions.filter((s) => s.status === "active");
  const pastSessions = sessions.filter((s) => s.status === "archived");

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[18px] font-bold text-gray-900">Perspectives — Teacher</h1>
          <Link
            href="/teacher/session/new"
            className="px-4 py-1.5 text-sm bg-indigo-500 text-white rounded-lg
              hover:bg-indigo-600 transition-colors font-medium"
          >
            Create New Session
          </Link>
        </div>

        {/* Active Sessions */}
        <section className="mb-8">
          <h2 className="text-[16px] font-semibold text-gray-800 mb-3">
            Active Sessions
          </h2>
          {activeSessions.length === 0 ? (
            <p className="text-sm text-gray-500">No active sessions.</p>
          ) : (
            <div className="space-y-2">
              {activeSessions.map((s) => (
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
                        Code: {s.sessionCode} · Phase {s.activePhase} · {s.studentCount} student{s.studentCount !== 1 ? "s" : ""}
                      </div>
                      {s.discussionArc && (
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {s.discussionArc}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-indigo-600 font-medium">Open →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <details className="mb-8">
            <summary className="text-[14px] font-medium text-gray-500 cursor-pointer hover:text-gray-700">
              Past Sessions ({pastSessions.length})
            </summary>
            <div className="mt-2 space-y-2">
              {pastSessions.map((s) => (
                <Link
                  key={s.sessionId}
                  href={`/teacher/session/${s.sessionId}`}
                  className="block bg-white border border-gray-200 rounded-lg px-4 py-3
                    opacity-60 hover:opacity-80 transition-opacity"
                >
                  <div className="text-sm text-gray-700">{s.topic}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Code: {s.sessionCode} · Phase {s.activePhase} · {s.studentCount} students
                  </div>
                </Link>
              ))}
            </div>
          </details>
        )}

        {/* Available Scenarios */}
        <section>
          <h2 className="text-[16px] font-semibold text-gray-800 mb-3">
            Available Scenarios
          </h2>
          {scenarios.length === 0 ? (
            <p className="text-sm text-gray-500">No scenarios imported. Run the seed script.</p>
          ) : (
            <div className="space-y-2">
              {scenarios.map((s) => (
                <div
                  key={s.scenarioId}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {s.topic}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {s.flawCount} flaws · {s.personaCount} personas
                        {s.overallScore != null && ` · Score: ${s.overallScore}/5`}
                      </div>
                      {s.discussionArc && (
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {s.discussionArc}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
