import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { hasOverlap } from "@/lib/overlap";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const session = await prisma.classSession.findUnique({
    where: { sessionId },
    include: {
      groups: {
        include: {
          members: {
            include: {
              user: { select: { id: true, displayName: true } },
            },
            orderBy: { id: "asc" },
          },
        },
      },
      phaseTransitions: { orderBy: { transitionedAt: "desc" }, take: 1 },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Load student activities
  const activities = await prisma.studentActivity.findMany({
    where: { sessionId },
  });
  const activityMap = new Map(activities.map((a) => [a.userId, a]));

  // Load annotations for submission status + counts
  const annotations = await prisma.annotation.findMany({
    where: { sessionId },
    select: { userId: true, submitted: true, location: true },
  });

  // Compute per-student data
  const studentAnnotations = new Map<string, typeof annotations>();
  for (const ann of annotations) {
    const existing = studentAnnotations.get(ann.userId) || [];
    existing.push(ann);
    studentAnnotations.set(ann.userId, existing);
  }

  // Load AI annotations for flaw coverage
  const teacherEval = await prisma.teacherEvaluation.findUnique({
    where: { scenarioId: session.scenarioId },
  });

  let aiAnnotationLocations: { pattern: string; sentences: string[] }[] = [];
  if (teacherEval) {
    const evalAnnotations = JSON.parse(teacherEval.annotations) as Array<{
      annotation_id: string;
      location: { sentences: string[] };
      argument_flaw: { pattern: string };
    }>;
    aiAnnotationLocations = evalAnnotations.map((a) => ({
      pattern: a.argument_flaw.pattern,
      sentences: a.location.sentences,
    }));
  }

  // Get facilitation guide timing for "may need help" threshold
  let phaseMinutes: Record<string, number> = {};
  if (teacherEval) {
    const guide = JSON.parse(teacherEval.facilitationGuide);
    phaseMinutes = guide.timing || {};
  }

  const currentPhaseKey = `phase_${session.activePhase}_minutes`;
  const phaseTimeLimit = phaseMinutes[currentPhaseKey] || 10; // default 10 min
  const lastTransition = session.phaseTransitions[0];
  const phaseStartTime = lastTransition?.transitionedAt ?? session.createdAt;
  const elapsedMinutes = (Date.now() - new Date(phaseStartTime).getTime()) / 60000;

  // Build response per group
  const groups = session.groups.map((group) => {
    const members = group.members.map((m) => {
      const activity = activityMap.get(m.userId);
      const anns = studentAnnotations.get(m.userId) || [];
      const annotationCount = anns.length;
      const allSubmitted = anns.length > 0 && anns.every((a) => a.submitted);
      const firstOpened = activity?.firstOpened;

      // Status
      let status: "not_started" | "active" | "submitted" | "may_need_help" = "not_started";
      if (allSubmitted && anns.length > 0) {
        status = "submitted";
      } else if (firstOpened) {
        status = "active";
      }

      // "May need help" check (Phase 1-2 only)
      if (
        session.activePhase <= 2 &&
        status === "active" &&
        !allSubmitted
      ) {
        if (
          (elapsedMinutes > phaseTimeLimit * 0.5 && annotationCount === 0) ||
          (elapsedMinutes > phaseTimeLimit && annotationCount < 2)
        ) {
          status = "may_need_help";
        }
      }

      return {
        userId: m.userId,
        displayName: m.user.displayName,
        status,
        annotationCount,
        submitted: allSubmitted,
        firstOpened: firstOpened?.toISOString() ?? null,
      };
    });

    // Flaw coverage per group
    const groupAnnotations = members.flatMap((m) => {
      const anns = studentAnnotations.get(m.userId) || [];
      return anns.map((a) => ({
        sentences: JSON.parse(a.location).sentences as string[],
      }));
    });

    const flawsFound = aiAnnotationLocations.filter((ai) =>
      groupAnnotations.some((student) =>
        hasOverlap({ sentences: student.sentences }, { sentences: ai.sentences })
      )
    ).length;

    return {
      groupId: group.groupId,
      members,
      flawsFound,
      totalFlaws: aiAnnotationLocations.length,
    };
  });

  // Class-level summary
  const allMembers = groups.flatMap((g) => g.members);
  const totalActive = allMembers.filter((m) => m.status !== "not_started").length;
  const totalSubmitted = allMembers.filter((m) => m.submitted).length;

  return NextResponse.json({
    activePhase: session.activePhase,
    reflectionActive: session.reflectionActive,
    status: session.status,
    groups,
    summary: {
      totalStudents: allMembers.length,
      totalActive,
      totalSubmitted,
      totalFlaws: aiAnnotationLocations.length,
    },
  });
}
