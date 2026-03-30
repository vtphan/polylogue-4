"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createAnnotation(
  userId: string,
  sessionId: string,
  data: {
    location: { sentences: string[] };
    detectionAct: string;
    description: string;
    phaseCreated: number;
  }
) {
  const annotation = await prisma.annotation.create({
    data: {
      userId,
      sessionId,
      phaseCreated: data.phaseCreated,
      location: JSON.stringify(data.location),
      detectionAct: data.detectionAct,
      description: data.description,
      submitted: false,
      revisionHistory: "[]",
    },
  });

  // Update annotation count
  await prisma.studentActivity.updateMany({
    where: { userId, sessionId },
    data: {
      annotationCount: { increment: 1 },
      lastActive: new Date(),
    },
  });

  revalidatePath(`/student/session/${sessionId}`);
  return annotation;
}

export async function updateAnnotation(
  annotationId: number,
  data: {
    detectionAct?: string;
    description?: string;
    thinkingBehavior?: string | null;
    behaviorSource?: string | null;
    behaviorOwnWords?: string | null;
    behaviorExplanation?: string | null;
    submitted?: boolean;
  }
) {
  // Get current state for revision history
  const current = await prisma.annotation.findUnique({
    where: { id: annotationId },
  });
  if (!current) throw new Error("Annotation not found");

  // Build revision entry
  const revisionHistory = JSON.parse(current.revisionHistory);
  revisionHistory.push({
    timestamp: new Date().toISOString(),
    previous: {
      detectionAct: current.detectionAct,
      description: current.description,
      thinkingBehavior: current.thinkingBehavior,
      behaviorSource: current.behaviorSource,
      behaviorOwnWords: current.behaviorOwnWords,
      behaviorExplanation: current.behaviorExplanation,
    },
  });

  const annotation = await prisma.annotation.update({
    where: { id: annotationId },
    data: {
      ...data,
      revisionHistory: JSON.stringify(revisionHistory),
    },
  });

  // Update last active
  await prisma.studentActivity.updateMany({
    where: { userId: current.userId, sessionId: current.sessionId },
    data: { lastActive: new Date() },
  });

  revalidatePath(`/student/session/${current.sessionId}`);
  return annotation;
}

export async function deleteAnnotation(annotationId: number) {
  const annotation = await prisma.annotation.findUnique({
    where: { id: annotationId },
  });
  if (!annotation) throw new Error("Annotation not found");

  await prisma.annotation.delete({ where: { id: annotationId } });

  await prisma.studentActivity.updateMany({
    where: { userId: annotation.userId, sessionId: annotation.sessionId },
    data: {
      annotationCount: { decrement: 1 },
      lastActive: new Date(),
    },
  });

  revalidatePath(`/student/session/${annotation.sessionId}`);
}

export async function getAnnotations(userId: string, sessionId: string) {
  return prisma.annotation.findMany({
    where: { userId, sessionId },
    orderBy: { createdAt: "asc" },
  });
}
