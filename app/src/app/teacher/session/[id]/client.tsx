"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { advancePhase } from "@/actions/submission";
import { endSession, activateReflection } from "@/actions/teacher";

interface GroupData {
  groupId: string;
  members: {
    userId: string;
    displayName: string;
    status: "not_started" | "active" | "submitted" | "may_need_help";
    annotationCount: number;
    submitted: boolean;
    firstOpened: string | null;
  }[];
  flawsFound: number;
  totalFlaws: number;
}

interface ActivityResponse {
  activePhase: number;
  reflectionActive: boolean;
  status: string;
  groups: GroupData[];
  summary: {
    totalStudents: number;
    totalActive: number;
    totalSubmitted: number;
    totalFlaws: number;
  };
}

interface WhatToExpect {
  flaw: string;
  flawName: string;
  turns: string;
  signal: string;
  difficulty: string;
}

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  not_started: { icon: "○", color: "text-gray-400" },
  active: { icon: "●", color: "text-green-500" },
  submitted: { icon: "✓", color: "text-blue-500" },
  may_need_help: { icon: "⚠", color: "text-amber-500" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  most_will_catch: "text-diff-easy",
  harder_to_spot: "text-diff-medium",
  easy_to_miss: "text-diff-hard",
};

interface TeacherSessionClientProps {
  sessionId: string;
  sessionCode: string;
  scenarioTopic: string;
  discussionArc: string;
  activePhase: number;
  status: string;
  reflectionActive: boolean;
  whatToExpect: WhatToExpect[];
  timing: Record<string, number>;
}

export default function TeacherSessionClient({
  sessionId,
  sessionCode,
  scenarioTopic,
  discussionArc,
  activePhase: initialPhase,
  status: initialStatus,
  reflectionActive: initialReflection,
  whatToExpect,
  timing,
}: TeacherSessionClientProps) {
  const [activePhase, setActivePhase] = useState(initialPhase);
  const [status, setStatus] = useState(initialStatus);
  const [reflectionActive, setReflectionActive] = useState(initialReflection);
  const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Poll activity every 10 seconds
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/session/${sessionId}/activity`);
        if (res.ok) {
          const data = await res.json();
          setActivityData(data);
          setActivePhase(data.activePhase);
          setStatus(data.status);
          setReflectionActive(data.reflectionActive);
        }
      } catch {}
    }
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleAdvance = useCallback(async () => {
    setAdvancing(true);
    try {
      await advancePhase(sessionId);
      setActivePhase((p) => p + 1);
      setShowAdvanceDialog(false);
    } finally {
      setAdvancing(false);
    }
  }, [sessionId]);

  const handleEndSession = useCallback(async () => {
    await endSession(sessionId);
    setStatus("archived");
    setShowEndDialog(false);
  }, [sessionId]);

  const handleActivateReflection = useCallback(async () => {
    await activateReflection(sessionId);
    setReflectionActive(true);
  }, [sessionId]);

  const summary = activityData?.summary;
  const groups = activityData?.groups ?? [];

  return (
    <div className="teacher-ui min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/teacher" className="text-sm text-gray-400 hover:text-gray-600">
                ← Dashboard
              </Link>
              <h1 className="text-[16px] font-bold text-gray-900">{scenarioTopic}</h1>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {sessionCode}
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">
                Phase {activePhase}
              </span>
              {status === "archived" && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  Archived
                </span>
              )}
            </div>
            {discussionArc && (
              <p className="text-xs text-gray-400 mt-1 max-w-xl line-clamp-1">{discussionArc}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status === "active" && (
              <>
                {activePhase === 4 && !reflectionActive && (
                  <button
                    onClick={handleActivateReflection}
                    className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg
                      hover:bg-purple-100 transition-colors font-medium"
                  >
                    Start Reflection
                  </button>
                )}
                {activePhase < 4 && (
                  <button
                    onClick={() => setShowAdvanceDialog(true)}
                    className="px-4 py-1.5 text-sm bg-indigo-500 text-white rounded-lg
                      hover:bg-indigo-600 transition-colors font-medium"
                  >
                    Advance to Phase {activePhase + 1}
                  </button>
                )}
                <button
                  onClick={() => setShowEndDialog(true)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg
                    hover:bg-gray-200 transition-colors"
                >
                  End Session
                </button>
              </>
            )}
            <Link
              href={`/teacher/session/${sessionId}/cheatsheet`}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors"
            >
              Cheat Sheet
            </Link>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="bg-white border-b border-gray-200 px-6 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-6 text-xs text-gray-500">
            <span>{summary.totalActive} of {summary.totalStudents} active</span>
            <span>{summary.totalSubmitted} submitted</span>
            {Object.entries(timing).map(([key, val]) => (
              <span key={key} className="text-gray-400">
                {key.replace(/_/g, " ")}: {val}m
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main content — two panel */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex gap-6">
        {/* Left: Student Monitor */}
        <div className="flex-1 space-y-4">
          <h2 className="text-[14px] font-semibold text-gray-700">Student Monitor</h2>

          {groups.length === 0 ? (
            <p className="text-sm text-gray-400">No groups yet. Waiting for students to join.</p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.groupId} className="bg-white border border-gray-200 rounded-lg">
                  {/* Group header */}
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      {group.groupId}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Array.from({ length: group.totalFlaws }).map((_, i) => (
                        <span key={i} className={i < group.flawsFound ? "text-indigo-500" : "text-gray-300"}>
                          ◆
                        </span>
                      ))}
                      {" "}({group.flawsFound}/{group.totalFlaws})
                    </span>
                  </div>

                  {/* Members */}
                  <div className="divide-y divide-gray-50">
                    {group.members.map((m) => {
                      const st = STATUS_ICONS[m.status] ?? STATUS_ICONS.not_started;
                      return (
                        <div key={m.userId} className="px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${st.color}`}>{st.icon}</span>
                            <span className="text-sm text-gray-800">{m.displayName}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>Annot: {m.annotationCount}</span>
                            {m.submitted && <span className="text-blue-500 font-medium">Sub.</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail Panel — cheat sheet summary */}
        <div className="w-[400px] flex-shrink-0">
          <h2 className="text-[14px] font-semibold text-gray-700 mb-3">What to Expect</h2>
          <div className="space-y-3">
            {whatToExpect.map((w) => (
              <div key={w.flaw} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{w.flawName}</span>
                  <span className={`text-xs font-medium ${DIFFICULTY_COLORS[w.difficulty] ?? "text-gray-400"}`}>
                    {w.difficulty.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{w.turns}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{w.signal}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advance Phase Dialog */}
      {showAdvanceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl max-w-md mx-6 p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-gray-900">
              Advance to Phase {activePhase + 1}?
            </h3>

            {summary && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>{summary.totalSubmitted} of {summary.totalStudents} submitted</p>
                <p>{summary.totalStudents - summary.totalSubmitted} not yet submitted</p>
              </div>
            )}

            {/* Low submission warning */}
            {summary && summary.totalSubmitted < summary.totalStudents * 0.5 && (
              <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  Only {summary.totalSubmitted} of {summary.totalStudents} have submitted.
                  Most students&apos; work will be auto-submitted incomplete.
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              {activePhase === 2 && "Unsubmitted work will be auto-submitted. Peer annotations become visible."}
              {activePhase === 3 && "A snapshot of current annotations will be taken before the AI reveal."}
              {activePhase === 1 && "Students move to thinking behavior assignment."}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="flex-1 py-2.5 bg-indigo-500 text-white font-medium rounded-lg
                  hover:bg-indigo-600 disabled:opacity-50 transition-colors text-sm"
              >
                {advancing ? "Advancing..." : "Advance Now"}
              </button>
              <button
                onClick={() => setShowAdvanceDialog(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg
                  hover:bg-gray-200 transition-colors text-sm"
              >
                Wait
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Dialog */}
      {showEndDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl max-w-sm mx-6 p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-gray-900">End this session?</h3>
            <p className="text-sm text-gray-600">
              Students will no longer be able to make changes. You can still view the data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleEndSession}
                className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-lg
                  hover:bg-red-600 transition-colors text-sm"
              >
                End Session
              </button>
              <button
                onClick={() => setShowEndDialog(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg
                  hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
