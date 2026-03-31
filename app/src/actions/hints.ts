"use server";

import { prisma } from "@/lib/db";
import { findUnfoundFlaws } from "@/lib/overlap";

// --- Types for parsed data ---

interface WhatToExpect {
  flaw: string;
  turns: string;
  signal: string;
  difficulty: "most_will_catch" | "harder_to_spot" | "easy_to_miss";
}

interface Phase1Scaffold {
  prompt: string;
  targets: string; // flaw pattern ID
}

interface Phase2Scaffold {
  flaw: string;
  narrowed_options: string[];
  perspective_prompt: string;
}

interface AIAnnotation {
  annotation_id: string;
  location: { turn: string; sentences: string[] };
  argument_flaw: { pattern: string };
}

interface ScenarioPersona {
  persona_id: string;
  name: string;
  role: string;
  strengths: string[];
  weaknesses: string[];
}

interface TranscriptTurn {
  turn_id: string;
  speaker: string;
  sentences: { id: string; text: string }[];
}

// --- Difficulty ordering for hint targeting ---
const DIFFICULTY_ORDER: Record<string, number> = {
  most_will_catch: 0,
  harder_to_spot: 1,
  easy_to_miss: 2,
};

// --- Public actions ---

export interface HintState {
  budgetRemaining: number;
  budgetTotal: number;
  locationRemaining: number;
  characterRemaining: number;
  perspectiveRemaining: number;
  narrowedRemaining: number;
  revealedPersonas: string[]; // persona IDs with persisted character hints
  availablePersonas: { persona_id: string; name: string }[];
}

export async function getHintState(
  userId: string,
  sessionId: string
): Promise<HintState> {
  const session = await prisma.classSession.findUnique({
    where: { sessionId },
  });
  if (!session) throw new Error("Session not found");

  const usages = await prisma.studentHintUsage.findMany({
    where: { userId, sessionId },
  });

  const totalUsed = usages.length;
  const locationUsed = usages.filter((u) => u.hintType === "location").length;
  const characterUsed = new Set(
    usages.filter((u) => u.hintType === "character").map((u) => u.target)
  ).size;
  const perspectiveUsed = usages.filter((u) => u.hintType === "perspective").length;
  const narrowedUsed = usages.filter((u) => u.hintType === "narrowed").length;

  const revealedPersonas = [
    ...new Set(
      usages.filter((u) => u.hintType === "character").map((u) => u.target)
    ),
  ];

  // Get persona list for character hint selection
  const scenario = await prisma.scenario.findUnique({
    where: { scenarioId: session.scenarioId },
  });
  const personas: ScenarioPersona[] = scenario
    ? JSON.parse(scenario.personas)
    : [];

  return {
    budgetRemaining: session.lifelineBudget - totalUsed,
    budgetTotal: session.lifelineBudget,
    locationRemaining: session.locationHintCap - locationUsed,
    characterRemaining: session.characterHintCap - characterUsed,
    perspectiveRemaining: session.perspectiveHintCap - perspectiveUsed,
    narrowedRemaining: session.narrowedHintCap - narrowedUsed,
    revealedPersonas,
    availablePersonas: personas.map((p) => ({
      persona_id: p.persona_id,
      name: p.name,
    })),
  };
}

export interface HintContent {
  type: "location" | "character" | "perspective" | "narrowed";
  content: string;
  // For character hints: structured data for reference card
  characterData?: {
    name: string;
    strengths: string[];
    weaknesses: string[];
  };
  // For narrowed: behavior options
  narrowedOptions?: { name: string; description: string }[];
}

export async function useHint(
  userId: string,
  sessionId: string,
  hintType: "location" | "character" | "perspective" | "narrowed",
  target?: string // persona_id for character/perspective, flaw pattern for narrowed
): Promise<HintContent> {
  const session = await prisma.classSession.findUnique({
    where: { sessionId },
    include: { scenario: true },
  });
  if (!session) throw new Error("Session not found");

  // Validate budget
  const usages = await prisma.studentHintUsage.findMany({
    where: { userId, sessionId },
  });
  const totalUsed = usages.length;
  if (totalUsed >= session.lifelineBudget) {
    throw new Error("No hints remaining");
  }

  // Validate per-type cap
  const typeUsed = usages.filter((u) => u.hintType === hintType);
  const capMap: Record<string, number> = {
    location: session.locationHintCap,
    character: session.characterHintCap,
    perspective: session.perspectiveHintCap,
    narrowed: session.narrowedHintCap,
  };

  if (hintType === "character") {
    // Character caps count unique personas, not total uses
    const uniquePersonas = new Set(typeUsed.map((u) => u.target));
    // Re-reading a revealed persona is free
    if (target && uniquePersonas.has(target)) {
      // Return persisted hint — no cost
      return await resolveCharacterHint(session.scenarioId, target);
    }
    if (uniquePersonas.size >= capMap.character) {
      throw new Error("Character hint cap reached");
    }
  } else {
    if (typeUsed.length >= capMap[hintType]) {
      throw new Error(`${hintType} hint cap reached`);
    }
  }

  // Resolve hint content
  let content: HintContent;
  let resolvedTarget: string;

  switch (hintType) {
    case "location": {
      const result = await resolveLocationHint(userId, sessionId, session.scenarioId);
      content = result.hint;
      resolvedTarget = result.targetFlaw;
      break;
    }
    case "character": {
      if (!target) throw new Error("Persona ID required for character hint");
      content = await resolveCharacterHint(session.scenarioId, target);
      resolvedTarget = target;
      break;
    }
    case "perspective": {
      if (!target) throw new Error("Target required for perspective hint");
      content = await resolvePerspectiveHint(session.scenarioId, target);
      resolvedTarget = target;
      break;
    }
    case "narrowed": {
      if (!target) throw new Error("Flaw pattern required for narrowed hint");
      content = await resolveNarrowedHint(session.scenarioId, target);
      resolvedTarget = target;
      break;
    }
  }

  // Record usage
  await prisma.studentHintUsage.create({
    data: {
      userId,
      sessionId,
      hintType,
      target: resolvedTarget,
    },
  });

  return content;
}

// --- Guided first detection ---

export interface GuidedDetectionData {
  turnId: string;
  turnNumber: number;
  personaName: string;
  suggestedActId: string | null;
  suggestedActQuestion: string | null;
}

export async function getGuidedDetectionData(
  sessionId: string
): Promise<GuidedDetectionData | null> {
  const session = await prisma.classSession.findUnique({
    where: { sessionId },
    include: { scenario: true },
  });
  if (!session || !session.guidedFirstDetection) return null;

  const teacherEval = await prisma.teacherEvaluation.findUnique({
    where: { scenarioId: session.scenarioId },
  });
  if (!teacherEval) return null;

  const facilitationGuide = JSON.parse(teacherEval.facilitationGuide);
  const whatToExpect: WhatToExpect[] = facilitationGuide.what_to_expect;
  const annotations: AIAnnotation[] = JSON.parse(teacherEval.annotations);

  // Find the most_will_catch flaw
  const easiest = whatToExpect.find((w) => w.difficulty === "most_will_catch");
  if (!easiest) return null;

  // Find the AI annotation for this flaw
  const aiAnn = annotations.find(
    (a) => a.argument_flaw.pattern === easiest.flaw
  );
  if (!aiAnn) return null;

  // Resolve the turn and persona
  const transcript = await prisma.transcript.findUnique({
    where: { scenarioId: session.scenarioId },
  });
  if (!transcript) return null;

  const turns: TranscriptTurn[] = JSON.parse(transcript.turns);
  const turnId = aiAnn.location.turn;
  const turn = turns.find((t) => t.turn_id === turnId);

  const personas: ScenarioPersona[] = JSON.parse(session.scenario.personas);
  const persona = turn
    ? personas.find((p) => p.persona_id === turn.speaker)
    : null;

  // Find the detection act for this flaw via phase_1 scaffolds
  const phase1Scaffolds: Phase1Scaffold[] = facilitationGuide.phase_1;
  const scaffold = phase1Scaffolds.find((s) => s.targets === easiest.flaw);

  // Try to resolve detection act ID from the flaw pattern
  const flawPattern = await prisma.flawPattern.findUnique({
    where: { patternId: easiest.flaw },
    include: { detectionAct: true },
  });

  const turnNum = parseInt(turnId.replace("turn_", ""));

  return {
    turnId,
    turnNumber: turnNum,
    personaName: persona?.name ?? "this person",
    suggestedActId: flawPattern?.actId ?? null,
    suggestedActQuestion: flawPattern?.detectionAct.studentQuestion ?? null,
  };
}

// --- Hint resolution helpers ---

async function resolveLocationHint(
  userId: string,
  sessionId: string,
  scenarioId: string
): Promise<{ hint: HintContent; targetFlaw: string }> {
  const teacherEval = await prisma.teacherEvaluation.findUnique({
    where: { scenarioId },
  });
  if (!teacherEval) throw new Error("No evaluation data");

  const facilitationGuide = JSON.parse(teacherEval.facilitationGuide);
  const whatToExpect: WhatToExpect[] = facilitationGuide.what_to_expect;
  const aiAnnotations: AIAnnotation[] = JSON.parse(teacherEval.annotations);
  const phase1Scaffolds: Phase1Scaffold[] = facilitationGuide.phase_1;

  // Get student annotations
  const studentAnns = await prisma.annotation.findMany({
    where: { userId, sessionId },
  });
  const studentLocations = studentAnns.map((a) => JSON.parse(a.location));

  // Build AI annotation lookup
  const aiLookup = aiAnnotations.map((a) => ({
    annotationId: a.annotation_id,
    location: { sentences: a.location.sentences },
    pattern: a.argument_flaw.pattern,
  }));

  // Find unfound flaws
  const unfound = findUnfoundFlaws(studentLocations, aiLookup);

  // Sort by difficulty (most accessible first)
  const unfoundWithDifficulty = unfound.map((u) => {
    const wte = whatToExpect.find((w) => w.flaw === u.pattern);
    return {
      ...u,
      difficulty: wte ? DIFFICULTY_ORDER[wte.difficulty] ?? 99 : 99,
    };
  });
  unfoundWithDifficulty.sort((a, b) => a.difficulty - b.difficulty);

  if (unfoundWithDifficulty.length === 0) {
    return {
      hint: {
        type: "location",
        content:
          "You've found annotations near all the key areas. Try looking more carefully at the ones you've already marked — is there something else going on?",
      },
      targetFlaw: "none",
    };
  }

  const targetFlaw = unfoundWithDifficulty[0];
  const scaffold = phase1Scaffolds.find((s) => s.targets === targetFlaw.pattern);

  return {
    hint: {
      type: "location",
      content: scaffold?.prompt ?? `Look more closely at the sentences around ${targetFlaw.location.sentences[0]}.`,
    },
    targetFlaw: targetFlaw.pattern,
  };
}

async function resolveCharacterHint(
  scenarioId: string,
  personaId: string
): Promise<HintContent> {
  const scenario = await prisma.scenario.findUnique({
    where: { scenarioId },
  });
  if (!scenario) throw new Error("Scenario not found");

  const personas: ScenarioPersona[] = JSON.parse(scenario.personas);
  const persona = personas.find((p) => p.persona_id === personaId);
  if (!persona) throw new Error("Persona not found");

  return {
    type: "character",
    content: `About ${persona.name}:`,
    characterData: {
      name: persona.name,
      strengths: persona.strengths,
      weaknesses: persona.weaknesses,
    },
  };
}

async function resolvePerspectiveHint(
  scenarioId: string,
  flawPattern: string
): Promise<HintContent> {
  const teacherEval = await prisma.teacherEvaluation.findUnique({
    where: { scenarioId },
  });
  if (!teacherEval) throw new Error("No evaluation data");

  const facilitationGuide = JSON.parse(teacherEval.facilitationGuide);
  const phase2Scaffolds: Phase2Scaffold[] = facilitationGuide.phase_2;

  // Resolve persona name from the flaw's AI annotation
  const aiAnnotations: AIAnnotation[] = JSON.parse(teacherEval.annotations);
  const aiAnn = aiAnnotations.find((a) => a.argument_flaw.pattern === flawPattern);

  const transcript = await prisma.transcript.findUnique({
    where: { scenarioId },
  });
  const turns: TranscriptTurn[] = transcript ? JSON.parse(transcript.turns) : [];
  const scenario = await prisma.scenario.findUnique({ where: { scenarioId } });
  const personas: ScenarioPersona[] = scenario ? JSON.parse(scenario.personas) : [];

  let personaName = "this person";

  if (aiAnn) {
    // Primary path: resolve via AI annotation → turn → speaker → persona
    const turnId = aiAnn.location.turn;
    const turn = turnId ? turns.find((t) => t.turn_id === turnId) : null;
    const persona = turn ? personas.find((p) => p.persona_id === turn.speaker) : null;
    if (persona) personaName = persona.name;
  } else {
    // Fallback: parse persona name from what_to_expect[].turns field (e.g., "turn 5 (Mia)")
    const whatToExpect: WhatToExpect[] = facilitationGuide.what_to_expect;
    const wte = whatToExpect.find((w) => w.flaw === flawPattern);
    if (wte) {
      const nameMatch = wte.turns.match(/\(([^)]+)\)/);
      if (nameMatch) {
        const parsedName = nameMatch[1].trim();
        const persona = personas.find((p) => p.name === parsedName);
        if (persona) personaName = persona.name;
        else personaName = parsedName;
      }
    }
  }

  const scaffold = phase2Scaffolds.find((s) => s.flaw === flawPattern);
  if (!scaffold) {
    return {
      type: "perspective",
      content: `Imagine you're ${personaName}. Think about why they might have said what they said.`,
    };
  }

  return {
    type: "perspective",
    content: `Imagine you're ${personaName}. ${scaffold.perspective_prompt}`,
  };
}

async function resolveNarrowedHint(
  scenarioId: string,
  flawPattern: string
): Promise<HintContent> {
  const teacherEval = await prisma.teacherEvaluation.findUnique({
    where: { scenarioId },
  });
  if (!teacherEval) throw new Error("No evaluation data");

  const facilitationGuide = JSON.parse(teacherEval.facilitationGuide);
  const phase2Scaffolds: Phase2Scaffold[] = facilitationGuide.phase_2;
  const scaffold = phase2Scaffolds.find((s) => s.flaw === flawPattern);

  if (!scaffold) {
    return {
      type: "narrowed",
      content: "Try looking at the thinking behavior options more carefully.",
      narrowedOptions: [],
    };
  }

  // Resolve behavior names from library
  const behaviors = await prisma.thinkingBehavior.findMany({
    where: { behaviorId: { in: scaffold.narrowed_options } },
  });

  return {
    type: "narrowed",
    content:
      "Here are some thinking habits that could explain what you noticed. Which one fits best?",
    narrowedOptions: behaviors.map((b) => ({
      name: b.name,
      description: b.description,
    })),
  };
}
