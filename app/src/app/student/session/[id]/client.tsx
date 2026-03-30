"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import TranscriptView from "@/components/transcript/TranscriptView";
import WorkPanel from "@/components/annotation/WorkPanel";
import PhaseIndicator from "@/components/annotation/PhaseIndicator";
import {
  createAnnotation,
  updateAnnotation,
} from "@/actions/annotations";
import { updateActivity } from "@/actions/activity";

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
  location: string;
  detectionAct: string | null;
  description: string | null;
  phaseCreated: number;
}

interface Persona {
  persona_id: string;
  name: string;
  role: string;
}

interface Turn {
  turn_id: string;
  speaker: string;
  sentences: { id: string; text: string }[];
}

const STATUS_MESSAGES: Record<number, string> = {
  1: "Phase 1: Read the discussion and mark anything that seems off.",
  2: "Phase 2: For each thing you marked, think about why they said it.",
  3: "Phase 3: See what your group found and compare.",
  4: "Phase 4: See what the AI noticed.",
};

interface StudentSessionClientProps {
  sessionId: string;
  studentId: string;
  activePhase: number;
  turns: Turn[];
  personas: Persona[];
  detectionActs: DetectionAct[];
  initialAnnotations: AnnotationData[];
  scenarioTopic: string;
}

export default function StudentSessionClient({
  sessionId,
  studentId,
  activePhase,
  turns,
  personas,
  detectionActs,
  initialAnnotations,
  scenarioTopic,
}: StudentSessionClientProps) {
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(
    new Set()
  );
  const [annotations, setAnnotations] =
    useState<AnnotationData[]>(initialAnnotations);
  const [editingAnnotation, setEditingAnnotation] =
    useState<AnnotationData | null>(null);

  // Heartbeat for activity tracking (every 30 seconds)
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    updateActivity(studentId, sessionId);
    heartbeatRef.current = setInterval(() => {
      updateActivity(studentId, sessionId);
    }, 30000);
    return () => clearInterval(heartbeatRef.current);
  }, [studentId, sessionId]);

  const handleSentenceSelect = useCallback(
    (sentenceId: string) => {
      // If editing, don't allow selection
      if (editingAnnotation) return;

      setSelectedSentences((prev) => {
        const next = new Set(prev);
        if (next.has(sentenceId)) {
          next.delete(sentenceId);
        } else {
          next.add(sentenceId);
        }
        return next;
      });
    },
    [editingAnnotation]
  );

  const handleAnnotationSelect = useCallback(
    (annotationId: number) => {
      const ann = annotations.find((a) => a.id === annotationId);
      if (ann) {
        setEditingAnnotation(ann);
        setSelectedSentences(new Set());
      }
    },
    [annotations]
  );

  const handleSave = useCallback(
    async (data: {
      detectionAct: string;
      description: string;
      sentences: string[];
    }) => {
      const result = await createAnnotation(studentId, sessionId, {
        location: { sentences: data.sentences },
        detectionAct: data.detectionAct,
        description: data.description,
        phaseCreated: activePhase,
      });

      const newAnnotation: AnnotationData = {
        id: result.id,
        location: JSON.stringify({ sentences: data.sentences }),
        detectionAct: data.detectionAct,
        description: data.description,
        phaseCreated: activePhase,
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
      setSelectedSentences(new Set());
    },
    [studentId, sessionId, activePhase]
  );

  const handleUpdate = useCallback(
    async (
      annotationId: number,
      data: { detectionAct: string; description: string }
    ) => {
      await updateAnnotation(annotationId, data);

      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? { ...a, detectionAct: data.detectionAct, description: data.description }
            : a
        )
      );
      setEditingAnnotation(null);
    },
    []
  );

  const handleCancel = useCallback(() => {
    setSelectedSentences(new Set());
    setEditingAnnotation(null);
  }, []);

  const handleEditAnnotation = useCallback(
    (annotationId: number) => {
      const ann = annotations.find((a) => a.id === annotationId);
      if (ann) {
        setEditingAnnotation(ann);
        setSelectedSentences(new Set());
      }
    },
    [annotations]
  );

  // Build annotation markers for TranscriptView
  const annotationMarkers = annotations.map((ann) => {
    const location = JSON.parse(ann.location);
    return {
      id: ann.id,
      sentences: location.sentences as string[],
      detectionAct: ann.detectionAct,
    };
  });

  return (
    <div className="student-ui h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-[20px] font-bold text-gray-900">Perspectives</h1>
          <span className="text-sm text-gray-400 hidden sm:inline">
            {scenarioTopic}
          </span>
        </div>
        <PhaseIndicator currentPhase={activePhase} />
      </div>

      {/* Main content — two-panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Transcript panel (left, ~60%) */}
        <div className="w-[60%] border-r border-gray-200 bg-gray-50">
          <TranscriptView
            turns={turns}
            personas={personas}
            selectedSentences={selectedSentences}
            onSentenceSelect={handleSentenceSelect}
            annotations={annotationMarkers}
            onAnnotationSelect={handleAnnotationSelect}
          />
        </div>

        {/* Work panel (right, ~40%) */}
        <div className="w-[40%] bg-white">
          <WorkPanel
            detectionActs={detectionActs}
            annotations={annotations}
            selectedSentences={selectedSentences}
            turns={turns}
            personas={personas}
            onSave={handleSave}
            onUpdate={handleUpdate}
            onCancel={handleCancel}
            onEditAnnotation={handleEditAnnotation}
            editingAnnotation={editingAnnotation}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="px-6 py-2.5 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {STATUS_MESSAGES[activePhase] ?? ""}
        </p>
      </div>
    </div>
  );
}
