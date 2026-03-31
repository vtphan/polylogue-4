"use client";

import { useState } from "react";
import ComparisonView from "@/components/comparison/ComparisonView";
import type { ComparisonCard } from "@/lib/comparison";
import type { AIAnnotationCard } from "@/actions/ai-annotations";
import { hasOverlap } from "@/lib/overlap";

interface DetectionAct {
  actId: string;
  name: string;
}

interface ThinkingBehavior {
  behaviorId: string;
  name: string;
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

interface Persona {
  persona_id: string;
  name: string;
}

interface Turn {
  turn_id: string;
  speaker: string;
  sentences: { id: string; text: string }[];
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
    const name = persona?.name ?? "";
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

interface WorkPanelPhase4Props {
  comparisonCards: ComparisonCard[];
  aiCards: AIAnnotationCard[];
  annotations: AnnotationData[];
  detectionActs: DetectionAct[];
  thinkingBehaviors: ThinkingBehavior[];
  turns: Turn[];
  personas: Persona[];
  myUserId: string;
  onEditAnnotation: (annotationId: number) => void;
  onNewAnnotation: () => void;
  // Reflection
  reflectionActive: boolean;
  onSubmitReflection: (missedInsight: string, nextStrategy: string) => Promise<void>;
  reflectionSubmitted: boolean;
}

export default function WorkPanelPhase4({
  comparisonCards,
  aiCards,
  annotations,
  detectionActs,
  thinkingBehaviors,
  turns,
  personas,
  myUserId,
  onEditAnnotation,
  onNewAnnotation,
  reflectionActive,
  onSubmitReflection,
  reflectionSubmitted,
}: WorkPanelPhase4Props) {
  const [activeTab, setActiveTab] = useState<"ai" | "comparison" | "my">("ai");
  const [missedInsight, setMissedInsight] = useState("");
  const [nextStrategy, setNextStrategy] = useState("");
  const [reflectionSaving, setReflectionSaving] = useState(false);

  // Compute overlap framing for AI cards
  const studentLocations = annotations.map((a) => ({
    sentences: (JSON.parse(a.location).sentences as string[]),
    description: a.description,
    detectionAct: a.detectionAct,
  }));

  // Find student annotations that have no AI overlap ("AI missed this")
  const studentOnlyAnnotations = annotations.filter((ann) => {
    const annLoc = { sentences: JSON.parse(ann.location).sentences as string[] };
    return !aiCards.some((ai) => hasOverlap(annLoc, { sentences: ai.location.sentences }));
  });

  async function handleReflectionSubmit() {
    setReflectionSaving(true);
    try {
      await onSubmitReflection(missedInsight.trim(), nextStrategy.trim());
    } finally {
      setReflectionSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-5 pt-3">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-2 text-center text-[14px] font-medium transition-colors border-b-2
            ${activeTab === "ai" ? "text-ai border-ai" : "text-gray-400 border-transparent"}`}
        >
          AI Perspective
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`flex-1 py-2 text-center text-[14px] font-medium transition-colors border-b-2
            ${activeTab === "comparison" ? "text-indigo-600 border-indigo-500" : "text-gray-400 border-transparent"}`}
        >
          Comparison
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-2 text-center text-[14px] font-medium transition-colors border-b-2
            ${activeTab === "my" ? "text-indigo-600 border-indigo-500" : "text-gray-400 border-transparent"}`}
        >
          My Work
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === "ai" && (
          <div className="space-y-4">
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Here&apos;s what the AI noticed. It&apos;s one perspective — you might
              agree, disagree, or see something it missed.
            </p>

            {/* "You found something the AI missed!" */}
            {studentOnlyAnnotations.length > 0 && (
              <div className="bg-unique/5 border-l-4 border-unique rounded-xl px-4 py-3 ring-1 ring-unique/20">
                <div className="text-xs font-bold tracking-wide text-unique mb-1">
                  YOU FOUND SOMETHING THE AI MISSED
                </div>
                <p className="text-[15px] text-gray-800">
                  You marked {studentOnlyAnnotations.length} spot{studentOnlyAnnotations.length !== 1 ? "s" : ""} that
                  the AI didn&apos;t notice. What do you think?
                </p>
              </div>
            )}

            {/* AI annotation cards with overlap framing */}
            {aiCards.map((ai, i) => {
              const aiLoc = { sentences: ai.location.sentences };
              const overlapping = studentLocations.filter((s) =>
                hasOverlap({ sentences: s.sentences }, aiLoc)
              );
              const hasStudentOverlap = overlapping.length > 0;
              const locationText = formatLocation(ai.location.sentences, turns, personas);

              return (
                <div
                  key={ai.annotationId}
                  className="bg-ai/5 border-l-4 border-ai rounded-xl px-4 py-3 space-y-3"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  {/* Overlap framing */}
                  {hasStudentOverlap && (
                    <div className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800 font-medium">
                      ✓ You found this too!
                    </div>
                  )}

                  <div className="text-sm text-gray-500">{locationText}</div>

                  {/* Argument flaw */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium tracking-wide">
                      ARGUMENT FLAW
                    </div>
                    <div className="text-[15px] font-medium text-gray-800">
                      {ai.argumentFlaw.detectionActName} — &ldquo;{ai.argumentFlaw.patternName}&rdquo;
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {ai.argumentFlaw.explanation}
                    </p>
                  </div>

                  {/* Thinking behavior */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium tracking-wide">
                      THINKING BEHAVIOR
                    </div>
                    <div className="text-[15px] font-medium text-gray-800">
                      &ldquo;{ai.thinkingBehavior.patternName}&rdquo;
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {ai.thinkingBehavior.explanation}
                    </p>
                  </div>

                  {/* Discussion prompt */}
                  <div className="pt-1">
                    {hasStudentOverlap ? (
                      <p className="text-[14px] text-gray-600 font-medium italic">
                        Do you agree with how the AI explained it?
                      </p>
                    ) : (
                      <p className="text-[14px] text-gray-600 font-medium italic">
                        The AI noticed something here that you didn&apos;t mark. Do you agree?
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "comparison" && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold text-gray-900">
              Everyone&apos;s Findings
            </h2>
            <ComparisonView
              cards={comparisonCards}
              turns={turns}
              personas={personas}
              detectionActs={detectionActs}
              thinkingBehaviors={thinkingBehaviors}
              myUserId={myUserId}
            />
          </div>
        )}

        {activeTab === "my" && (
          <div className="space-y-4">
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Now that you&apos;ve seen the AI&apos;s perspective, is there anything
              you&apos;d change or add?
            </p>

            {/* Annotation list */}
            <div className="space-y-3">
              {annotations.map((ann) => {
                const sentences = JSON.parse(ann.location).sentences as string[];
                const locationText = formatLocation(sentences, turns, personas);
                const actName =
                  detectionActs.find((a) => a.actId === ann.detectionAct)?.name ?? "";
                const behaviorName = ann.thinkingBehavior
                  ? thinkingBehaviors.find((b) => b.behaviorId === ann.thinkingBehavior)?.name
                  : ann.behaviorOwnWords
                    ? `"${ann.behaviorOwnWords}"`
                    : null;

                return (
                  <div
                    key={ann.id}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 space-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">{locationText}</div>
                        <div className="text-[15px] font-medium text-gray-800 mt-1">
                          {actName}
                        </div>
                        {behaviorName && (
                          <div className="text-sm text-gray-600 mt-0.5">
                            {behaviorName}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onEditAnnotation(ann.id)}
                        className="ml-3 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-lg
                          hover:bg-indigo-100 transition-colors font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onNewAnnotation}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl
                text-[15px] text-gray-500 font-medium hover:border-indigo-300 hover:text-indigo-600
                transition-colors"
            >
              + Add new annotation
            </button>
          </div>
        )}

        {/* Reflection form */}
        {reflectionActive && !reflectionSubmitted && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <h3 className="text-[18px] font-bold text-gray-900">Before you go...</h3>

            <div>
              <label className="block text-[15px] text-gray-700 mb-2">
                What&apos;s one thing you noticed on re-reading that you missed the first time?
              </label>
              <textarea
                value={missedInsight}
                onChange={(e) => setMissedInsight(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[15px] leading-relaxed
                  focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
                  placeholder:text-gray-400 resize-none"
                placeholder="Something you noticed the second time around..."
              />
            </div>

            <div>
              <label className="block text-[15px] text-gray-700 mb-2">
                What will you look for in the next discussion?
              </label>
              <textarea
                value={nextStrategy}
                onChange={(e) => setNextStrategy(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[15px] leading-relaxed
                  focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
                  placeholder:text-gray-400 resize-none"
                placeholder="A question or strategy you'll try next time..."
              />
            </div>

            <button
              onClick={handleReflectionSubmit}
              disabled={reflectionSaving}
              className="w-full py-3 bg-indigo-500 text-white font-semibold rounded-xl
                hover:bg-indigo-600 disabled:opacity-40 transition-colors text-[16px]"
            >
              {reflectionSaving ? "Saving..." : "Done"}
            </button>
          </div>
        )}

        {reflectionSubmitted && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-[16px] text-gray-600">
              Thanks for reflecting! Your teacher will let you know when the session is over.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
