import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import StudentSessionClient from "./client";

interface Params {
  id: string;
}

export default async function StudentSessionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id: sessionId } = await params;

  // Load session with scenario
  const session = await prisma.classSession.findUnique({
    where: { sessionId },
    include: { scenario: true },
  });
  if (!session) notFound();

  // Load transcript
  const transcript = await prisma.transcript.findUnique({
    where: { scenarioId: session.scenarioId },
  });
  if (!transcript) notFound();

  // Load detection acts with patterns
  const detectionActs = await prisma.detectionAct.findMany({
    include: { patterns: true },
    orderBy: { actId: "asc" },
  });

  // Load test student (for dev — will be replaced with auth)
  const testStudent = await prisma.user.findFirst({
    where: { username: "test.student" },
  });
  if (!testStudent) notFound();

  // Load annotations
  const annotations = await prisma.annotation.findMany({
    where: { userId: testStudent.id, sessionId },
    orderBy: { createdAt: "asc" },
  });

  // Parse transcript data
  const turns = JSON.parse(transcript.turns) as Array<{
    turn_id: string;
    speaker: string;
    sentences: Array<{ id: string; text: string }>;
  }>;
  const personas = JSON.parse(transcript.personas) as Array<{
    persona_id: string;
    name: string;
    role: string;
  }>;

  // Map detection acts to component format
  const acts = detectionActs.map((act) => ({
    actId: act.actId,
    name: act.name,
    studentQuestion: act.studentQuestion,
    readingStrategyHint: act.readingStrategyHint,
    patterns: act.patterns.map((p) => ({
      patternId: p.patternId,
      plainLanguage: p.plainLanguage,
      description: p.description,
    })),
  }));

  // Map annotations to component format
  const annotationData = annotations.map((ann) => ({
    id: ann.id,
    location: ann.location,
    detectionAct: ann.detectionAct,
    description: ann.description,
    phaseCreated: ann.phaseCreated,
  }));

  return (
    <StudentSessionClient
      sessionId={sessionId}
      studentId={testStudent.id}
      activePhase={session.activePhase}
      turns={turns}
      personas={personas}
      detectionActs={acts}
      initialAnnotations={annotationData}
      scenarioTopic={session.scenario.topic}
    />
  );
}
