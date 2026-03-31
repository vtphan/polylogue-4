import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { name, password } = await request.json();

  if (!name || !password) {
    return NextResponse.json({ error: "Name and password required." }, { status: 400 });
  }

  // Find user by display name (case-insensitive)
  const users = await prisma.user.findMany({
    where: { role: { in: ["teacher", "researcher"] } },
  });

  const user = users.find(
    (u) => u.displayName.toLowerCase() === name.trim().toLowerCase()
  );

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid name or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid name or password." }, { status: 401 });
  }

  // Set a simple auth cookie
  const response = NextResponse.json({
    success: true,
    userId: user.id,
    role: user.role,
    displayName: user.displayName,
  });

  response.cookies.set("teacher-session", user.id, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: "lax",
  });

  return response;
}
