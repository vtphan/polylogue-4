"use client";

import { useState } from "react";

interface ThinkingBehavior {
  behaviorId: string;
  name: string;
  description: string;
}

interface ThinkingBehaviorBrowserProps {
  behaviors: ThinkingBehavior[];
  selectedBehaviorId: string | null;
  behaviorSource: "library" | "own_words" | null;
  ownWordsText: string;
  onSelect: (
    behaviorId: string | null,
    source: "library" | "own_words",
    ownWords: string | null
  ) => void;
}

export default function ThinkingBehaviorBrowser({
  behaviors,
  selectedBehaviorId,
  behaviorSource,
  ownWordsText,
  onSelect,
}: ThinkingBehaviorBrowserProps) {
  const [localOwnWords, setLocalOwnWords] = useState(ownWordsText);
  const isOwnWords = behaviorSource === "own_words";

  return (
    <div className="space-y-2">
      {behaviors.map((b) => {
        const isSelected = behaviorSource === "library" && selectedBehaviorId === b.behaviorId;
        return (
          <button
            key={b.behaviorId}
            onClick={() => onSelect(b.behaviorId, "library", null)}
            className={`
              w-full text-left px-4 py-3 rounded-xl border-2 transition-all
              ${isSelected
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div
                className={`
                  mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0
                  flex items-center justify-center
                  ${isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}
                `}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-[16px] text-gray-900">
                  {b.name}
                </div>
                {isSelected && (
                  <div className="text-sm text-gray-500 mt-1">
                    {b.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {/* Divider */}
      <div className="border-t border-gray-200 my-3" />

      {/* None of these fit */}
      <button
        onClick={() => onSelect(null, "own_words", localOwnWords || null)}
        className={`
          w-full text-left px-4 py-3 rounded-xl border-2 transition-all
          ${isOwnWords
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 hover:border-gray-300 bg-white"
          }
        `}
      >
        <div className="flex items-start gap-3">
          <div
            className={`
              mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0
              flex items-center justify-center
              ${isOwnWords ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}
            `}
          >
            {isOwnWords && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-[15px] text-gray-500">
              None of these fit — describe in your own words
            </div>
          </div>
        </div>
      </button>

      {isOwnWords && (
        <div className="ml-8 mt-1">
          <textarea
            value={localOwnWords}
            onChange={(e) => {
              setLocalOwnWords(e.target.value);
              onSelect(null, "own_words", e.target.value || null);
            }}
            placeholder="Describe the thinking habit you noticed..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[15px] leading-relaxed
              focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
              placeholder:text-gray-400 resize-none"
          />
        </div>
      )}
    </div>
  );
}
