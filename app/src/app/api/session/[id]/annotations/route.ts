import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const annotations = await prisma.annotation.findMany({
    where: { sessionId, userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      location: true,
      detectionAct: true,
      description: true,
      thinkingBehavior: true,
      behaviorSource: true,
      behaviorOwnWords: true,
      submitted: true,
      phaseCreated: true,
    },
  });

  return NextResponse.json({ annotations });
}
