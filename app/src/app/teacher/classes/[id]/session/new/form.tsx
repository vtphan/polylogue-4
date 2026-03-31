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

interface Student {
  id: string;
  displayName: string;
}

interface Group {
  name: string;
  studentIds: string[];
}

interface Props {
  teacherId: string;
  classId: string;
  students: Student[];
  scenarios: Scenario[];
}

export default function ClassSessionForm({
  teacherId,
  classId,
  students,
  scenarios,
}: Props) {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState("");
  const [lifelineBudget, setLifelineBudget] = useState(6);
  const [guidedFirstDetection, setGuidedFirstDetection] = useState(true);
  const [groups, setGroups] = useState<Group[]>([
    { name: "Group 1", studentIds: [] },
  ]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = scenarios.find((s) => s.scenarioId === selectedScenario);
  const locationCap = scenario?.flawCount ?? 5;
  const characterCap = scenario?.personaCount ?? 2;
  const perspectiveCap = scenario?.personaCount ?? 2;
  const narrowedCap = scenario?.flawCount ?? 5;

  // Track assigned students
  const assignedIds = new Set(groups.flatMap((g) => g.studentIds));
  const unassigned = students.filter((s) => !assignedIds.has(s.id));

  const studentMap = new Map(students.map((s) => [s.id, s.displayName]));

  function addToGroup(groupIndex: number, studentId: string) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, studentIds: [...g.studentIds, studentId] }
          : g
      )
    );
  }

  function removeFromGroup(groupIndex: number, studentId: string) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, studentIds: g.studentIds.filter((id) => id !== studentId) }
          : g
      )
    );
  }

  function addGroup() {
    setGroups((prev) => [
      ...prev,
      { name: `Group ${prev.length + 1}`, studentIds: [] },
    ]);
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function renameGroup(index: number, name: string) {
    setGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, name } : g))
    );
  }

  function autoAssign() {
    setGroups((prev) => {
      const alreadyAssigned = new Set(prev.flatMap((g) => g.studentIds));
      const pool = students
        .filter((s) => !alreadyAssigned.has(s.id))
        .map((s) => s.id)
        .sort(() => Math.random() - 0.5);
      if (pool.length === 0) return prev;

      const updated = prev.map((g) => ({
        ...g,
        studentIds: [...g.studentIds],
      }));
      pool.forEach((id, i) => {
        updated[i % updated.length].studentIds.push(id);
      });
      return updated;
    });
  }

  function assignAll(groupIndex: number) {
    setGroups((prev) => {
      const alreadyAssigned = new Set(prev.flatMap((g) => g.studentIds));
      const available = students
        .filter((s) => !alreadyAssigned.has(s.id))
        .map((s) => s.id);
      return prev.map((g, i) =>
        i === groupIndex
          ? { ...g, studentIds: [...g.studentIds, ...available] }
          : g
      );
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedScenario) return;

    const validGroups = groups.filter((g) => g.studentIds.length > 0);
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
        validGroups,
        classId
      );
      router.push(`/teacher/session/${session.sessionId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create session"
      );
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link
        href={`/teacher/classes/${classId}`}
        className="text-sm text-indigo-600 hover:text-indigo-700"
      >
        &larr; Back to Class
      </Link>

      {/* Scenario */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scenario
        </label>
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

      {/* Config */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lifeline Budget
          </label>
          <input
            type="number"
            value={lifelineBudget}
            onChange={(e) =>
              setLifelineBudget(parseInt(e.target.value) || 0)
            }
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

      {/* Student Roster */}
      <div>
        <div className="text-xs text-gray-500 mb-2">
          {unassigned.length} unassigned / {students.length} total
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {students.map((s) => {
            const isAssigned = assignedIds.has(s.id);
            return (
              <span
                key={s.id}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                  ${
                    isAssigned
                      ? "bg-gray-100 text-gray-400 line-through"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
              >
                {s.displayName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Groups</label>
          <div className="flex gap-3">
            {unassigned.length > 0 && (
              <button
                type="button"
                onClick={autoAssign}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Auto-assign {unassigned.length}
              </button>
            )}
            <button
              type="button"
              onClick={addGroup}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add Group
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {groups.map((group, gi) => (
            <div
              key={gi}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => renameGroup(gi, e.target.value)}
                  className="text-xs font-medium text-gray-600 border-none bg-transparent focus:outline-none
                    focus:ring-1 focus:ring-indigo-200 rounded px-1 -ml-1"
                />
                <div className="flex items-center gap-2">
                  {unassigned.length > 0 && (
                    <button
                      type="button"
                      onClick={() => assignAll(gi)}
                      className="text-[11px] text-gray-400 hover:text-indigo-600"
                    >
                      + all
                    </button>
                  )}
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
              </div>

              {group.studentIds.length > 0 ? (
                <div className="space-y-1 mb-2">
                  {group.studentIds.map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-md"
                    >
                      <span className="text-sm text-gray-700">
                        {studentMap.get(id) ?? id}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromGroup(gi, id)}
                        className="text-xs text-gray-400 hover:text-red-500 ml-2"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 mb-2 px-1">
                  No students yet
                </p>
              )}

              {unassigned.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addToGroup(gi, e.target.value);
                  }}
                  className="w-full px-2 py-1.5 border border-dashed border-gray-300 rounded-md text-xs text-gray-500
                    focus:outline-none focus:border-indigo-400 bg-white"
                >
                  <option value="">+ Add student...</option>
                  {unassigned.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              )}
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
        disabled={!selectedScenario || creating}
        className="w-full py-2.5 bg-indigo-500 text-white font-medium rounded-lg
          hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors text-sm"
      >
        {creating ? "Creating..." : "Create Session"}
      </button>
    </form>
  );
}
