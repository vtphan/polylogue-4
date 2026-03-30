"use client";

import { useState } from "react";

interface FlawPattern {
  patternId: string;
  plainLanguage: string;
  description: string;
}

interface DetectionAct {
  actId: string;
  name: string;
  studentQuestion: string;
  readingStrategyHint: string;
  patterns: FlawPattern[];
}

interface DetectionActPickerProps {
  acts: DetectionAct[];
  selectedActId: string | null;
  onSelect: (actId: string) => void;
  mode?: "picker" | "reference"; // picker: radio selection; reference: expandable list
}

export default function DetectionActPicker({
  acts,
  selectedActId,
  onSelect,
  mode = "picker",
}: DetectionActPickerProps) {
  const [expandedActId, setExpandedActId] = useState<string | null>(null);

  if (mode === "reference") {
    return (
      <div className="space-y-2">
        {acts.map((act) => {
          const isExpanded = expandedActId === act.actId;
          return (
            <div key={act.actId}>
              <button
                onClick={() =>
                  setExpandedActId(isExpanded ? null : act.actId)
                }
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    {isExpanded ? "▾" : "▸"}
                  </span>
                  <span className="text-[15px] text-gray-700">
                    {act.studentQuestion}
                  </span>
                </div>
              </button>
              {isExpanded && (
                <div className="ml-7 mt-1 mb-2 space-y-2">
                  {act.patterns.map((p) => (
                    <div
                      key={p.patternId}
                      className="px-3 py-2 bg-gray-50 rounded-md"
                    >
                      <div className="text-sm font-medium text-gray-700">
                        {p.plainLanguage}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {p.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Picker mode — radio selection
  return (
    <div className="space-y-2">
      {acts.map((act) => {
        const isSelected = selectedActId === act.actId;
        return (
          <div key={act.actId}>
            <button
              onClick={() => onSelect(act.actId)}
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
                    {act.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {act.studentQuestion}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 italic">
                    {act.readingStrategyHint}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded patterns when selected */}
            {isSelected && act.patterns.length > 0 && (
              <div className="ml-8 mt-2 mb-1 space-y-1.5">
                <div className="text-xs text-gray-500 font-medium px-1">
                  What kinds of problems are in this category?
                </div>
                {act.patterns.map((p) => (
                  <div
                    key={p.patternId}
                    className="px-3 py-2 bg-indigo-50/50 rounded-lg"
                  >
                    <div className="text-sm text-gray-700">
                      {p.plainLanguage}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
