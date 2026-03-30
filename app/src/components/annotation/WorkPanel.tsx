"use client";

import { useState, useCallback } from "react";
import DetectionActPicker from "./DetectionActPicker";

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

interface AnnotationData {
  id: number;
  location: string; // JSON
  detectionAct: string | null;
  description: string | null;
  phaseCreated: number;
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

interface WorkPanelProps {
  detectionActs: DetectionAct[];
  annotations: AnnotationData[];
  selectedSentences: Set<string>;
  turns: Turn[];
  personas: Persona[];
  onSave: (data: {
    detectionAct: string;
    description: string;
    sentences: string[];
  }) => Promise<void>;
  onUpdate: (
    annotationId: number,
    data: { detectionAct: string; description: string }
  ) => Promise<void>;
  onCancel: () => void;
  onEditAnnotation: (annotationId: number) => void;
  editingAnnotation: AnnotationData | null;
}

function formatLocation(
  sentences: string[],
  turns: Turn[],
  personas: Persona[]
): string {
  if (sentences.length === 0) return "";

  // Group by turn
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

    // Extract sentence numbers
    const sentNums = sents
      .map((s) => {
        const match = s.match(/\.s(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => a - b);

    const turnNum = turnId.replace("turn_", "");
    if (sentNums.length === 1) {
      parts.push(`Turn ${parseInt(turnNum)}, sentence ${sentNums[0]} (${name})`);
    } else {
      parts.push(
        `Turn ${parseInt(turnNum)}, sentences ${sentNums[0]}-${sentNums[sentNums.length - 1]} (${name})`
      );
    }
  }
  return parts.join("; ");
}

function getSelectedText(sentences: string[], turns: Turn[]): string {
  return sentences
    .map((sentId) => {
      for (const turn of turns) {
        const sent = turn.sentences.find((s) => s.id === sentId);
        if (sent) return `"${sent.text}"`;
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

export default function WorkPanel({
  detectionActs,
  annotations,
  selectedSentences,
  turns,
  personas,
  onSave,
  onUpdate,
  onCancel,
  onEditAnnotation,
  editingAnnotation,
}: WorkPanelProps) {
  const [selectedAct, setSelectedAct] = useState<string | null>(
    editingAnnotation?.detectionAct ?? null
  );
  const [description, setDescription] = useState(
    editingAnnotation?.description ?? ""
  );
  const [saving, setSaving] = useState(false);

  // Reset form when editing annotation changes
  const resetForm = useCallback(() => {
    setSelectedAct(null);
    setDescription("");
  }, []);

  const sentenceArray = Array.from(selectedSentences);
  const isCreating = sentenceArray.length > 0 && !editingAnnotation;
  const isEditing = editingAnnotation !== null;
  const isFormActive = isCreating || isEditing;

  const canSave =
    selectedAct !== null && description.trim().length >= 10 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEditing && editingAnnotation) {
        await onUpdate(editingAnnotation.id, {
          detectionAct: selectedAct!,
          description: description.trim(),
        });
      } else {
        await onSave({
          detectionAct: selectedAct!,
          description: description.trim(),
          sentences: sentenceArray,
        });
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    resetForm();
    onCancel();
  }

  // ----- FORM STATE (creating or editing) -----
  if (isFormActive) {
    const formSentences = isEditing
      ? JSON.parse(editingAnnotation!.location).sentences as string[]
      : sentenceArray;
    const locationText = formatLocation(formSentences, turns, personas);
    const quotedText = getSelectedText(formSentences, turns);

    return (
      <div className="h-full overflow-y-auto px-5 py-6 space-y-5">
        <h2 className="text-[20px] font-bold text-gray-900">
          What did you notice?
        </h2>

        {/* Selected location */}
        <div className="bg-amber-50 rounded-xl px-4 py-3">
          <div className="text-sm font-medium text-amber-800">Selected:</div>
          <div className="text-sm text-amber-700 mt-1">{locationText}</div>
          {quotedText && (
            <div className="text-sm text-amber-600 mt-2 italic line-clamp-3">
              {quotedText}
            </div>
          )}
        </div>

        {/* Detection act picker */}
        <div>
          <h3 className="text-[16px] font-semibold text-gray-800 mb-3">
            What type of problem is this?
          </h3>
          <DetectionActPicker
            acts={detectionActs}
            selectedActId={selectedAct}
            onSelect={setSelectedAct}
          />
        </div>

        {/* Description */}
        <div>
          <h3 className="text-[16px] font-semibold text-gray-800 mb-2">
            Describe what you noticed:
          </h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you notice? Describe it in your own words."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[16px] leading-relaxed
              focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
              placeholder:text-gray-400 resize-none"
          />
          {description.length > 0 && description.trim().length < 10 && (
            <p className="text-xs text-gray-400 mt-1">
              Keep going — at least 10 characters.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-3 px-4 bg-indigo-500 text-white font-semibold rounded-xl
              hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors text-[16px]"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            className="py-3 px-6 bg-gray-100 text-gray-600 font-medium rounded-xl
              hover:bg-gray-200 transition-colors text-[16px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ----- EMPTY STATE (0 annotations, nothing selected) -----
  if (annotations.length === 0) {
    return (
      <div className="h-full overflow-y-auto px-5 py-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[18px] text-gray-700 leading-relaxed">
              Start by reading the discussion on the left.
            </p>
            <p className="text-[16px] text-gray-500 leading-relaxed">
              When something seems off — maybe someone said something that
              doesn&apos;t sound right, or they didn&apos;t back up what they said — tap
              on that sentence.
            </p>
          </div>

          <div>
            <p className="text-[15px] text-gray-500 mb-3">
              Try reading with one of these questions in mind:
            </p>
            <DetectionActPicker
              acts={detectionActs}
              selectedActId={null}
              onSelect={() => {}}
              mode="reference"
            />
          </div>
        </div>
      </div>
    );
  }

  // ----- ACTIVE STATE (1+ annotations, nothing selected) -----
  return (
    <div className="h-full overflow-y-auto px-5 py-6 space-y-6">
      {/* Annotation list */}
      <div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-4">
          Your Annotations ({annotations.length})
        </h2>
        <div className="space-y-3">
          {annotations.map((ann, i) => {
            const location = JSON.parse(ann.location);
            const sentences = location.sentences as string[];
            const locationText = formatLocation(sentences, turns, personas);
            const actName =
              detectionActs.find((a) => a.actId === ann.detectionAct)?.name ?? "";

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
                    {ann.description && (
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2 italic">
                        &ldquo;{ann.description}&rdquo;
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
      </div>

      {/* Detection questions reference */}
      <div>
        <p className="text-[14px] text-gray-500 mb-2">
          Try these questions to find more:
        </p>
        <DetectionActPicker
          acts={detectionActs}
          selectedActId={null}
          onSelect={() => {}}
          mode="reference"
        />
      </div>
    </div>
  );
}
