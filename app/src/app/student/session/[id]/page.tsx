import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import StudentSessionClient from "./client";
import { getHintState, getGuidedDetectionData } from "@/actions/hints";
import { getPeerComparisonData } from "@/actions/comparison";
import { getAIAnnotations } from "@/actions/ai-annotations";

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

  // Load thinking behaviors
  const thinkingBehaviors = await prisma.thinkingBehavior.findMany({
    orderBy: { behaviorId: "asc" },
  });

  // Get student from cookie (set during join) or fall back to test student for dev
  const cookieStore = await cookies();
  const studentCookie = cookieStore.get("student-session")?.value;

  let student;
  if (studentCookie && studentCookie !== "test") {
    student = await prisma.user.findUnique({ where: { id: studentCookie } });
  }
  if (!student) {
    // Fall back to test student for dev
    student = await prisma.user.findFirst({ where: { username: "test.student" } });
  }
  if (!student) notFound();
  const testStudent = student;

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

  // Map thinking behaviors to component format (exclude formal_term — teacher only)
  const behaviors = thinkingBehaviors.map((b) => ({
    behaviorId: b.behaviorId,
    name: b.name,
    description: b.description,
  }));

  // Map annotations to component format (include all fields for Phase 2)
  const annotationData = annotations.map((ann) => ({
    id: ann.id,
    location: ann.location,
    detectionAct: ann.detectionAct,
    description: ann.description,
    thinkingBehavior: ann.thinkingBehavior,
    behaviorSource: ann.behaviorSource,
    behaviorOwnWords: ann.behaviorOwnWords,
    behaviorExplanation: ann.behaviorExplanation,
    phaseCreated: ann.phaseCreated,
    submitted: ann.submitted,
  }));

  // Load hint state and guided detection data
  const initialHintState = await getHintState(testStudent.id, sessionId);
  const guidedDetection = await getGuidedDetectionData(sessionId);

  // Load peer comparison data (for Phase 3+)
  const peerData = session.activePhase >= 3
    ? await getPeerComparisonData(testStudent.id, sessionId)
    : null;

  // Load AI annotations (for Phase 4)
  const aiData = session.activePhase >= 4
    ? await getAIAnnotations(session.scenarioId)
    : null;

  // Check if reflection already submitted
  const existingReflection = await prisma.studentReflection.findUnique({
    where: { userId_sessionId: { userId: testStudent.id, sessionId } },
  });

  return (
    <StudentSessionClient
      sessionId={sessionId}
      studentId={testStudent.id}
      activePhase={session.activePhase}
      turns={turns}
      personas={personas}
      detectionActs={acts}
      thinkingBehaviors={behaviors}
      initialAnnotations={annotationData}
      scenarioTopic={session.scenario.topic}
      scenarioContext={session.scenario.context}
      initialHintState={initialHintState}
      guidedDetection={guidedDetection}
      peerData={peerData}
      aiData={aiData}
      reflectionActive={session.reflectionActive}
      reflectionSubmitted={existingReflection?.submittedAt != null}
    />
  );
}
