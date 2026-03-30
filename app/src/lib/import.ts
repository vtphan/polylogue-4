import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { prisma } from "./db";

type ImportResult =
  | { success: true; scenarioId: string }
  | { success: false; errors: string[] };

// ---------------------------------------------------------------------------
// Reference Libraries (one-time seed)
// ---------------------------------------------------------------------------

export async function importReferenceLibraries(): Promise<ImportResult> {
  const libPath = process.env.REFERENCE_LIBRARIES_PATH;
  if (!libPath) {
    return { success: false, errors: ["REFERENCE_LIBRARIES_PATH not set"] };
  }

  const errors: string[] = [];

  // Detection act library
  const actFile = path.join(libPath, "detection_act_library.yaml");
  if (!fs.existsSync(actFile)) {
    errors.push(`Missing: ${actFile}`);
  }

  // Thinking behavior library
  const behaviorFile = path.join(libPath, "thinking_behavior_library.yaml");
  if (!fs.existsSync(behaviorFile)) {
    errors.push(`Missing: ${behaviorFile}`);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Parse detection act library
  const actData = yaml.load(fs.readFileSync(actFile, "utf-8")) as {
    detection_acts: Array<{
      act_id: string;
      name: string;
      student_question: string;
      reading_strategy_hint: string;
      patterns: Array<{
        pattern_id: string;
        plain_language: string;
        description: string;
      }>;
    }>;
  };

  for (const act of actData.detection_acts) {
    await prisma.detectionAct.upsert({
      where: { actId: act.act_id },
      update: {
        name: act.name,
        studentQuestion: act.student_question,
        readingStrategyHint: act.reading_strategy_hint,
      },
      create: {
        actId: act.act_id,
        name: act.name,
        studentQuestion: act.student_question,
        readingStrategyHint: act.reading_strategy_hint,
      },
    });

    for (const pattern of act.patterns) {
      await prisma.flawPattern.upsert({
        where: { patternId: pattern.pattern_id },
        update: {
          plainLanguage: pattern.plain_language,
          description: pattern.description,
          actId: act.act_id,
        },
        create: {
          patternId: pattern.pattern_id,
          plainLanguage: pattern.plain_language,
          description: pattern.description,
          actId: act.act_id,
        },
      });
    }
  }

  // Parse thinking behavior library
  const behaviorData = yaml.load(fs.readFileSync(behaviorFile, "utf-8")) as {
    thinking_behaviors: Array<{
      behavior_id: string;
      name: string;
      description: string;
      formal_term: string;
    }>;
  };

  for (const behavior of behaviorData.thinking_behaviors) {
    await prisma.thinkingBehavior.upsert({
      where: { behaviorId: behavior.behavior_id },
      update: {
        name: behavior.name,
        description: behavior.description,
        formalTerm: behavior.formal_term,
      },
      create: {
        behaviorId: behavior.behavior_id,
        name: behavior.name,
        description: behavior.description,
        formalTerm: behavior.formal_term,
      },
    });
  }

  return { success: true, scenarioId: "reference_libraries" };
}

// ---------------------------------------------------------------------------
// Scenario Import (per-scenario)
// ---------------------------------------------------------------------------

export async function importScenario(
  scenarioId: string
): Promise<ImportResult> {
  const registryPath = process.env.REGISTRY_PATH;
  if (!registryPath) {
    return { success: false, errors: ["REGISTRY_PATH not set"] };
  }

  const scenarioDir = path.join(registryPath, scenarioId);
  if (!fs.existsSync(scenarioDir)) {
    return {
      success: false,
      errors: [`Scenario directory not found: ${scenarioDir}`],
    };
  }

  const errors: string[] = [];

  // Required files
  const requiredFiles = [
    "scenario.yaml",
    "script.yaml",
    "evaluation.yaml",
    "evaluation_student.yaml",
  ];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(scenarioDir, file))) {
      errors.push(`Missing required file: ${file}`);
    }
  }
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Parse all files
  const scenarioData = yaml.load(
    fs.readFileSync(path.join(scenarioDir, "scenario.yaml"), "utf-8")
  ) as Record<string, unknown>;

  const scriptData = yaml.load(
    fs.readFileSync(path.join(scenarioDir, "script.yaml"), "utf-8")
  ) as Record<string, unknown>;

  const evalData = yaml.load(
    fs.readFileSync(path.join(scenarioDir, "evaluation.yaml"), "utf-8")
  ) as Record<string, unknown>;

  const evalStudentData = yaml.load(
    fs.readFileSync(
      path.join(scenarioDir, "evaluation_student.yaml"),
      "utf-8"
    )
  ) as Record<string, unknown>;

  // Optional: pedagogical review
  const pedReviewPath = path.join(scenarioDir, "pedagogical_review.yaml");
  const hasPedReview = fs.existsSync(pedReviewPath);
  const pedReviewData = hasPedReview
    ? (yaml.load(
        fs.readFileSync(pedReviewPath, "utf-8")
      ) as Record<string, unknown>)
    : null;

  // Upsert scenario
  await prisma.scenario.upsert({
    where: { scenarioId },
    update: {
      topic: scenarioData.topic as string,
      context: scenarioData.context as string,
      discussionArc: scenarioData.discussion_arc as string,
      instructionalGoals: JSON.stringify(scenarioData.instructional_goals),
      personas: JSON.stringify(scenarioData.personas),
      targetFlaws: JSON.stringify(scenarioData.target_flaws),
      turnOutline: JSON.stringify(scenarioData.turn_outline),
    },
    create: {
      scenarioId,
      topic: scenarioData.topic as string,
      context: scenarioData.context as string,
      discussionArc: scenarioData.discussion_arc as string,
      instructionalGoals: JSON.stringify(scenarioData.instructional_goals),
      personas: JSON.stringify(scenarioData.personas),
      targetFlaws: JSON.stringify(scenarioData.target_flaws),
      turnOutline: JSON.stringify(scenarioData.turn_outline),
    },
  });

  // Upsert transcript
  const scriptPersonas = (scriptData.personas as Array<Record<string, unknown>>).map(
    (p) => ({ persona_id: p.persona_id, name: p.name, role: p.role })
  );

  await prisma.transcript.upsert({
    where: { scenarioId },
    update: {
      personas: JSON.stringify(scriptPersonas),
      turns: JSON.stringify(scriptData.turns),
    },
    create: {
      scenarioId,
      personas: JSON.stringify(scriptPersonas),
      turns: JSON.stringify(scriptData.turns),
    },
  });

  // Delete existing AI annotations for this scenario, then recreate
  await prisma.aIAnnotation.deleteMany({ where: { scenarioId } });

  const studentAnnotations = evalStudentData.annotations as Array<
    Record<string, unknown>
  >;
  for (const ann of studentAnnotations) {
    const annotationId = `${scenarioId}__${ann.annotation_id as string}`;
    await prisma.aIAnnotation.create({
      data: {
        annotationId,
        scenarioId,
        location: JSON.stringify(ann.location),
        argumentFlaw: JSON.stringify(ann.argument_flaw),
        thinkingBehavior: JSON.stringify(ann.thinking_behavior),
      },
    });
  }

  // Upsert teacher evaluation
  await prisma.teacherEvaluation.upsert({
    where: { scenarioId },
    update: {
      annotations: JSON.stringify(evalData.annotations),
      summary: JSON.stringify(evalData.summary),
      qualityAssessment: JSON.stringify(evalData.quality_assessment),
      facilitationGuide: JSON.stringify(evalData.facilitation_guide),
    },
    create: {
      scenarioId,
      annotations: JSON.stringify(evalData.annotations),
      summary: JSON.stringify(evalData.summary),
      qualityAssessment: JSON.stringify(evalData.quality_assessment),
      facilitationGuide: JSON.stringify(evalData.facilitation_guide),
    },
  });

  // Upsert pedagogical review (optional)
  if (pedReviewData) {
    await prisma.pedagogicalReview.upsert({
      where: { scenarioId },
      update: {
        overallScore: pedReviewData.overall_score as number,
        explanation: pedReviewData.explanation as string,
        revisionStrategy: (pedReviewData.revision_strategy as string) ?? null,
        flawAssessments: JSON.stringify(pedReviewData.flaw_assessments),
      },
      create: {
        scenarioId,
        overallScore: pedReviewData.overall_score as number,
        explanation: pedReviewData.explanation as string,
        revisionStrategy: (pedReviewData.revision_strategy as string) ?? null,
        flawAssessments: JSON.stringify(pedReviewData.flaw_assessments),
      },
    });
  }

  return { success: true, scenarioId };
}

// ---------------------------------------------------------------------------
// List Unimported Scenarios
// ---------------------------------------------------------------------------

export async function listUnimportedScenarios(): Promise<string[]> {
  const registryPath = process.env.REGISTRY_PATH;
  if (!registryPath || !fs.existsSync(registryPath)) {
    return [];
  }

  const allDirs = fs
    .readdirSync(registryPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const imported = await prisma.scenario.findMany({
    select: { scenarioId: true },
  });
  const importedIds = new Set(imported.map((s) => s.scenarioId));

  return allDirs.filter((d) => !importedIds.has(d));
}
