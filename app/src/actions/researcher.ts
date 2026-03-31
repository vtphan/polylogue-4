"use server";

import { prisma } from "@/lib/db";
import { requireResearcher } from "@/lib/session";
import { deriveUsername } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getTeachers() {
  await requireResearcher();

  const teachers = await prisma.user.findMany({
    where: { role: "teacher" },
    select: {
      id: true,
      displayName: true,
      username: true,
      createdAt: true,
      ownedClasses: { select: { id: true } },
      taughtSessions: { select: { sessionId: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return teachers.map((t) => ({
    id: t.id,
    displayName: t.displayName,
    username: t.username,
    classCount: t.ownedClasses.length,
    activeSessionCount: t.taughtSessions.filter((s) => s.status === "active").length,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function createTeacher(name: string, password: string) {
  const researcher = await requireResearcher();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required.");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");

  const username = deriveUsername(trimmed);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new Error(`A user with username "${username}" already exists.`);

  const passwordHash = await bcrypt.hash(password, 10);

  const teacher = await prisma.user.create({
    data: {
      displayName: trimmed,
      username,
      passwordHash,
      role: "teacher",
      createdById: researcher.id,
    },
  });

  revalidatePath("/researcher/teachers");
  return { id: teacher.id, displayName: teacher.displayName, username: teacher.username };
}

export async function resetTeacherPassword(teacherId: string, newPassword: string) {
  await requireResearcher();

  if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters.");

  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "teacher") throw new Error("Teacher not found.");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: teacherId },
    data: { passwordHash },
  });

  revalidatePath("/researcher/teachers");
  return { ok: true, displayName: teacher.displayName };
}
