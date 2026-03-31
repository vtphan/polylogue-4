"use client";

import { useState, useCallback } from "react";
import type { HintState, HintContent } from "@/actions/hints";

interface HintPanelProps {
  hintState: HintState;
  activePhase: number;
  /** Flaw pattern of the student's currently-focused annotation (for perspective/narrowed) */
  currentAnnotationFlaw: string | null;
  onUseHint: (
    hintType: "location" | "character" | "perspective" | "narrowed",
    target?: string
  ) => Promise<HintContent>;
  onHintUsed: () => void; // callback to refresh hint state
}

export default function HintPanel({
  hintState,
  activePhase,
  currentAnnotationFlaw,
  onUseHint,
  onHintUsed,
}: HintPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeHint, setActiveHint] = useState<HintContent | null>(null);
  const [pickingPersona, setPickingPersona] = useState(false);
  const [revealedCharacters, setRevealedCharacters] = useState<HintContent[]>([]);

  const { budgetRemaining, budgetTotal } = hintState;

  // Hide entirely if budget is 0
  if (budgetTotal === 0) return null;

  const phase1Types: ("location" | "character")[] = ["location", "character"];
  const phase2Types: ("character" | "perspective" | "narrowed")[] = [
    "character",
    "perspective",
    "narrowed",
  ];
  const availableTypes = activePhase === 1 ? phase1Types : phase2Types;

  const typeInfo: Record<
    string,
    { label: string; remaining: number; description: string }
  > = {
    location: {
      label: "Where to look",
      remaining: hintState.locationRemaining,
      description: "Points you to specific turns and gives you a question to think about",
    },
    character: {
      label: "About a person",
      remaining: hintState.characterRemaining,
      description: "Learn about a person's strengths and what to watch for",
    },
    perspective: {
      label: "Their perspective",
      remaining: hintState.perspectiveRemaining,
      description: "Walk through their thinking to understand why they said it",
    },
    narrowed: {
      label: "Narrow it down",
      remaining: hintState.narrowedRemaining,
      description: "See 2-3 thinking habits that might explain what you noticed",
    },
  };

  const handleUseHint = useCallback(
    async (
      hintType: "location" | "character" | "perspective" | "narrowed",
      target?: string
    ) => {
      setLoading(true);
      try {
        const hint = await onUseHint(hintType, target);
        setActiveHint(hint);
        if (hint.type === "character" && hint.characterData) {
          setRevealedCharacters((prev) => {
            // Don't duplicate
            if (prev.some((c) => c.characterData?.name === hint.characterData?.name)) {
              return prev;
            }
            return [...prev, hint];
          });
        }
        setPickingPersona(false);
        onHintUsed();
      } catch (err) {
        // Cap reached or budget exhausted — state will be refreshed
      } finally {
        setLoading(false);
      }
    },
    [onUseHint, onHintUsed]
  );

  // Render active hint content
  function renderHintContent(hint: HintContent) {
    if (hint.type === "character" && hint.characterData) {
      const { name, strengths, weaknesses } = hint.characterData;
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-[16px] text-gray-900">
            About {name}:
          </h4>
          <div>
            <p className="text-sm font-medium text-green-700 mb-1">
              What {name.toLowerCase().endsWith("s") ? "they're" : "she's/he's"} good at:
            </p>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-green-500">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-700 mb-1">
              What to watch for:
            </p>
            <ul className="space-y-1">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-500 italic">
            How might this affect what {name.toLowerCase().endsWith("s") ? "they say" : "she/he says"} in the discussion?
          </p>
        </div>
      );
    }

    if (hint.type === "narrowed" && hint.narrowedOptions && hint.narrowedOptions.length > 0) {
      return (
        <div className="space-y-3">
          <p className="text-[15px] text-gray-800">{hint.content}</p>
          <div className="space-y-2">
            {hint.narrowedOptions.map((opt, i) => (
              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="text-sm font-medium text-gray-800">
                  {opt.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {opt.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <p className="text-[15px] text-gray-800 leading-relaxed">{hint.content}</p>;
  }

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      {/* Hint button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveHint(null);
          setPickingPersona(false);
        }}
        disabled={budgetRemaining <= 0}
        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
          ${budgetRemaining > 0
            ? "border-purple-200 bg-purple-50 hover:border-purple-300"
            : "border-gray-200 bg-gray-50 opacity-60"
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-medium text-purple-700">
            {budgetRemaining > 0
              ? `Hints: ${budgetRemaining} remaining`
              : "No hints remaining"}
          </span>
          <span className="text-purple-400 text-sm">
            {isOpen ? "▾" : "▸"}
          </span>
        </div>
        {budgetRemaining <= 0 && (
          <p className="text-xs text-gray-500 mt-1">
            You&apos;ve used all your hints. Keep reading and trying — your teacher can help too.
          </p>
        )}
      </button>

      {/* Expanded hint panel */}
      {isOpen && budgetRemaining > 0 && (
        <div className="mt-3 space-y-3">
          {/* Active hint display */}
          {activeHint && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
              {renderHintContent(activeHint)}
              <button
                onClick={() => setActiveHint(null)}
                className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Close hint
              </button>
            </div>
          )}

          {/* Persona picker for character hints */}
          {pickingPersona && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                Who do you want to know more about?
              </p>
              {hintState.availablePersonas.map((p) => {
                const isRevealed = hintState.revealedPersonas.includes(p.persona_id);
                return (
                  <button
                    key={p.persona_id}
                    onClick={() => handleUseHint("character", p.persona_id)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 bg-white
                      hover:border-purple-300 transition-colors text-[15px] text-gray-800"
                  >
                    {p.name}
                    {isRevealed && (
                      <span className="text-xs text-green-600 ml-2">(free — already revealed)</span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => setPickingPersona(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Hint type options */}
          {!activeHint && !pickingPersona && (
            <div className="space-y-2">
              {availableTypes.map((type) => {
                const info = typeInfo[type];
                const isDisabled = info.remaining <= 0 || loading;

                // Perspective and narrowed need a current annotation flaw
                const needsFlaw =
                  (type === "perspective" || type === "narrowed") &&
                  !currentAnnotationFlaw;

                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === "character") {
                        setPickingPersona(true);
                      } else if (type === "perspective" && currentAnnotationFlaw) {
                        handleUseHint("perspective", currentAnnotationFlaw);
                      } else if (type === "narrowed" && currentAnnotationFlaw) {
                        handleUseHint("narrowed", currentAnnotationFlaw);
                      } else {
                        handleUseHint(type);
                      }
                    }}
                    disabled={isDisabled || needsFlaw}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all
                      ${isDisabled || needsFlaw
                        ? "border-gray-200 bg-gray-50 opacity-50"
                        : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-medium text-gray-800">
                        {info.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {info.remaining > 0 ? `${info.remaining} left` : "used up"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {needsFlaw
                        ? "Tap an annotation first, then use this hint"
                        : info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Persisted character reference cards */}
          {revealedCharacters.length > 0 && !activeHint && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">
                Your character notes:
              </p>
              {revealedCharacters.map((hint, i) => (
                <button
                  key={i}
                  onClick={() => setActiveHint(hint)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-purple-50/50 border border-purple-100
                    hover:border-purple-200 transition-colors"
                >
                  <span className="text-sm text-purple-700">
                    About {hint.characterData?.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
