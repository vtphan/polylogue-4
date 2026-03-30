"use client";

interface Persona {
  persona_id: string;
  name: string;
  role: string;
}

interface Sentence {
  id: string;
  text: string;
}

interface Turn {
  turn_id: string;
  speaker: string;
  sentences: Sentence[];
}

interface AnnotationMarker {
  id: number;
  sentences: string[];
  detectionAct: string | null;
}

const PERSONA_COLORS: Record<number, { border: string; bg: string; text: string }> = {
  0: { border: "border-l-persona-1", bg: "bg-persona-1/10", text: "text-persona-1" },
  1: { border: "border-l-persona-2", bg: "bg-persona-2/10", text: "text-persona-2" },
  2: { border: "border-l-persona-3", bg: "bg-persona-3/10", text: "text-persona-3" },
};

interface TranscriptViewProps {
  turns: Turn[];
  personas: Persona[];
  selectedSentences: Set<string>;
  onSentenceSelect: (sentenceId: string) => void;
  annotations: AnnotationMarker[];
  onAnnotationSelect?: (annotationId: number) => void;
}

export default function TranscriptView({
  turns,
  personas,
  selectedSentences,
  onSentenceSelect,
  annotations,
  onAnnotationSelect,
}: TranscriptViewProps) {
  // Build persona lookup and color mapping
  const personaMap = new Map<string, Persona>();
  const personaColorIndex = new Map<string, number>();
  personas.forEach((p, i) => {
    personaMap.set(p.persona_id, p);
    personaColorIndex.set(p.persona_id, i);
  });

  // Build sentence → annotation mapping
  const sentenceAnnotations = new Map<string, AnnotationMarker[]>();
  for (const ann of annotations) {
    for (const sentId of ann.sentences) {
      const existing = sentenceAnnotations.get(sentId) || [];
      existing.push(ann);
      sentenceAnnotations.set(sentId, existing);
    }
  }

  return (
    <div className="overflow-y-auto h-full px-4 py-6 space-y-3">
      {turns.map((turn) => {
        const persona = personaMap.get(turn.speaker);
        const colorIdx = personaColorIndex.get(turn.speaker) ?? 0;
        const colors = PERSONA_COLORS[colorIdx] ?? PERSONA_COLORS[0];

        return (
          <div
            key={turn.turn_id}
            className={`${colors.border} border-l-4 rounded-lg bg-white p-4`}
          >
            {/* Persona header */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`font-semibold text-[17px] ${colors.text}`}>
                {persona?.name ?? turn.speaker}
              </span>
              <span className="text-sm text-gray-400">
                {persona?.role}
              </span>
            </div>

            {/* Sentences */}
            <div className="space-y-0">
              {turn.sentences.map((sentence) => {
                const isSelected = selectedSentences.has(sentence.id);
                const markerAnns = sentenceAnnotations.get(sentence.id);
                const hasMarker = markerAnns && markerAnns.length > 0;

                return (
                  <div key={sentence.id} className="flex items-start group">
                    {/* Annotation marker column */}
                    <div className="w-6 flex-shrink-0 flex items-center justify-center pt-2">
                      {hasMarker && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnnotationSelect?.(markerAnns[0].id);
                          }}
                          className={`w-3 h-3 rounded-full ${colors.bg} border-2 ${colors.border.replace("border-l-", "border-")} hover:scale-125 transition-transform`}
                          title="View annotation"
                        />
                      )}
                    </div>

                    {/* Sentence text */}
                    <button
                      onClick={() => onSentenceSelect(sentence.id)}
                      className={`
                        flex-1 text-left py-2 px-3 rounded-md text-[17px] leading-[1.7] min-h-[44px]
                        transition-colors duration-150
                        ${isSelected
                          ? "bg-amber-100 text-gray-900"
                          : hasMarker
                            ? "bg-gray-50 hover:bg-gray-100 text-gray-800"
                            : "hover:bg-gray-50 text-gray-800"
                        }
                      `}
                    >
                      {sentence.text}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
