import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const session = await prisma.classSession.findUnique({
    where: { sessionId },
    select: { activePhase: true, reflectionActive: true, status: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    activePhase: session.activePhase,
    reflectionActive: session.reflectionActive,
    status: session.status,
  });
}
