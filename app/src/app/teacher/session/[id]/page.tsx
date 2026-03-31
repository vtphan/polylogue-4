import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import TeacherSessionClient from "./client";

export default async function TeacherSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;

  const session = await prisma.classSession.findUnique({
    where: { sessionId },
    include: { scenario: true },
  });
  if (!session) notFound();

  // Load facilitation guide for cheat sheet summary
  const teacherEval = await prisma.teacherEvaluation.findUnique({
    where: { scenarioId: session.scenarioId },
  });

  let whatToExpect: Array<{
    flaw: string;
    turns: string;
    signal: string;
    difficulty: string;
  }> = [];
  let timing: Record<string, number> = {};

  if (teacherEval) {
    const guide = JSON.parse(teacherEval.facilitationGuide);
    whatToExpect = guide.what_to_expect || [];
    timing = guide.timing || {};
  }

  // Resolve flaw names
  const flawPatterns = await prisma.flawPattern.findMany();
  const flawMap = new Map(flawPatterns.map((f) => [f.patternId, f.plainLanguage]));

  const whatToExpectResolved = whatToExpect.map((w) => ({
    ...w,
    flawName: flawMap.get(w.flaw) ?? w.flaw,
  }));

  return (
    <TeacherSessionClient
      sessionId={sessionId}
      sessionCode={session.sessionCode}
      scenarioTopic={session.scenario.topic}
      discussionArc={session.scenario.discussionArc}
      activePhase={session.activePhase}
      status={session.status}
      reflectionActive={session.reflectionActive}
      whatToExpect={whatToExpectResolved}
      timing={timing}
    />
  );
}
