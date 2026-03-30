"use server";

import { prisma } from "@/lib/db";

export async function updateActivity(userId: string, sessionId: string) {
  const now = new Date();

  await prisma.studentActivity.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    update: { lastActive: now },
    create: {
      userId,
      sessionId,
      firstOpened: now,
      lastActive: now,
      annotationCount: 0,
    },
  });
}

export async function recordFirstOpen(userId: string, sessionId: string) {
  const now = new Date();

  await prisma.studentActivity.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    update: {
      firstOpened: now,
      lastActive: now,
    },
    create: {
      userId,
      sessionId,
      firstOpened: now,
      lastActive: now,
      annotationCount: 0,
    },
  });
}
