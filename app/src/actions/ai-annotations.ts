"use server";

import { prisma } from "@/lib/db";

export interface AIAnnotationCard {
  annotationId: string;
  location: { turn: string; sentences: string[] };
  argumentFlaw: {
    pattern: string;
    patternName: string; // resolved from FlawPattern
    detectionAct: string;
    detectionActName: string; // resolved from DetectionAct
    explanation: string;
  };
  thinkingBehavior: {
    pattern: string;
    patternName: string; // resolved from ThinkingBehavior
    explanation: string;
  };
}

export interface NormalizedAIAnnotation {
  id: string;
  userId: string;
  displayName: string;
  color: string;
  location: string; // JSON
  detectionAct: string | null;
  description: string | null;
  thinkingBehavior: string | null;
  behaviorSource: string;
  behaviorOwnWords: string | null;
  behaviorExplanation: string | null;
  isAI: boolean;
}

const AI_COLOR = "#8b5cf6"; // violet (--color-ai)

export async function getAIAnnotations(
  scenarioId: string
): Promise<{
  cards: AIAnnotationCard[];
  normalized: NormalizedAIAnnotation[];
}> {
  const aiAnnotations = await prisma.aIAnnotation.findMany({
    where: { scenarioId },
  });

  // Load lookup tables
  const flawPatterns = await prisma.flawPattern.findMany({
    include: { detectionAct: true },
  });
  const behaviors = await prisma.thinkingBehavior.findMany();

  const flawMap = new Map(flawPatterns.map((f) => [f.patternId, f]));
  const behaviorMap = new Map(behaviors.map((b) => [b.behaviorId, b]));

  const cards: AIAnnotationCard[] = [];
  const normalized: NormalizedAIAnnotation[] = [];

  for (const aiAnn of aiAnnotations) {
    const data = {
      location: JSON.parse(aiAnn.location),
      argumentFlaw: JSON.parse(aiAnn.argumentFlaw),
      thinkingBehavior: JSON.parse(aiAnn.thinkingBehavior),
    };

    const flaw = flawMap.get(data.argumentFlaw.pattern);
    const behavior = behaviorMap.get(data.thinkingBehavior.pattern);

    cards.push({
      annotationId: aiAnn.annotationId,
      location: data.location,
      argumentFlaw: {
        pattern: data.argumentFlaw.pattern,
        patternName: flaw?.plainLanguage ?? data.argumentFlaw.pattern,
        detectionAct: data.argumentFlaw.detection_act,
        detectionActName: flaw?.detectionAct.name ?? data.argumentFlaw.detection_act,
        explanation: data.argumentFlaw.explanation,
      },
      thinkingBehavior: {
        pattern: data.thinkingBehavior.pattern,
        patternName: behavior?.name ?? data.thinkingBehavior.pattern,
        explanation: data.thinkingBehavior.explanation,
      },
    });

    normalized.push({
      id: `ai-${aiAnn.annotationId}`,
      userId: "ai",
      displayName: "AI",
      color: AI_COLOR,
      location: JSON.stringify({ sentences: data.location.sentences }),
      detectionAct: data.argumentFlaw.detection_act,
      description: data.argumentFlaw.explanation,
      thinkingBehavior: data.thinkingBehavior.pattern,
      behaviorSource: "library",
      behaviorOwnWords: null,
      behaviorExplanation: data.thinkingBehavior.explanation,
      isAI: true,
    });
  }

  return { cards, normalized };
}
