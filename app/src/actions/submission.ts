"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitAnnotations(userId: string, sessionId: string) {
  await prisma.annotation.updateMany({
    where: { userId, sessionId, submitted: false },
    data: { submitted: true },
  });

  revalidatePath(`/student/session/${sessionId}`);
}

export async function undoSubmission(userId: string, sessionId: string) {
  await prisma.annotation.updateMany({
    where: { userId, sessionId, submitted: true },
    data: { submitted: false },
  });

  revalidatePath(`/student/session/${sessionId}`);
}

export async function forceSubmitAll(sessionId: string) {
  await prisma.annotation.updateMany({
    where: { sessionId, submitted: false },
    data: { submitted: true },
  });

  revalidatePath(`/student/session/${sessionId}`);
}

export async function takeSnapshot(sessionId: string, snapshotPhase: number) {
  const annotations = await prisma.annotation.findMany({
    where: { sessionId, submitted: true },
  });

  for (const ann of annotations) {
    await prisma.annotationSnapshot.create({
      data: {
        annotationId: ann.id,
        sessionId,
        snapshotPhase,
        snapshotData: JSON.stringify({
          location: ann.location,
          detectionAct: ann.detectionAct,
          description: ann.description,
          thinkingBehavior: ann.thinkingBehavior,
          behaviorSource: ann.behaviorSource,
          behaviorOwnWords: ann.behaviorOwnWords,
          behaviorExplanation: ann.behaviorExplanation,
        }),
      },
    });
  }
}

/**
 * Advance the session to the next phase. Handles force-submit and snapshot at phase boundaries.
 * Called by the teacher dashboard when advancing phases.
 */
export async function advancePhase(sessionId: string) {
  const session = await prisma.classSession.findUnique({
    where: { sessionId },
  });
  if (!session) throw new Error("Session not found");

  const fromPhase = session.activePhase;
  const toPhase = fromPhase + 1;
  if (toPhase > 4) throw new Error("Already at final phase");

  // Phase 2→3: force-submit all unsubmitted annotations, then snapshot
  if (fromPhase === 2) {
    await forceSubmitAll(sessionId);
    await takeSnapshot(sessionId, 3);
  }

  // Phase 3→4: snapshot current state before AI reveal
  if (fromPhase === 3) {
    await takeSnapshot(sessionId, 4);
  }

  // Update session phase
  await prisma.classSession.update({
    where: { sessionId },
    data: { activePhase: toPhase },
  });

  // Record phase transition
  await prisma.phaseTransition.create({
    data: {
      sessionId,
      fromPhase,
      toPhase,
    },
  });

  revalidatePath(`/student/session/${sessionId}`);
}

export async function updateAnnotationBehavior(
  annotationId: number,
  data: {
    thinkingBehavior: string | null;
    behaviorSource: "library" | "own_words";
    behaviorOwnWords: string | null;
    behaviorExplanation: string;
  }
) {
  const current = await prisma.annotation.findUnique({
    where: { id: annotationId },
  });
  if (!current) throw new Error("Annotation not found");

  const revisionHistory = JSON.parse(current.revisionHistory);
  revisionHistory.push({
    timestamp: new Date().toISOString(),
    previous: {
      thinkingBehavior: current.thinkingBehavior,
      behaviorSource: current.behaviorSource,
      behaviorOwnWords: current.behaviorOwnWords,
      behaviorExplanation: current.behaviorExplanation,
    },
  });

  await prisma.annotation.update({
    where: { id: annotationId },
    data: {
      thinkingBehavior: data.thinkingBehavior,
      behaviorSource: data.behaviorSource,
      behaviorOwnWords: data.behaviorOwnWords,
      behaviorExplanation: data.behaviorExplanation,
      revisionHistory: JSON.stringify(revisionHistory),
    },
  });

  await prisma.studentActivity.updateMany({
    where: { userId: current.userId, sessionId: current.sessionId },
    data: { lastActive: new Date() },
  });

  revalidatePath(`/student/session/${current.sessionId}`);
}
