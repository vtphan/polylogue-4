"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/actions/teacher";
import Link from "next/link";

interface Scenario {
  scenarioId: string;
  topic: string;
  discussionArc: string;
  flawCount: number;
  personaCount: number;
  overallScore: number | null;
}

interface Group {
  name: string;
  students: string[];
}

interface NewSessionFormProps {
  teacherId: string;
  scenarios: Scenario[];
}

export default function NewSessionForm({
  teacherId,
  scenarios,
}: NewSessionFormProps) {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [lifelineBudget, setLifelineBudget] = useState(6);
  const [guidedFirstDetection, setGuidedFirstDetection] = useState(true);
  const [groups, setGroups] = useState<Group[]>([
    { name: "Group 1", students: ["", "", "", ""] },
  ]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = scenarios.find((s) => s.scenarioId === selectedScenario);
  const locationCap = scenario?.flawCount ?? 5;
  const characterCap = scenario?.personaCount ?? 2;
  const perspectiveCap = scenario?.personaCount ?? 2;
  const narrowedCap = scenario?.flawCount ?? 5;

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      { name: `Group ${prev.length + 1}`, students: ["", "", "", ""] },
    ]);
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStudent(groupIndex: number, studentIndex: number, name: string) {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? { ...g, students: g.students.map((s, si) => (si === studentIndex ? name : s)) }
          : g
      )
    );
  }

  function addStudent(groupIndex: number) {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex ? { ...g, students: [...g.students, ""] } : g
      )
    );
  }

  function removeStudent(groupIndex: number, studentIndex: number) {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi === groupIndex
          ? { ...g, students: g.students.filter((_, si) => si !== studentIndex) }
          : g
      )
    );
  }

  function autoAssign() {
    // Collect all non-empty student names across groups
    const allStudents = groups
      .flatMap((g) => g.students)
      .filter((s) => s.trim())
      .sort(() => Math.random() - 0.5);

    if (allStudents.length === 0) return;

    const groupCount = Math.max(1, Math.ceil(allStudents.length / 5));
    const newGroups: Group[] = Array.from({ length: groupCount }, (_, i) => ({
      name: `Group ${i + 1}`,
      students: [],
    }));

    allStudents.forEach((student, i) => {
      newGroups[i % groupCount].students.push(student);
    });

    setGroups(newGroups);
  }

  // Duplicate name check
  const allNames = groups.flatMap((g) => g.students.filter((s) => s.trim()));
  const nameCounts = new Map<string, number>();
  for (const n of allNames) {
    const key = n.trim().toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  const duplicates = [...nameCounts.entries()].filter(([_, c]) => c > 1).map(([n]) => n);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedScenario) return;
    if (duplicates.length > 0) return;

    // Filter to groups with at least one student
    const validGroups = groups
      .map((g) => ({
        name: g.name,
        students: g.students.filter((s) => s.trim()),
      }))
      .filter((g) => g.students.length > 0);

    if (validGroups.length === 0) {
      setError("Add at least one student to a group.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const session = await createSession(
        teacherId,
        selectedScenario,
        {
          lifelineBudget,
          locationHintCap: locationCap,
          characterHintCap: characterCap,
          perspectiveHintCap: perspectiveCap,
          narrowedHintCap: narrowedCap,
          guidedFirstDetection,
        },
        validGroups
      );
      router.push(`/teacher/session/${session.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link href="/teacher" className="text-sm text-indigo-600 hover:text-indigo-700">
        ← Back to Dashboard
      </Link>

      {/* Scenario */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
        <select
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
        >
          <option value="">Select a scenario...</option>
          {scenarios.map((s) => (
            <option key={s.scenarioId} value={s.scenarioId}>
              {s.topic} ({s.flawCount} flaws, {s.personaCount} personas)
            </option>
          ))}
        </select>
        {scenario?.discussionArc && (
          <p className="text-xs text-gray-400 mt-1">{scenario.discussionArc}</p>
        )}
      </div>

      {/* Lifeline budget */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lifeline Budget</label>
          <input
            type="number"
            value={lifelineBudget}
            onChange={(e) => setLifelineBudget(parseInt(e.target.value) || 0)}
            min={0}
            max={20}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="guided"
            checked={guidedFirstDetection}
            onChange={(e) => setGuidedFirstDetection(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="guided" className="text-sm text-gray-700">
            Guided first detection
          </label>
        </div>
      </div>

      {/* Groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Groups</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={autoAssign}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Auto-assign
            </button>
            <button
              type="button"
              onClick={addGroup}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add Group
            </button>
          </div>
        </div>

        {duplicates.length > 0 && (
          <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            Duplicate names: {duplicates.join(", ")}. Each name must be unique.
          </div>
        )}

        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">{group.name}</span>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(gi)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {group.students.map((student, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={student}
                      onChange={(e) => updateStudent(gi, si, e.target.value)}
                      placeholder="Full name"
                      className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-400
                        ${duplicates.includes(student.trim().toLowerCase()) ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStudent(gi, si)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addStudent(gi)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  + Add student
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedScenario || creating || duplicates.length > 0}
        className="w-full py-2.5 bg-indigo-500 text-white font-medium rounded-lg
          hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors text-sm"
      >
        {creating ? "Creating..." : "Create Session"}
      </button>
    </form>
  );
}
