"use client";

import type { ComparisonCard, NormalizedAnnotation } from "@/lib/comparison";

interface Turn {
  turn_id: string;
  speaker: string;
  sentences: { id: string; text: string }[];
}

interface Persona {
  persona_id: string;
  name: string;
}

interface DetectionAct {
  actId: string;
  name: string;
}

interface ThinkingBehavior {
  behaviorId: string;
  name: string;
}

interface ComparisonViewProps {
  cards: ComparisonCard[];
  turns: Turn[];
  personas: Persona[];
  detectionActs: DetectionAct[];
  thinkingBehaviors: ThinkingBehavior[];
  myUserId: string;
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
    const persona = turn
      ? personas.find((p) => p.persona_id === turn.speaker)
      : null;
    const name = persona?.name ?? turn?.speaker ?? "";
    const sentNums = sents
      .map((s) => {
        const m = s.match(/\.s(\d+)$/);
        return m ? parseInt(m[1]) : 0;
      })
      .sort((a, b) => a - b);
    const turnNum = turnId.replace("turn_", "");
    if (sentNums.length === 1) {
      parts.push(
        `Turn ${parseInt(turnNum)}, sentence ${sentNums[0]} (${name})`
      );
    } else {
      parts.push(
        `Turn ${parseInt(turnNum)}, sentences ${sentNums[0]}-${sentNums[sentNums.length - 1]} (${name})`
      );
    }
  }
  return parts.join("; ");
}

const CARD_STYLES: Record<string, { border: string; bg: string; label: string; labelColor: string }> = {
  full_agreement: {
    border: "border-agree",
    bg: "bg-agree/5",
    label: "AGREEMENT",
    labelColor: "text-agree",
  },
  partial_agreement: {
    border: "border-agree",
    bg: "bg-agree/5",
    label: "AGREEMENT",
    labelColor: "text-agree",
  },
  disagreement: {
    border: "border-disagree",
    bg: "bg-disagree/5",
    label: "DISAGREEMENT",
    labelColor: "text-disagree",
  },
  unique_yours: {
    border: "border-unique",
    bg: "bg-unique/5",
    label: "ONLY YOU",
    labelColor: "text-unique",
  },
  unique_peer: {
    border: "border-unique",
    bg: "bg-unique/5",
    label: "",
    labelColor: "text-unique",
  },
  unique_ai: {
    border: "border-ai",
    bg: "bg-ai/5",
    label: "AI FOUND THIS",
    labelColor: "text-ai",
  },
};

export default function ComparisonView({
  cards,
  turns,
  personas,
  detectionActs,
  thinkingBehaviors,
  myUserId,
}: ComparisonViewProps) {
  if (cards.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <p className="text-[16px] text-gray-500">
          No annotations to compare yet.
        </p>
      </div>
    );
  }

  function getActName(actId: string | null): string {
    if (!actId) return "Not specified";
    return detectionActs.find((a) => a.actId === actId)?.name ?? actId;
  }

  function getBehaviorName(ann: NormalizedAnnotation): string {
    if (ann.behaviorSource === "own_words" && ann.behaviorOwnWords) {
      return `"${ann.behaviorOwnWords}"`;
    }
    if (ann.thinkingBehavior) {
      return (
        thinkingBehaviors.find((b) => b.behaviorId === ann.thinkingBehavior)
          ?.name ?? ann.thinkingBehavior
      );
    }
    return "No thinking behavior assigned";
  }

  function getDisplayName(ann: NormalizedAnnotation): string {
    if (ann.isAI) return "AI";
    if (ann.userId === myUserId) return "You";
    return ann.displayName;
  }

  return (
    <div className="space-y-4">
      {cards.map((card, i) => {
        const style = CARD_STYLES[card.type] ?? CARD_STYLES.unique_yours;
        const locationText = formatLocation(
          card.location.sentences,
          turns,
          personas
        );

        // For unique_peer, use the peer's name in the label
        const label =
          card.type === "unique_peer"
            ? `ONLY ${card.annotations[0]?.displayName?.toUpperCase()}`
            : style.label;

        const isUnique =
          card.type === "unique_yours" ||
          card.type === "unique_peer" ||
          card.type === "unique_ai";

        return (
          <div
            key={i}
            className={`${style.bg} border-l-4 ${style.border} rounded-xl px-4 py-3 space-y-2
              ${card.type === "unique_yours" ? "ring-1 ring-unique/20" : ""}`}
          >
            {/* Label */}
            <div className={`text-xs font-bold tracking-wide ${style.labelColor}`}>
              {label}
            </div>

            {/* Location */}
            <div className="text-sm text-gray-500">{locationText}</div>

            {isUnique ? (
              /* Unique card: show the single annotation's details */
              <div className="space-y-1">
                <div className="text-[15px] text-gray-800">
                  {getActName(card.annotations[0]?.detectionAct)}
                </div>
                {card.annotations[0]?.description && (
                  <div className="text-sm text-gray-600 italic">
                    &ldquo;{card.annotations[0].description}&rdquo;
                  </div>
                )}
              </div>
            ) : (
              /* Multi-person card: show each person's view */
              <div className="space-y-2">
                {/* Detection act comparison */}
                {card.type === "disagreement" ? (
                  <div className="space-y-1">
                    {card.annotations.map((ann, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: ann.color }}
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">
                            {getDisplayName(ann)}:
                          </span>{" "}
                          {getActName(ann.detectionAct)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Agreement — show shared act, then individual behaviors */
                  <>
                    <div className="text-[15px] text-gray-800">
                      All said: {getActName(card.annotations[0]?.detectionAct)}
                    </div>
                    {/* Thinking behaviors */}
                    <div className="space-y-1 pt-1">
                      <div className="text-xs text-gray-500 font-medium">
                        Thinking behaviors:
                      </div>
                      {card.annotations.map((ann, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span
                            className="inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: ann.color }}
                          />
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">
                              {getDisplayName(ann)}:
                            </span>{" "}
                            {getBehaviorName(ann)}
                            {ann.behaviorSource === "own_words" &&
                              ann.behaviorOwnWords && (
                                <div className="mt-1 pl-3 border-l-2 border-gray-200">
                                  <p className="text-xs text-gray-500 italic">
                                    {ann.displayName} wrote: &ldquo;
                                    {ann.behaviorOwnWords}&rdquo;
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Does that match any of the thinking
                                    behaviors?
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Prompt */}
            <p className="text-[14px] text-gray-600 font-medium italic pt-1">
              {card.prompt}
            </p>
          </div>
        );
      })}
    </div>
  );
}
