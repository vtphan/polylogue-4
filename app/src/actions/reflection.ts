"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitReflection(
  userId: string,
  sessionId: string,
  missedInsight: string,
  nextStrategy: string
) {
  await prisma.studentReflection.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    update: {
      missedInsight: missedInsight || null,
      nextStrategy: nextStrategy || null,
      submittedAt: new Date(),
    },
    create: {
      userId,
      sessionId,
      missedInsight: missedInsight || null,
      nextStrategy: nextStrategy || null,
      submittedAt: new Date(),
    },
  });

  revalidatePath(`/student/session/${sessionId}`);
}
