"use server";

import { prisma } from "@/lib/db";

// Group member colors (from globals.css --color-member-*)
const MEMBER_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#22c55e", // green
];

export interface GroupMemberInfo {
  userId: string;
  displayName: string;
  color: string;
}

export interface PeerSnapshotAnnotation {
  annotationId: number;
  userId: string;
  displayName: string;
  color: string;
  location: string; // JSON
  detectionAct: string | null;
  description: string | null;
  thinkingBehavior: string | null;
  behaviorSource: string | null;
  behaviorOwnWords: string | null;
  behaviorExplanation: string | null;
}

/**
 * Load peer annotation snapshots for Phase 3 comparison.
 * Returns group members with colors and their snapshot data.
 */
export async function getPeerComparisonData(
  userId: string,
  sessionId: string
): Promise<{
  groupMembers: GroupMemberInfo[];
  myColor: string;
  peerSnapshots: PeerSnapshotAnnotation[];
  totalGroupAnnotations: number;
}> {
  // Find the student's group
  const membership = await prisma.groupMember.findFirst({
    where: { userId },
    include: {
      group: {
        include: {
          members: {
            include: { user: true },
            orderBy: { id: "asc" },
          },
        },
      },
    },
  });

  if (!membership) {
    return {
      groupMembers: [],
      myColor: MEMBER_COLORS[0],
      peerSnapshots: [],
      totalGroupAnnotations: 0,
    };
  }

  // Filter to members in this session's group
  const group = membership.group;
  const members = group.members;

  // Assign colors by position
  const groupMembers: GroupMemberInfo[] = members.map((m, i) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
  }));

  const myMember = groupMembers.find((m) => m.userId === userId);
  const myColor = myMember?.color ?? MEMBER_COLORS[0];

  // Load Phase 3 snapshots for all group members except current student
  const peerUserIds = groupMembers
    .filter((m) => m.userId !== userId)
    .map((m) => m.userId);

  const snapshots = await prisma.annotationSnapshot.findMany({
    where: {
      sessionId,
      snapshotPhase: 3,
      annotation: {
        userId: { in: peerUserIds },
      },
    },
    include: {
      annotation: {
        select: { userId: true, id: true },
      },
    },
  });

  const peerSnapshots: PeerSnapshotAnnotation[] = snapshots.map((snap) => {
    const data = JSON.parse(snap.snapshotData);
    const member = groupMembers.find((m) => m.userId === snap.annotation.userId);

    return {
      annotationId: snap.annotation.id,
      userId: snap.annotation.userId,
      displayName: member?.displayName ?? "Unknown",
      color: member?.color ?? MEMBER_COLORS[0],
      location: JSON.stringify({ sentences: JSON.parse(data.location ?? "{}").sentences ?? [] }),
      detectionAct: data.detectionAct,
      description: data.description,
      thinkingBehavior: data.thinkingBehavior,
      behaviorSource: data.behaviorSource,
      behaviorOwnWords: data.behaviorOwnWords,
      behaviorExplanation: data.behaviorExplanation,
    };
  });

  // Total group annotations (including own)
  const ownCount = await prisma.annotation.count({
    where: { userId, sessionId },
  });
  const totalGroupAnnotations = ownCount + peerSnapshots.length;

  return {
    groupMembers,
    myColor,
    peerSnapshots,
    totalGroupAnnotations,
  };
}
