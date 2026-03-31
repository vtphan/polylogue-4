/**
 * Three-level comparison algorithm for Phase 3 peer comparison and Phase 4 AI reveal.
 * Groups annotations by location overlap, compares detection acts, then thinking behaviors.
 */

import { hasOverlap } from "./overlap";

export interface NormalizedAnnotation {
  id: string; // annotation ID or snapshot ID
  userId: string;
  displayName: string;
  color: string;
  location: { sentences: string[] };
  detectionAct: string | null;
  thinkingBehavior: string | null;
  behaviorSource: "library" | "own_words" | null;
  behaviorOwnWords: string | null;
  behaviorExplanation: string | null;
  description: string | null;
  isAI?: boolean;
}

export type ComparisonType =
  | "full_agreement"
  | "partial_agreement"
  | "disagreement"
  | "unique_yours"
  | "unique_peer"
  | "unique_ai";

export interface ComparisonCard {
  type: ComparisonType;
  location: { sentences: string[] }; // merged sentence set
  annotations: NormalizedAnnotation[];
  prompt: string;
}

/**
 * Run the three-level comparison algorithm.
 * @param myAnnotations - Current student's annotations
 * @param peerAnnotations - All peer annotations (flattened)
 * @param aiAnnotations - AI annotations (Phase 4 only, optional)
 * @param myUserId - Current student's user ID
 */
export function compareAnnotations(
  myAnnotations: NormalizedAnnotation[],
  peerAnnotations: NormalizedAnnotation[],
  aiAnnotations: NormalizedAnnotation[] = [],
  myUserId: string
): ComparisonCard[] {
  const all = [...myAnnotations, ...peerAnnotations, ...aiAnnotations];
  const cards: ComparisonCard[] = [];
  const used = new Set<string>(); // track annotation IDs that have been grouped

  // Step 1: Find overlapping groups
  for (let i = 0; i < all.length; i++) {
    if (used.has(all[i].id)) continue;

    const group = [all[i]];
    used.add(all[i].id);

    for (let j = i + 1; j < all.length; j++) {
      if (used.has(all[j].id)) continue;
      // Check if this annotation overlaps with any in the group
      if (group.some((g) => hasOverlap(g.location, all[j].location))) {
        group.push(all[j]);
        used.add(all[j].id);
      }
    }

    // Merge location sentences
    const mergedSentences = [
      ...new Set(group.flatMap((a) => a.location.sentences)),
    ].sort();

    const isMine = group.some((a) => a.userId === myUserId && !a.isAI);
    const hasPeers = group.some((a) => a.userId !== myUserId && !a.isAI);
    const hasAI = group.some((a) => a.isAI);

    if (group.length === 1) {
      // Unique annotation
      const ann = group[0];
      if (ann.isAI) {
        cards.push({
          type: "unique_ai",
          location: { sentences: mergedSentences },
          annotations: group,
          prompt:
            "The AI noticed something here that nobody in your group caught. What do you think?",
        });
      } else if (ann.userId === myUserId) {
        cards.push({
          type: "unique_yours",
          location: { sentences: mergedSentences },
          annotations: group,
          prompt:
            "Nobody else in your group marked this. Tell them what you noticed.",
        });
      } else {
        cards.push({
          type: "unique_peer",
          location: { sentences: mergedSentences },
          annotations: group,
          prompt: `${ann.displayName} noticed something here that you didn't. Ask them about it!`,
        });
      }
      continue;
    }

    // Multiple annotations overlap — compare detection acts
    const actIds = new Set(group.map((a) => a.detectionAct).filter(Boolean));

    if (actIds.size <= 1) {
      // Same detection act (or all null) — check thinking behaviors
      const behaviorIds = new Set(
        group.map((a) => a.thinkingBehavior).filter(Boolean)
      );
      const hasOwnWords = group.some((a) => a.behaviorSource === "own_words");

      if (behaviorIds.size <= 1 && !hasOwnWords) {
        // Full agreement
        cards.push({
          type: "full_agreement",
          location: { sentences: mergedSentences },
          annotations: group,
          prompt: "You all noticed the same thing for the same reason!",
        });
      } else {
        // Partial agreement — same detection act, different behaviors
        cards.push({
          type: "partial_agreement",
          location: { sentences: mergedSentences },
          annotations: group,
          prompt:
            "You agree something's wrong, but you think it happened for different reasons. Talk about it!",
        });
      }
    } else {
      // Different detection acts — disagreement
      cards.push({
        type: "disagreement",
        location: { sentences: mergedSentences },
        annotations: group,
        prompt:
          "You marked the same spot but see different problems. Why?",
      });
    }
  }

  // Sort: agreements first, then disagreements, then unique
  const typeOrder: Record<ComparisonType, number> = {
    full_agreement: 0,
    partial_agreement: 1,
    disagreement: 2,
    unique_yours: 3,
    unique_peer: 4,
    unique_ai: 5,
  };
  cards.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return cards;
}
