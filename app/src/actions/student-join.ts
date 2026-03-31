"use server";

import { prisma } from "@/lib/db";

export interface JoinResult {
  success: boolean;
  sessionId?: string;
  studentId?: string;
  error?: string;
}

export async function joinSession(
  sessionCode: string,
  fullName: string
): Promise<JoinResult> {
  const code = sessionCode.trim().toUpperCase();
  const name = fullName.trim();

  if (!code || !name) {
    return { success: false, error: "Please enter both a session code and your name." };
  }

  // Find active session by code
  const session = await prisma.classSession.findUnique({
    where: { sessionCode: code },
  });

  if (!session) {
    return { success: false, error: "That session code doesn't exist. Check with your teacher." };
  }

  if (session.status !== "active") {
    return { success: false, error: "That session has ended." };
  }

  // Find student by name (case-insensitive) who is a group member in this session
  const groupMembers = await prisma.groupMember.findMany({
    where: {
      group: { sessionId: session.sessionId },
    },
    include: {
      user: true,
    },
  });

  const match = groupMembers.find(
    (gm) => gm.user.displayName.toLowerCase() === name.toLowerCase()
  );

  if (!match) {
    return {
      success: false,
      error: "We don't see that name in this session. Check with your teacher.",
    };
  }

  // Update first_opened if not set
  await prisma.studentActivity.upsert({
    where: {
      userId_sessionId: { userId: match.userId, sessionId: session.sessionId },
    },
    update: {
      firstOpened: undefined, // don't overwrite if already set
      lastActive: new Date(),
    },
    create: {
      userId: match.userId,
      sessionId: session.sessionId,
      firstOpened: new Date(),
      lastActive: new Date(),
    },
  });

  // Set first_opened if null
  const activity = await prisma.studentActivity.findUnique({
    where: {
      userId_sessionId: { userId: match.userId, sessionId: session.sessionId },
    },
  });
  if (activity && !activity.firstOpened) {
    await prisma.studentActivity.update({
      where: { id: activity.id },
      data: { firstOpened: new Date() },
    });
  }

  return {
    success: true,
    sessionId: session.sessionId,
    studentId: match.userId,
  };
}
