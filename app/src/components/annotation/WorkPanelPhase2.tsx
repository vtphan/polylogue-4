"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ThinkingBehaviorBrowser from "./ThinkingBehaviorBrowser";

interface ThinkingBehavior {
  behaviorId: string;
  name: string;
  description: string;
}

interface AnnotationData {
  id: number;
  location: string;
  detectionAct: string | null;
  description: string | null;
  thinkingBehavior: string | null;
  behaviorSource: string | null;
  behaviorOwnWords: string | null;
  behaviorExplanation: string | null;
  phaseCreated: number;
  submitted: boolean;
}

interface DetectionAct {
  actId: string;
  name: string;
}

interface Persona {
  persona_id: string;
  name: string;
}

interface Turn {
  turn_id: string;
  speaker: string;
  sentences: { id: string; text: string }[];
}

interface WorkPanelPhase2Props {
  annotations: AnnotationData[];
  detectionActs: DetectionAct[];
  thinkingBehaviors: ThinkingBehavior[];
  turns: Turn[];
  personas: Persona[];
  onSaveBehavior: (
    annotationId: number,
    data: {
      thinkingBehavior: string | null;
      behaviorSource: "library" | "own_words";
      behaviorOwnWords: string | null;
      behaviorExplanation: string;
    }
  ) => Promise<void>;
  onSubmit: () => Promise<void>;
  onUndo: () => Promise<void>;
  submitted: boolean;
}

function formatLocation(
  sentences: string[],
  turns: Turn[],
  personas: Persona[]
): string {
  if (sentences.length === 0) return "";
  const turnGroups = new Map<string, string[]>();
  for (const s of sentences) {
    const turnId = s.split(".")[0];
    const existing = turnGroups.get(turnId) || [];
    existing.push(s);
    turnGroups.set(turnId, existing);
  }
  const parts: string[] = [];
  for (const [turnId, sents] of turnGroups) {
    const turn = turns.find((t) => t.turn_id === turnId);
    const persona = turn ? personas.find((p) => p.persona_id === turn.speaker) : null;
    const name = persona?.name ?? turn?.speaker ?? "";
    const sentNums = sents
      .map((s) => { const m = s.match(/\.s(\d+)$/); return m ? parseInt(m[1]) : 0; })
      .sort((a, b) => a - b);
    const turnNum = turnId.replace("turn_", "");
    if (sentNums.length === 1) {
      parts.push(`Turn ${parseInt(turnNum)}, sentence ${sentNums[0]} (${name})`);
    } else {
      parts.push(`Turn ${parseInt(turnNum)}, sentences ${sentNums[0]}-${sentNums[sentNums.length - 1]} (${name})`);
    }
  }
  return parts.join("; ");
}

function getQuotedText(sentences: string[], turns: Turn[]): string {
  return sentences
    .map((sentId) => {
      for (const turn of turns) {
        const sent = turn.sentences.find((s) => s.id === sentId);
        if (sent) return sent.text;
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

export default function WorkPanelPhase2({
  annotations,
  detectionActs,
  thinkingBehaviors,
  turns,
  personas,
  onSaveBehavior,
  onSubmit,
  onUndo,
  submitted,
}: WorkPanelPhase2Props) {
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedBehavior, setSelectedBehavior] = useState<string | null>(null);
  const [behaviorSource, setBehaviorSource] = useState<"library" | "own_words" | null>(null);
  const [ownWordsText, setOwnWordsText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [introCollapsed, setIntroCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [undoTimeLeft, setUndoTimeLeft] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Start undo countdown when submitted
  useEffect(() => {
    if (submitted && undoTimeLeft === 0) {
      setUndoTimeLeft(30);
    }
  }, [submitted]);

  useEffect(() => {
    if (undoTimeLeft <= 0) {
      clearInterval(undoTimerRef.current);
      return;
    }
    undoTimerRef.current = setInterval(() => {
      setUndoTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(undoTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(undoTimerRef.current);
  }, [undoTimeLeft]);

  const allAssigned = annotations.every(
    (a) => a.thinkingBehavior !== null || a.behaviorSource === "own_words"
  );

  const openAssignment = useCallback((ann: AnnotationData) => {
    setAssigningId(ann.id);
    setSelectedBehavior(ann.thinkingBehavior);
    setBehaviorSource(
      ann.behaviorSource as "library" | "own_words" | null
    );
    setOwnWordsText(ann.behaviorOwnWords ?? "");
    setExplanation(ann.behaviorExplanation ?? "");
  }, []);

  const handleBehaviorSelect = useCallback(
    (id: string | null, source: "library" | "own_words", ownWords: string | null) => {
      setSelectedBehavior(id);
      setBehaviorSource(source);
      if (ownWords !== null) setOwnWordsText(ownWords);
    },
    []
  );

  const canSaveBehavior =
    behaviorSource !== null &&
    (behaviorSource === "library"
      ? selectedBehavior !== null
      : ownWordsText.trim().length > 0) &&
    explanation.trim().length >= 15 &&
    !saving;

  async function handleSaveBehavior() {
    if (!canSaveBehavior || assigningId === null) return;
    setSaving(true);
    try {
      await onSaveBehavior(assigningId, {
        thinkingBehavior: selectedBehavior,
        behaviorSource: behaviorSource!,
        behaviorOwnWords: behaviorSource === "own_words" ? ownWordsText.trim() : null,
        behaviorExplanation: explanation.trim(),
      });
      if (!introCollapsed) setIntroCollapsed(true);
      setAssigningId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setShowConfirm(false);
    await onSubmit();
  }

  async function handleUndo() {
    setUndoTimeLeft(0);
    await onUndo();
  }

  // ----- SUBMITTED STATE -----
  if (submitted) {
    return (
      <div className="h-full overflow-y-auto px-5 py-6 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-submit-check">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-2">Submitted!</h2>
          <p className="text-[16px] text-gray-600 leading-relaxed">
            You marked {annotations.length} moment{annotations.length !== 1 ? "s" : ""} and
            explained the thinking behind each one. Your teacher will let you know
            when it&apos;s time to see what your group found.
          </p>
        </div>
        {undoTimeLeft > 0 && (
          <button
            onClick={handleUndo}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl
              hover:bg-gray-200 transition-colors text-[15px]"
          >
            Undo ({undoTimeLeft}s)
          </button>
        )}
      </div>
    );
  }

  // ----- BEHAVIOR ASSIGNMENT VIEW -----
  if (assigningId !== null) {
    const ann = annotations.find((a) => a.id === assigningId);
    if (!ann) return null;

    const sentences = JSON.parse(ann.location).sentences as string[];
    const locationText = formatLocation(sentences, turns, personas);
    const quotedText = getQuotedText(sentences, turns);
    const actName = detectionActs.find((a) => a.actId === ann.detectionAct)?.name ?? "";

    return (
      <div className="h-full overflow-y-auto px-5 py-6 space-y-5">
        <button
          onClick={() => setAssigningId(null)}
          className="text-[15px] text-indigo-600 font-medium hover:text-indigo-700"
        >
          &larr; Back to list
        </button>

        {/* Annotation context */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
          <div className="text-sm text-gray-500">{locationText}</div>
          {quotedText && (
            <div className="text-sm text-gray-600 italic line-clamp-3">
              &ldquo;{quotedText}&rdquo;
            </div>
          )}
          <div className="text-[15px] font-medium text-gray-800 mt-1">
            You said: {actName}
          </div>
          {ann.description && (
            <div className="text-sm text-gray-600 italic">
              &ldquo;{ann.description}&rdquo;
            </div>
          )}
        </div>

        {/* Behavior selection */}
        <div>
          <h3 className="text-[16px] font-semibold text-gray-800 mb-3">
            Why do you think they said this? What thinking habit might be behind it?
          </h3>
          <ThinkingBehaviorBrowser
            behaviors={thinkingBehaviors}
            selectedBehaviorId={selectedBehavior}
            behaviorSource={behaviorSource}
            ownWordsText={ownWordsText}
            onSelect={handleBehaviorSelect}
          />
        </div>

        {/* Explanation field — progressive disclosure */}
        {behaviorSource !== null && (
          <div>
            <h3 className="text-[16px] font-semibold text-gray-800 mb-2">
              Explain the connection:
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              How does this thinking habit lead to the problem you noticed?
            </p>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain how this thinking habit connects to what you noticed..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[16px] leading-relaxed
                focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
                placeholder:text-gray-400 resize-none"
            />
            {explanation.length > 0 && explanation.trim().length < 15 && (
              <p className="text-xs text-gray-400 mt-1">
                Keep going — at least 15 characters.
              </p>
            )}
          </div>
        )}

        {/* Save/Cancel */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSaveBehavior}
            disabled={!canSaveBehavior}
            className="flex-1 py-3 px-4 bg-indigo-500 text-white font-semibold rounded-xl
              hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors text-[16px]"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setAssigningId(null)}
            className="py-3 px-6 bg-gray-100 text-gray-600 font-medium rounded-xl
              hover:bg-gray-200 transition-colors text-[16px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ----- ANNOTATION CHECKLIST -----
  return (
    <div className="h-full overflow-y-auto px-5 py-6 space-y-5">
      {/* Phase 2 introduction */}
      {!introCollapsed ? (
        <div className="space-y-2">
          <h2 className="text-[20px] font-bold text-gray-900">
            Why did they think that way?
          </h2>
          <p className="text-[16px] text-gray-600 leading-relaxed">
            You found problems in the discussion. Now think about what&apos;s going on
            in their thinking. For each thing you marked, pick the thinking habit
            that fits best.
          </p>
        </div>
      ) : (
        <p className="text-[15px] text-gray-500">
          Assign a thinking behavior to each annotation, then submit.
        </p>
      )}

      {/* Annotation cards */}
      <div className="space-y-3">
        {annotations.map((ann, i) => {
          const sentences = JSON.parse(ann.location).sentences as string[];
          const locationText = formatLocation(sentences, turns, personas);
          const actName =
            detectionActs.find((a) => a.actId === ann.detectionAct)?.name ?? "";
          const hasThinking =
            ann.thinkingBehavior !== null || ann.behaviorSource === "own_words";
          const behaviorName = ann.thinkingBehavior
            ? thinkingBehaviors.find((b) => b.behaviorId === ann.thinkingBehavior)?.name
            : ann.behaviorOwnWords
              ? `"${ann.behaviorOwnWords}"`
              : null;

          return (
            <button
              key={ann.id}
              onClick={() => openAssignment(ann)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 space-y-1
                hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">{locationText}</div>
                  <div className="text-[15px] font-medium text-gray-800 mt-1">
                    {actName}
                  </div>
                  {ann.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-1 italic">
                      &ldquo;{ann.description}&rdquo;
                    </div>
                  )}
                  <div className="mt-2 text-sm">
                    {hasThinking ? (
                      <span className="text-green-700">
                        ✓ {behaviorName}
                      </span>
                    ) : (
                      <span className="text-amber-600">
                        ⚠ Not assigned yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit section */}
      <div className="pt-2 space-y-3 border-t border-gray-200">
        {!allAssigned && (
          <p className="text-sm text-gray-500">
            Assign all thinking behaviors to submit.
          </p>
        )}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!allAssigned}
          className="w-full py-3.5 bg-indigo-500 text-white font-semibold rounded-xl
            hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-[0.97] transition-all text-[17px]"
        >
          Submit My Work
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm mx-6 p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-gray-900">Ready to submit?</h3>
            <p className="text-[15px] text-gray-600">
              Once you submit, you can&apos;t change your answers until Phase 3. Ready?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-indigo-500 text-white font-semibold rounded-xl
                  hover:bg-indigo-600 transition-colors"
              >
                Submit
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl
                  hover:bg-gray-200 transition-colors"
              >
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
