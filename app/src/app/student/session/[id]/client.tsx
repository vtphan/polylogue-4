"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import TranscriptView from "@/components/transcript/TranscriptView";
import WorkPanel from "@/components/annotation/WorkPanel";
import WorkPanelPhase2 from "@/components/annotation/WorkPanelPhase2";
import PhaseIndicator from "@/components/annotation/PhaseIndicator";
import HintPanel from "@/components/annotation/HintPanel";
import WorkPanelPhase3 from "@/components/annotation/WorkPanelPhase3";
import WorkPanelPhase4 from "@/components/annotation/WorkPanelPhase4";
import { compareAnnotations } from "@/lib/comparison";
import type { NormalizedAnnotation } from "@/lib/comparison";
import type { GroupMemberInfo, PeerSnapshotAnnotation } from "@/actions/comparison";
import type { AIAnnotationCard, NormalizedAIAnnotation } from "@/actions/ai-annotations";
import { submitReflection } from "@/actions/reflection";
import {
  createAnnotation,
  updateAnnotation,
} from "@/actions/annotations";
import {
  updateAnnotationBehavior,
  submitAnnotations,
  undoSubmission,
} from "@/actions/submission";
import { updateActivity } from "@/actions/activity";
import {
  useHint as useHintAction,
  getHintState as getHintStateAction,
} from "@/actions/hints";
import type { HintState, HintContent, GuidedDetectionData } from "@/actions/hints";

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

interface ThinkingBehaviorData {
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
  2: "Phase 2: For each thing you marked, think about WHY they said it. Then submit your work.",
  3: "Phase 3: Compare what you found with your group. Talk about where you agree and disagree. You can update your work.",
  4: "Phase 4: The AI shared what it noticed. Do you agree with its perspective? Talk about it with your class.",
};

interface StudentSessionClientProps {
  sessionId: string;
  studentId: string;
  activePhase: number;
  turns: Turn[];
  personas: Persona[];
  detectionActs: DetectionAct[];
  thinkingBehaviors: ThinkingBehaviorData[];
  initialAnnotations: AnnotationData[];
  scenarioTopic: string;
  scenarioContext: string;
  initialHintState: HintState;
  guidedDetection: GuidedDetectionData | null;
  peerData: {
    groupMembers: GroupMemberInfo[];
    myColor: string;
    peerSnapshots: PeerSnapshotAnnotation[];
    totalGroupAnnotations: number;
  } | null;
  aiData: {
    cards: AIAnnotationCard[];
    normalized: NormalizedAIAnnotation[];
  } | null;
  reflectionActive: boolean;
  reflectionSubmitted: boolean;
}

export default function StudentSessionClient({
  sessionId,
  studentId,
  activePhase: initialPhase,
  turns,
  personas,
  detectionActs,
  thinkingBehaviors,
  initialAnnotations,
  scenarioTopic,
  scenarioContext,
  initialHintState,
  guidedDetection,
  peerData,
  aiData,
  reflectionActive: initialReflectionActive,
  reflectionSubmitted: initialReflectionSubmitted,
}: StudentSessionClientProps) {
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(
    new Set()
  );
  const [annotations, setAnnotations] =
    useState<AnnotationData[]>(initialAnnotations);
  const [editingAnnotation, setEditingAnnotation] =
    useState<AnnotationData | null>(null);

  // Phase state with polling
  const [activePhase, setActivePhase] = useState(initialPhase);
  const [phaseTransitionMessage, setPhaseTransitionMessage] = useState<string | null>(null);

  // Topic context card state
  const [showTopicContext, setShowTopicContext] = useState(true);

  // Guided first annotation (inline guide text)
  const [hasEverSaved, setHasEverSaved] = useState(initialAnnotations.length > 0);

  // Guided first detection scaffold
  const [showGuidedDetection, setShowGuidedDetection] = useState(
    guidedDetection !== null && initialAnnotations.length === 0
  );
  const [guidedDetectionComplete, setGuidedDetectionComplete] = useState(false);
  const [highlightTurnId, setHighlightTurnId] = useState<string | null>(
    guidedDetection && initialAnnotations.length === 0 ? guidedDetection.turnId : null
  );

  // Re-reading nudges
  const [showStuckNudge, setShowStuckNudge] = useState(false);
  const [showDifferentLensNudge, setShowDifferentLensNudge] = useState(false);
  const [stuckNudgeDismissed, setStuckNudgeDismissed] = useState(false);
  const [differentLensNudgeDismissed, setDifferentLensNudgeDismissed] = useState(false);
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveCountAtMountRef = useRef(initialAnnotations.length);

  // Portrait mode tab state
  const [activeTab, setActiveTab] = useState<"read" | "work">("read");

  // Annotation marker animation
  const [lastSavedAnnotationId, setLastSavedAnnotationId] = useState<number | null>(null);

  // Submission state
  const [isSubmitted, setIsSubmitted] = useState(
    initialAnnotations.length > 0 && initialAnnotations.every((a) => a.submitted)
  );

  // Save error state
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hint state
  const [hintState, setHintState] = useState<HintState>(initialHintState);

  // Reflection state
  const [reflectionActive, setReflectionActive] = useState(initialReflectionActive);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(initialReflectionSubmitted);

  const refreshHintState = useCallback(async () => {
    const state = await getHintStateAction(studentId, sessionId);
    setHintState(state);
  }, [studentId, sessionId]);

  const handleUseHint = useCallback(
    async (
      hintType: "location" | "character" | "perspective" | "narrowed",
      target?: string
    ): Promise<HintContent> => {
      const result = await useHintAction(studentId, sessionId, hintType, target);
      return result;
    },
    [studentId, sessionId]
  );

  // Phase polling (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/phase`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.activePhase !== activePhase) {
          const newPhase = data.activePhase;

          if (activePhase === 2 && newPhase === 3 && !isSubmitted) {
            setIsSubmitted(true);
            setAnnotations((prev) =>
              prev.map((a) => ({ ...a, submitted: true }))
            );
            setPhaseTransitionMessage(
              "Your teacher moved to the next phase. Your work has been submitted."
            );
          } else {
            setPhaseTransitionMessage(`Your teacher moved to Phase ${newPhase}`);
          }

          setActivePhase(newPhase);
          setTimeout(() => setPhaseTransitionMessage(null), 3000);
        }
        // Check reflection activation
        if (data.reflectionActive && !reflectionActive) {
          setReflectionActive(true);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionId, activePhase, isSubmitted]);

  // Stuck nudge: 3+ minutes with 0 annotations
  useEffect(() => {
    if (saveCountAtMountRef.current > 0 || activePhase !== 1) return;
    stuckTimerRef.current = setTimeout(() => {
      setShowStuckNudge(true);
    }, 3 * 60 * 1000);
    return () => clearTimeout(stuckTimerRef.current);
  }, [activePhase]);

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

      setActiveTab("work");
    },
    [editingAnnotation]
  );

  const handleAnnotationSelect = useCallback(
    (annotationId: number) => {
      const ann = annotations.find((a) => a.id === annotationId);
      if (ann) {
        setEditingAnnotation(ann);
        setSelectedSentences(new Set());
        setActiveTab("work");
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
      setSaveError(null);
      let result;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await createAnnotation(studentId, sessionId, {
            location: { sentences: data.sentences },
            detectionAct: data.detectionAct,
            description: data.description,
            phaseCreated: activePhase,
          });
          break;
        } catch {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            setSaveError("Couldn't save — check your connection and try again.");
            return;
          }
        }
      }
      if (!result) return;

      const newAnnotation: AnnotationData = {
        id: result.id,
        location: JSON.stringify({ sentences: data.sentences }),
        detectionAct: data.detectionAct,
        description: data.description,
        thinkingBehavior: null,
        behaviorSource: null,
        behaviorOwnWords: null,
        behaviorExplanation: null,
        phaseCreated: activePhase,
        submitted: false,
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
      setSelectedSentences(new Set());
      setLastSavedAnnotationId(result.id);
      setTimeout(() => setLastSavedAnnotationId(null), 1000);

      const isFirstSave = !hasEverSaved;
      setHasEverSaved(true);

      // Guided detection celebration
      if (showGuidedDetection && !guidedDetectionComplete) {
        setGuidedDetectionComplete(true);
        setHighlightTurnId(null);
        // Auto-dismiss after 4 seconds
        setTimeout(() => setShowGuidedDetection(false), 4000);
      }

      if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
      setShowStuckNudge(false);

      if (isFirstSave && !showStuckNudge && !stuckNudgeDismissed) {
        setShowDifferentLensNudge(true);
      }
      if (hasEverSaved) {
        setShowDifferentLensNudge(false);
      }

      setActiveTab("read");
    },
    [studentId, sessionId, activePhase, hasEverSaved, showStuckNudge, stuckNudgeDismissed, showGuidedDetection, guidedDetectionComplete]
  );

  const handleUpdate = useCallback(
    async (
      annotationId: number,
      data: { detectionAct: string; description: string }
    ) => {
      setSaveError(null);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await updateAnnotation(annotationId, data);
          break;
        } catch {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            setSaveError("Couldn't save — check your connection and try again.");
            return;
          }
        }
      }

      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? { ...a, detectionAct: data.detectionAct, description: data.description }
            : a
        )
      );
      setEditingAnnotation(null);
      setActiveTab("read");
    },
    []
  );

  const handleCancel = useCallback(() => {
    setSelectedSentences(new Set());
    setEditingAnnotation(null);
    setActiveTab("read");
  }, []);

  const handleEditAnnotation = useCallback(
    (annotationId: number) => {
      const ann = annotations.find((a) => a.id === annotationId);
      if (ann) {
        setEditingAnnotation(ann);
        setSelectedSentences(new Set());
        setActiveTab("work");
      }
    },
    [annotations]
  );

  // Phase 2 handlers
  const handleSaveBehavior = useCallback(
    async (
      annotationId: number,
      data: {
        thinkingBehavior: string | null;
        behaviorSource: "library" | "own_words";
        behaviorOwnWords: string | null;
        behaviorExplanation: string;
      }
    ) => {
      await updateAnnotationBehavior(annotationId, data);

      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? {
                ...a,
                thinkingBehavior: data.thinkingBehavior,
                behaviorSource: data.behaviorSource,
                behaviorOwnWords: data.behaviorOwnWords,
                behaviorExplanation: data.behaviorExplanation,
              }
            : a
        )
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    await submitAnnotations(studentId, sessionId);
    setAnnotations((prev) => prev.map((a) => ({ ...a, submitted: true })));
    setIsSubmitted(true);
  }, [studentId, sessionId]);

  const handleUndo = useCallback(async () => {
    await undoSubmission(studentId, sessionId);
    setAnnotations((prev) => prev.map((a) => ({ ...a, submitted: false })));
    setIsSubmitted(false);
  }, [studentId, sessionId]);

  // Reflection handler
  const handleReflection = useCallback(
    async (missedInsight: string, nextStrategy: string) => {
      await submitReflection(studentId, sessionId, missedInsight, nextStrategy);
      setReflectionSubmitted(true);
    },
    [studentId, sessionId]
  );

  // Build annotation markers for TranscriptView
  const annotationMarkers = annotations.map((ann) => {
    const location = JSON.parse(ann.location);
    return {
      id: ann.id,
      sentences: location.sentences as string[],
      detectionAct: ann.detectionAct,
      justSaved: ann.id === lastSavedAnnotationId,
    };
  });

  const isFirstAnnotationForm = !hasEverSaved && selectedSentences.size > 0 && !editingAnnotation;

  // Resolve current annotation's flaw pattern for perspective/narrowed hints
  const currentAnnotationFlaw = editingAnnotation?.detectionAct ?? null;

  // Topic context card
  if (showTopicContext) {
    return (
      <div className="student-ui h-screen flex flex-col bg-gray-50">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <h1 className="text-[20px] font-bold text-gray-900">Perspectives</h1>
          <PhaseIndicator currentPhase={activePhase} />
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 space-y-6">
            <h2 className="text-[22px] font-bold text-gray-900">
              About this discussion
            </h2>
            <p className="text-[17px] text-gray-700 leading-relaxed">
              {scenarioContext}
            </p>
            <button
              onClick={() => setShowTopicContext(false)}
              className="w-full py-3.5 bg-indigo-500 text-white font-semibold rounded-xl
                hover:bg-indigo-600 active:scale-[0.97] transition-all text-[17px]"
            >
              Start Reading
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showPhase1 = activePhase === 1;
  const showPhase2 = activePhase === 2;
  const showPhase3Plus = activePhase >= 3;

  // Compute comparison cards for Phase 3+
  const comparisonCards = (() => {
    if (!showPhase3Plus || !peerData) return [];

    const myNormalized: NormalizedAnnotation[] = annotations.map((a) => ({
      id: String(a.id),
      userId: studentId,
      displayName: "You",
      color: peerData.myColor,
      location: JSON.parse(a.location),
      detectionAct: a.detectionAct,
      thinkingBehavior: a.thinkingBehavior,
      behaviorSource: a.behaviorSource as "library" | "own_words" | null,
      behaviorOwnWords: a.behaviorOwnWords,
      behaviorExplanation: a.behaviorExplanation,
      description: a.description,
    }));

    const peerNormalized: NormalizedAnnotation[] = peerData.peerSnapshots.map((p) => ({
      id: `peer-${p.annotationId}`,
      userId: p.userId,
      displayName: p.displayName,
      color: p.color,
      location: JSON.parse(p.location),
      detectionAct: p.detectionAct,
      thinkingBehavior: p.thinkingBehavior,
      behaviorSource: p.behaviorSource as "library" | "own_words" | null,
      behaviorOwnWords: p.behaviorOwnWords,
      behaviorExplanation: p.behaviorExplanation,
      description: p.description,
    }));

    // Include AI annotations in Phase 4
    const aiNormalized: NormalizedAnnotation[] = (activePhase >= 4 && aiData)
      ? aiData.normalized.map((a) => ({
          id: a.id,
          userId: a.userId,
          displayName: a.displayName,
          color: a.color,
          location: JSON.parse(a.location),
          detectionAct: a.detectionAct,
          thinkingBehavior: a.thinkingBehavior,
          behaviorSource: a.behaviorSource as "library" | "own_words" | null,
          behaviorOwnWords: a.behaviorOwnWords,
          behaviorExplanation: a.behaviorExplanation,
          description: a.description,
          isAI: true,
        }))
      : [];

    return compareAnnotations(myNormalized, peerNormalized, aiNormalized, studentId);
  })();

  // Build peer markers for transcript
  const peerTranscriptMarkers = (() => {
    if (!showPhase3Plus || !peerData) return [];
    const markers = peerData.peerSnapshots.map((p) => ({
      id: p.annotationId,
      sentences: JSON.parse(p.location).sentences as string[],
      color: p.color,
      displayName: p.displayName,
    }));
    // Add AI markers in Phase 4 (using diamond-style via color)
    if (activePhase >= 4 && aiData) {
      for (const ai of aiData.normalized) {
        markers.push({
          id: ai.id as unknown as number,
          sentences: JSON.parse(ai.location).sentences as string[],
          color: ai.color,
          displayName: "AI",
        });
      }
    }
    return markers;
  })();

  // Hint panel (shared between Phase 1 and Phase 2)
  const hintPanel = hintState.budgetTotal > 0 ? (
    <HintPanel
      hintState={hintState}
      activePhase={activePhase}
      currentAnnotationFlaw={currentAnnotationFlaw}
      onUseHint={handleUseHint}
      onHintUsed={refreshHintState}
    />
  ) : null;

  return (
    <div className="student-ui h-screen flex flex-col bg-gray-50">
      {/* Phase transition overlay */}
      {phaseTransitionMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 max-w-sm mx-6 text-center pointer-events-auto">
            <p className="text-[17px] font-semibold text-gray-900">
              {phaseTransitionMessage}
            </p>
          </div>
        </div>
      )}

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

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Transcript panel */}
        <div
          className={`
            border-r border-gray-200 bg-gray-50
            max-[1199px]:w-full max-[1199px]:border-r-0
            min-[1200px]:w-[60%]
            ${activeTab !== "read" ? "max-[1199px]:hidden" : ""}
          `}
        >
          <TranscriptView
            turns={turns}
            personas={personas}
            selectedSentences={selectedSentences}
            onSentenceSelect={handleSentenceSelect}
            annotations={annotationMarkers}
            onAnnotationSelect={handleAnnotationSelect}
            highlightTurnId={highlightTurnId}
            peerMarkers={peerTranscriptMarkers}
            myColor={peerData?.myColor}
          />
        </div>

        {/* Work panel */}
        <div
          className={`
            bg-white
            max-[1199px]:w-full
            min-[1200px]:w-[40%]
            ${activeTab !== "work" ? "max-[1199px]:hidden" : ""}
          `}
        >
          {/* Save error banner */}
          {saveError && (
            <div className="mx-5 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <p className="text-[15px] text-red-800 flex-1">{saveError}</p>
              <button
                onClick={() => setSaveError(null)}
                className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
              >
                &times;
              </button>
            </div>
          )}

          {activePhase >= 4 && aiData ? (
            <WorkPanelPhase4
              comparisonCards={comparisonCards}
              aiCards={aiData.cards}
              annotations={annotations}
              detectionActs={detectionActs}
              thinkingBehaviors={thinkingBehaviors}
              turns={turns}
              personas={personas}
              myUserId={studentId}
              onEditAnnotation={handleEditAnnotation}
              onNewAnnotation={() => setActiveTab("read")}
              reflectionActive={reflectionActive}
              onSubmitReflection={handleReflection}
              reflectionSubmitted={reflectionSubmitted}
            />
          ) : showPhase3Plus ? (
            <WorkPanelPhase3
              cards={comparisonCards}
              annotations={annotations}
              detectionActs={detectionActs}
              thinkingBehaviors={thinkingBehaviors}
              turns={turns}
              personas={personas}
              myUserId={studentId}
              onEditAnnotation={handleEditAnnotation}
              onNewAnnotation={() => setActiveTab("read")}
            />
          ) : showPhase2 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <WorkPanelPhase2
                  annotations={annotations}
                  detectionActs={detectionActs}
                  thinkingBehaviors={thinkingBehaviors}
                  turns={turns}
                  personas={personas}
                  onSaveBehavior={handleSaveBehavior}
                  onSubmit={handleSubmit}
                  onUndo={handleUndo}
                  submitted={isSubmitted}
                />
              </div>
              {!isSubmitted && (
                <div className="px-5 pb-4">
                  {hintPanel}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {/* Guided first detection prompt */}
                {showGuidedDetection && !guidedDetectionComplete && annotations.length === 0 && selectedSentences.size === 0 && (
                  <div className="mx-5 mt-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="text-[15px] text-indigo-800 leading-relaxed">
                      Let&apos;s start with turn {guidedDetection!.turnNumber}. Read what{" "}
                      <span className="font-semibold">{guidedDetection!.personaName}</span>{" "}
                      says. Does anything stand out to you?
                    </p>
                    {guidedDetection!.suggestedActQuestion && (
                      <p className="text-sm text-indigo-600 mt-2 italic">
                        Think about this question: {guidedDetection!.suggestedActQuestion}
                      </p>
                    )}
                  </div>
                )}

                {/* Guided detection celebration */}
                {guidedDetectionComplete && showGuidedDetection && (
                  <div className="mx-5 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-[15px] text-green-800 leading-relaxed font-medium">
                      Great catch! Now read the rest of the discussion and see if you
                      notice anything else on your own.
                    </p>
                  </div>
                )}

                {/* Nudges */}
                {showStuckNudge && !stuckNudgeDismissed && (
                  <div className="mx-5 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <p className="text-[15px] text-amber-800 flex-1">
                      Try re-reading the discussion from the beginning. Use one of the questions below as a lens.
                    </p>
                    <button
                      onClick={() => setStuckNudgeDismissed(true)}
                      className="text-amber-400 hover:text-amber-600 text-lg leading-none flex-shrink-0"
                    >
                      &times;
                    </button>
                  </div>
                )}
                {showDifferentLensNudge && !differentLensNudgeDismissed && (
                  <div className="mx-5 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                    <p className="text-[15px] text-green-800 flex-1">
                      Nice work! Now try reading the discussion again with a different question in mind.
                    </p>
                    <button
                      onClick={() => setDifferentLensNudgeDismissed(true)}
                      className="text-green-400 hover:text-green-600 text-lg leading-none flex-shrink-0"
                    >
                      &times;
                    </button>
                  </div>
                )}

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
                  showGuidedFirstAnnotation={isFirstAnnotationForm}
                />
              </div>
              <div className="px-5 pb-4">
                {hintPanel}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar — landscape only */}
      <div className="px-6 py-2.5 bg-white border-t border-gray-200 max-[1199px]:hidden">
        <p className="text-sm text-gray-500">
          {STATUS_MESSAGES[activePhase] ?? ""}
        </p>
      </div>

      {/* Portrait mode: floating tab bar (<1200px) */}
      <div className="min-[1200px]:hidden bg-white border-t border-gray-200 flex">
        <button
          onClick={() => setActiveTab("read")}
          className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors
            ${activeTab === "read"
              ? "text-indigo-600 border-t-2 border-indigo-500"
              : "text-gray-400"
            }`}
        >
          Read
        </button>
        <button
          onClick={() => setActiveTab("work")}
          className={`flex-1 py-3 text-center text-[15px] font-medium transition-colors
            ${activeTab === "work"
              ? "text-indigo-600 border-t-2 border-indigo-500"
              : "text-gray-400"
            }`}
        >
          Work{annotations.length > 0 ? ` (${annotations.length})` : ""}
        </button>
      </div>
    </div>
  );
}
