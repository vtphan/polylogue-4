"use client";

import { useState } from "react";
import ComparisonView from "@/components/comparison/ComparisonView";
import type { ComparisonCard, NormalizedAnnotation } from "@/lib/comparison";

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

interface WorkPanelPhase3Props {
  cards: ComparisonCard[];
  annotations: AnnotationData[];
  detectionActs: DetectionAct[];
  thinkingBehaviors: ThinkingBehavior[];
  turns: Turn[];
  personas: Persona[];
  myUserId: string;
  onEditAnnotation: (annotationId: number) => void;
  onNewAnnotation: () => void;
}

export default function WorkPanelPhase3({
  cards,
  annotations,
  detectionActs,
  thinkingBehaviors,
  turns,
  personas,
  myUserId,
  onEditAnnotation,
  onNewAnnotation,
}: WorkPanelPhase3Props) {
  const [activeTab, setActiveTab] = useState<"comparison" | "my">("comparison");

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-5 pt-3">
        <button
          onClick={() => setActiveTab("comparison")}
          className={`flex-1 py-2 text-center text-[15px] font-medium transition-colors border-b-2
            ${activeTab === "comparison"
              ? "text-indigo-600 border-indigo-500"
              : "text-gray-400 border-transparent"
            }`}
        >
          Comparison
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-2 text-center text-[15px] font-medium transition-colors border-b-2
            ${activeTab === "my"
              ? "text-indigo-600 border-indigo-500"
              : "text-gray-400 border-transparent"
            }`}
        >
          My Annotations
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === "comparison" ? (
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold text-gray-900">
              Your Group&apos;s Findings
            </h2>
            <ComparisonView
              cards={cards}
              turns={turns}
              personas={personas}
              detectionActs={detectionActs}
              thinkingBehaviors={thinkingBehaviors}
              myUserId={myUserId}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[15px] text-gray-600 leading-relaxed">
                You can update your work based on your discussion.
                It&apos;s okay to change your mind!
              </p>
            </div>

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

                // Check for Phase 3 revision
                let hasPhase3Revision = false;
                try {
                  const history = JSON.parse(
                    (ann as unknown as { revisionHistory?: string }).revisionHistory ?? "[]"
                  );
                  hasPhase3Revision = history.some(
                    (h: { phase?: number }) => h.phase === 3
                  );
                } catch {}
                const isNewInPhase3 = ann.phaseCreated === 3;

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
                        {(hasPhase3Revision || isNewInPhase3) && (
                          <div className="mt-1">
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                              {isNewInPhase3 ? "Added in Phase 3" : "Updated in Phase 3"}
                            </span>
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

            {/* Add new annotation button */}
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
      </div>
    </div>
  );
}
