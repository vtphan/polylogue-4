"use server";

import { prisma } from "@/lib/db";
import { requireTeacher } from "@/lib/session";
import { deriveUsername } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function ensureStudent(name: string, createdById: string): Promise<string> {
  const username = deriveUsername(name);
  const user = await prisma.user.upsert({
    where: { username },
    update: { displayName: name },
    create: {
      displayName: name,
      username,
      role: "student",
      createdById,
    },
  });
  return user.id;
}

export async function createClass(name: string, studentNames: string[]) {
  const teacher = await requireTeacher();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Class name is required.");

  // Check for duplicate class name for this teacher
  const existing = await prisma.class.findUnique({
    where: { name_teacherId: { name: trimmed, teacherId: teacher.id } },
  });
  if (existing) throw new Error(`You already have a class named "${trimmed}".`);

  const cls = await prisma.class.create({
    data: { name: trimmed, teacherId: teacher.id },
  });

  // Create students and enroll
  const names = studentNames.filter((n) => n.trim());
  for (const studentName of names) {
    const studentId = await ensureStudent(studentName.trim(), teacher.id);
    await prisma.classStudent.create({
      data: { classId: cls.id, userId: studentId },
    }).catch(() => {
      // Ignore duplicate enrollment
    });
  }

  revalidatePath("/teacher");
  return { id: cls.id, name: cls.name };
}

export async function addStudentsToClass(classId: string, studentNames: string[]) {
  const teacher = await requireTeacher();

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
  });
  if (!cls) throw new Error("Class not found.");

  const names = studentNames.filter((n) => n.trim());
  let added = 0;
  for (const studentName of names) {
    const studentId = await ensureStudent(studentName.trim(), teacher.id);
    try {
      await prisma.classStudent.create({
        data: { classId, userId: studentId },
      });
      added++;
    } catch {
      // Already enrolled
    }
  }

  revalidatePath(`/teacher/classes/${classId}`);
  return { added };
}

export async function removeStudentFromClass(classId: string, userId: string) {
  const teacher = await requireTeacher();

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
  });
  if (!cls) throw new Error("Class not found.");

  await prisma.classStudent.delete({
    where: { classId_userId: { classId, userId } },
  });

  revalidatePath(`/teacher/classes/${classId}`);
  return { ok: true };
}

export async function getClassesForTeacher() {
  const teacher = await requireTeacher();

  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id },
    include: {
      _count: { select: { students: true, sessions: true } },
      sessions: {
        where: { status: "active" },
        select: { sessionId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    studentCount: c._count.students,
    sessionCount: c._count.sessions,
    activeSessionCount: c.sessions.length,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function getClassDetail(classId: string) {
  const teacher = await requireTeacher();

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
    include: {
      students: {
        include: { user: { select: { id: true, displayName: true, username: true } } },
        orderBy: { user: { displayName: "asc" } },
      },
      sessions: {
        include: {
          scenario: { select: { topic: true, discussionArc: true } },
          _count: { select: { activities: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) throw new Error("Class not found.");

  return {
    id: cls.id,
    name: cls.name,
    students: cls.students.map((cs) => ({
      id: cs.user.id,
      displayName: cs.user.displayName,
      username: cs.user.username,
    })),
    sessions: cls.sessions.map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      topic: s.scenario.topic,
      discussionArc: s.scenario.discussionArc,
      activePhase: s.activePhase,
      status: s.status,
      studentCount: s._count.activities,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}
