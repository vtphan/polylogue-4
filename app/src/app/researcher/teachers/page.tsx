import { requireResearcher } from "@/lib/session";
import { getTeachers } from "@/actions/researcher";
import Link from "next/link";
import ResetPasswordButton from "./reset-password-button";

export default async function TeachersPage() {
  await requireResearcher();
  const teachers = await getTeachers();

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[18px] font-bold text-gray-900">
            Perspectives — Researcher
          </h1>
          <Link
            href="/researcher/teachers/new"
            className="px-4 py-1.5 text-sm bg-indigo-500 text-white rounded-lg
              hover:bg-indigo-600 transition-colors font-medium"
          >
            Add Teacher
          </Link>
        </div>

        <section>
          <h2 className="text-[16px] font-semibold text-gray-800 mb-3">
            Teachers
          </h2>
          {teachers.length === 0 ? (
            <p className="text-sm text-gray-500">No teachers yet.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Username</th>
                    <th className="px-4 py-2.5 text-center">Classes</th>
                    <th className="px-4 py-2.5 text-center">Active</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {t.displayName}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{t.username}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">
                        {t.classCount}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {t.activeSessionCount > 0 ? (
                          <span className="text-green-600 font-medium">
                            {t.activeSessionCount}
                          </span>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ResetPasswordButton
                          teacherId={t.id}
                          teacherName={t.displayName}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
