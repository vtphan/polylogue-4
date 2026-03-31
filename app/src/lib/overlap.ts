/**
 * Sentence overlap detection between student and AI annotations.
 * Used by: hint system (unfound flaw targeting), Phase 5 (comparison), Phase 7 (teacher flaw coverage).
 */

interface AnnotationLocation {
  sentences: string[];
}

/**
 * Check if two annotations overlap by sentence ID.
 * Returns true if at least one sentence ID appears in both locations.
 */
export function hasOverlap(a: AnnotationLocation, b: AnnotationLocation): boolean {
  const setA = new Set(a.sentences);
  return b.sentences.some((s) => setA.has(s));
}

/**
 * Given a set of student annotations and AI annotations,
 * determine which AI annotations have NOT been found by the student.
 * "Found" = at least one sentence ID overlap between a student annotation and the AI annotation.
 */
export function findUnfoundFlaws(
  studentAnnotations: AnnotationLocation[],
  aiAnnotations: { annotationId: string; location: AnnotationLocation; pattern: string }[]
): { annotationId: string; location: AnnotationLocation; pattern: string }[] {
  return aiAnnotations.filter((ai) =>
    !studentAnnotations.some((student) => hasOverlap(student, ai.location))
  );
}
