import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./print-button";

interface WhatToExpect {
  flaw: string;
  turns: string;
  signal: string;
  difficulty: string;
}

interface Phase1Scaffold {
  prompt: string;
  targets: string;
}

interface Phase2Scaffold {
  flaw: string;
  narrowed_options: string[];
  perspective_prompt: string;
}

interface Phase4Scaffold {
  type: string;
  prompt: string;
}

interface FlawAssessment {
  flaw_pattern: string;
  expression_quality: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  most_will_catch: "bg-green-100 text-green-800",
  harder_to_spot: "bg-amber-100 text-amber-800",
  easy_to_miss: "bg-red-100 text-red-800",
};

export default async function CheatSheetPage({
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

  const teacherEval = await prisma.teacherEvaluation.findUnique({
    where: { scenarioId: session.scenarioId },
  });
  if (!teacherEval) notFound();

  const guide = JSON.parse(teacherEval.facilitationGuide);
  const evalAnnotations = JSON.parse(teacherEval.annotations) as Array<{
    argument_flaw: { pattern: string };
    thinking_behavior: { plausible_alternatives?: string[] };
  }>;

  const timing = guide.timing || {};
  const whatToExpect: WhatToExpect[] = guide.what_to_expect || [];
  const phase1: Phase1Scaffold[] = guide.phase_1 || [];
  const phase2: Phase2Scaffold[] = guide.phase_2 || [];
  const phase4: Phase4Scaffold[] = guide.phase_4 || [];

  // Load pedagogical review
  const pedReview = await prisma.pedagogicalReview.findUnique({
    where: { scenarioId: session.scenarioId },
  });
  const flawAssessments: FlawAssessment[] = pedReview
    ? (JSON.parse(pedReview.flawAssessments) as FlawAssessment[])
    : [];

  // Resolve names
  const flawPatterns = await prisma.flawPattern.findMany();
  const flawMap = new Map(flawPatterns.map((f) => [f.patternId, f.plainLanguage]));

  const behaviors = await prisma.thinkingBehavior.findMany();
  const behaviorMap = new Map(behaviors.map((b) => [b.behaviorId, b.name]));

  // Build plausible alternatives lookup by flaw pattern
  const altsByFlaw = new Map<string, string[]>();
  for (const ann of evalAnnotations) {
    const alts = ann.thinking_behavior.plausible_alternatives;
    if (alts && alts.length > 0) {
      altsByFlaw.set(ann.argument_flaw.pattern, alts);
    }
  }

  return (
    <div className="teacher-ui min-h-screen bg-white max-w-3xl mx-auto px-8 py-6 print:px-4 print:py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/teacher/session/${sessionId}`}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to Session
        </Link>
        <PrintButton />
      </div>

      <h1 className="text-[18px] font-bold text-gray-900 mb-1">
        Facilitation Cheat Sheet
      </h1>
      <p className="text-sm text-gray-500 mb-6">{session.scenario.topic}</p>

      {/* TIMING */}
      <section className="mb-6">
        <h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wide mb-2">
          Timing
        </h2>
        <div className="flex gap-4 text-sm text-gray-600">
          {Object.entries(timing).map(([key, val]) => (
            <span key={key}>
              {key.replace(/_/g, " ").replace("minutes", "min")}: ~{val as number}m
            </span>
          ))}
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="mb-6">
        <h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wide mb-2">
          What to Expect
        </h2>
        <div className="space-y-3">
          {whatToExpect.map((w) => (
            <div key={w.flaw} className="border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {flawMap.get(w.flaw) ?? w.flaw}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[w.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                  {w.difficulty.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-xs text-gray-500">{w.turns}</div>
              <div className="text-xs text-gray-600 mt-1">{w.signal}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY THIS FLAW WORKS */}
      {flawAssessments.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wide mb-2">
            Why These Flaws Work
          </h2>
          <div className="space-y-2">
            {flawAssessments.map((fa) => (
              <details key={fa.flaw_pattern} className="border border-gray-200 rounded-lg">
                <summary className="px-3 py-2 text-sm font-medium text-gray-800 cursor-pointer hover:bg-gray-50">
                  {flawMap.get(fa.flaw_pattern) ?? fa.flaw_pattern}
                </summary>
                <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-600">
                  {fa.expression_quality}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* PHASE 1 */}
      <section className="mb-6">
        <h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wide mb-2">
          Phase 1 Scaffolds
        </h2>
        <div className="space-y-2">
          {phase1.map((s, i) => (
            <div key={i} className="border border-gray-200 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400 mb-1">
                Targets: {flawMap.get(s.targets) ?? s.targets}
              </div>
              <p className="text-sm text-gray-800 italic">&ldquo;{s.prompt}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* PHASE 2 */}
      <section className="mb-6">
        <h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wide mb-2">
          Phase 2 Scaffolds
        </h2>
        <div className="space-y-3">
          {phase2.map((s) => {
            const alts = altsByFlaw.get(s.flaw);
            return (
              <div key={s.flaw} className="border border-gray-200 rounded-lg px-3 py-2 space-y-2">
                <div className="text-xs text-gray-400">
                  Flaw: {flawMap.get(s.flaw) ?? s.flaw}
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Narrowed options:</div>
                  <div className="text-sm text-gray-700">
                    {s.narrowed_options.map((o) => behaviorMap.get(o) ?? o).join(", ")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Perspective prompt:</div>
                  <p className="text-sm text-gray-800 italic">&ldquo;{s.perspective_prompt}&rdquo;</p>
                </div>
                {alts && alts.length > 0 && (
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-1.5">
                    Also defensible: {alts.map((a) => behaviorMap.get(a) ?? a).join(", ")}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* PHASE 3 — hardcoded */}
      <section className="mb-6">
        <h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wide mb-2">
          Phase 3 Scaffolds
        </h2>
        <div className="space-y-2">
          <div className="border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-sm text-gray-800 italic">
              &ldquo;Did you all mark the same turns? Look at where you differ.&rdquo;
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-sm text-gray-800 italic">
              &ldquo;Someone in your group found something you missed. Take another look.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* PHASE 4 */}
      {phase4.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[14px] font-bold text-gray-700 uppercase tracking-wide mb-2">
            Phase 4 Scaffolds
          </h2>
          <div className="space-y-2">
            {phase4.map((s, i) => (
              <div key={i} className="border border-gray-200 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-400 mb-1">
                  Type: {s.type}
                </div>
                <p className="text-sm text-gray-800 italic">&ldquo;{s.prompt}&rdquo;</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
