import "dotenv/config";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { seedUsers } from "../scripts/seed-users";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./perspectives.db",
});
const prisma = new PrismaClient({ adapter });

async function importReferenceLibraries() {
  const libPath = process.env.REFERENCE_LIBRARIES_PATH;
  if (!libPath) throw new Error("REFERENCE_LIBRARIES_PATH not set");

  // Detection act library
  const actData = yaml.load(
    fs.readFileSync(path.join(libPath, "detection_act_library.yaml"), "utf-8")
  ) as { detection_acts: Array<Record<string, unknown>> };

  for (const act of actData.detection_acts) {
    await prisma.detectionAct.upsert({
      where: { actId: act.act_id as string },
      update: {
        name: act.name as string,
        studentQuestion: act.student_question as string,
        readingStrategyHint: act.reading_strategy_hint as string,
      },
      create: {
        actId: act.act_id as string,
        name: act.name as string,
        studentQuestion: act.student_question as string,
        readingStrategyHint: act.reading_strategy_hint as string,
      },
    });

    const patterns = act.patterns as Array<Record<string, string>>;
    for (const pattern of patterns) {
      await prisma.flawPattern.upsert({
        where: { patternId: pattern.pattern_id },
        update: {
          plainLanguage: pattern.plain_language,
          description: pattern.description,
          actId: act.act_id as string,
        },
        create: {
          patternId: pattern.pattern_id,
          plainLanguage: pattern.plain_language,
          description: pattern.description,
          actId: act.act_id as string,
        },
      });
    }
  }

  // Thinking behavior library
  const behaviorData = yaml.load(
    fs.readFileSync(
      path.join(libPath, "thinking_behavior_library.yaml"),
      "utf-8"
    )
  ) as { thinking_behaviors: Array<Record<string, string>> };

  for (const b of behaviorData.thinking_behaviors) {
    await prisma.thinkingBehavior.upsert({
      where: { behaviorId: b.behavior_id },
      update: {
        name: b.name,
        description: b.description,
        formalTerm: b.formal_term,
      },
      create: {
        behaviorId: b.behavior_id,
        name: b.name,
        description: b.description,
        formalTerm: b.formal_term,
      },
    });
  }
}

async function importScenario(scenarioId: string) {
  const registryPath = process.env.REGISTRY_PATH!;
  const dir = path.join(registryPath, scenarioId);

  const scenarioData = yaml.load(
    fs.readFileSync(path.join(dir, "scenario.yaml"), "utf-8")
  ) as Record<string, unknown>;

  const scriptData = yaml.load(
    fs.readFileSync(path.join(dir, "script.yaml"), "utf-8")
  ) as Record<string, unknown>;

  const evalData = yaml.load(
    fs.readFileSync(path.join(dir, "evaluation.yaml"), "utf-8")
  ) as Record<string, unknown>;

  const evalStudentData = yaml.load(
    fs.readFileSync(path.join(dir, "evaluation_student.yaml"), "utf-8")
  ) as Record<string, unknown>;

  // Scenario
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

  // Transcript
  const scriptPersonas = (
    scriptData.personas as Array<Record<string, string>>
  ).map((p) => ({ persona_id: p.persona_id, name: p.name, role: p.role }));

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

  // AI Annotations (delete + recreate)
  await prisma.aIAnnotation.deleteMany({ where: { scenarioId } });
  const annotations = evalStudentData.annotations as Array<
    Record<string, unknown>
  >;
  for (const ann of annotations) {
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

  // Teacher Evaluation
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

  // Pedagogical Review (optional)
  const pedPath = path.join(dir, "pedagogical_review.yaml");
  if (fs.existsSync(pedPath)) {
    const pedData = yaml.load(
      fs.readFileSync(pedPath, "utf-8")
    ) as Record<string, unknown>;

    await prisma.pedagogicalReview.upsert({
      where: { scenarioId },
      update: {
        overallScore: pedData.overall_score as number,
        explanation: pedData.explanation as string,
        revisionStrategy: (pedData.revision_strategy as string) ?? null,
        flawAssessments: JSON.stringify(pedData.flaw_assessments),
      },
      create: {
        scenarioId,
        overallScore: pedData.overall_score as number,
        explanation: pedData.explanation as string,
        revisionStrategy: (pedData.revision_strategy as string) ?? null,
        flawAssessments: JSON.stringify(pedData.flaw_assessments),
      },
    });
  }
}

async function main() {
  await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL;");
  console.log("WAL mode enabled.");

  console.log("\nSeeding users...");
  await seedUsers(prisma);

  console.log("\nImporting reference libraries...");
  await importReferenceLibraries();

  const actCount = await prisma.detectionAct.count();
  const patternCount = await prisma.flawPattern.count();
  const behaviorCount = await prisma.thinkingBehavior.count();
  console.log(
    `  ${actCount} detection acts, ${patternCount} flaw patterns, ${behaviorCount} thinking behaviors`
  );

  const registryPath = process.env.REGISTRY_PATH;
  if (registryPath && fs.existsSync(registryPath)) {
    console.log("\nImporting scenarios...");
    const dirs = fs
      .readdirSync(registryPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const id of dirs) {
      try {
        await importScenario(id);
        console.log(`  Imported: ${id}`);
      } catch (e) {
        console.warn(`  Skipped ${id}:`, (e as Error).message);
      }
    }
  }

  const scenarioCount = await prisma.scenario.count();
  console.log(`\nDone. ${scenarioCount} scenarios in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
