"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateSessionCode, deriveUsername } from "@/lib/utils";

export async function endSession(sessionId: string) {
  await prisma.classSession.update({
    where: { sessionId },
    data: { status: "archived" },
  });
  revalidatePath("/teacher");
  revalidatePath(`/teacher/session/${sessionId}`);
}

export async function activateReflection(sessionId: string) {
  await prisma.classSession.update({
    where: { sessionId },
    data: { reflectionActive: true },
  });
  revalidatePath(`/teacher/session/${sessionId}`);
}

export async function getTeacherSessions(teacherId: string) {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  // Auto-archive old sessions
  await prisma.classSession.updateMany({
    where: {
      teacherId,
      status: "active",
      createdAt: { lt: twoHoursAgo },
    },
    data: { status: "archived" },
  });

  const sessions = await prisma.classSession.findMany({
    where: { teacherId },
    include: {
      scenario: { select: { topic: true, discussionArc: true } },
      _count: { select: { activities: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((s) => ({
    sessionId: s.sessionId,
    sessionCode: s.sessionCode,
    scenarioId: s.scenarioId,
    topic: s.scenario.topic,
    discussionArc: s.scenario.discussionArc,
    activePhase: s.activePhase,
    status: s.status,
    studentCount: s._count.activities,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function createSession(
  teacherId: string,
  scenarioId: string,
  config: {
    lifelineBudget: number;
    locationHintCap: number;
    characterHintCap: number;
    perspectiveHintCap: number;
    narrowedHintCap: number;
    guidedFirstDetection: boolean;
  },
  groups: { name: string; students: string[] }[]
) {
  // Generate unique session code
  let sessionCode = generateSessionCode();
  while (await prisma.classSession.findUnique({ where: { sessionCode } })) {
    sessionCode = generateSessionCode();
  }

  // Validate no duplicate student names across session
  const allNames = groups.flatMap((g) => g.students.map((s) => s.trim().toLowerCase()));
  const uniqueNames = new Set(allNames);
  if (uniqueNames.size !== allNames.length) {
    throw new Error("Duplicate student names found. Each name must be unique within the session.");
  }

  // Create session
  const session = await prisma.classSession.create({
    data: {
      scenarioId,
      teacherId,
      sessionCode,
      ...config,
    },
  });

  // Create students, groups, and memberships
  for (const group of groups) {
    const dbGroup = await prisma.group.create({
      data: {
        groupId: `${session.sessionId}-${group.name}`,
        sessionId: session.sessionId,
      },
    });

    for (const studentName of group.students) {
      const trimmed = studentName.trim();
      if (!trimmed) continue;

      const username = deriveUsername(trimmed);

      // Upsert student user
      const student = await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          displayName: trimmed,
          username,
          role: "student",
        },
      });

      // Create group membership
      await prisma.groupMember.create({
        data: {
          userId: student.id,
          groupId: dbGroup.groupId,
        },
      });

      // Create student activity record
      await prisma.studentActivity.create({
        data: {
          userId: student.id,
          sessionId: session.sessionId,
        },
      });
    }
  }

  revalidatePath("/teacher");
  return session;
}

export async function getAvailableScenarios() {
  const scenarios = await prisma.scenario.findMany({
    orderBy: { scenarioId: "asc" },
  });

  // Load pedagogical reviews
  const reviews = await prisma.pedagogicalReview.findMany();
  const reviewMap = new Map(reviews.map((r) => [r.scenarioId, r]));

  // Count flaws per scenario
  const evaluations = await prisma.teacherEvaluation.findMany({
    select: { scenarioId: true, annotations: true },
  });

  return scenarios.map((s) => {
    const review = reviewMap.get(s.scenarioId);
    const eval_ = evaluations.find((e) => e.scenarioId === s.scenarioId);
    const flawCount = eval_
      ? (JSON.parse(eval_.annotations) as unknown[]).length
      : 0;
    const personas = JSON.parse(s.personas) as unknown[];

    return {
      scenarioId: s.scenarioId,
      topic: s.topic,
      discussionArc: s.discussionArc,
      flawCount,
      personaCount: personas.length,
      overallScore: review?.overallScore ?? null,
    };
  });
}
