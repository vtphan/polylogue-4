"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("teacher-session")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireTeacher() {
  const user = await getAuthUser();
  if (!user || (user.role !== "teacher" && user.role !== "researcher")) {
    redirect("/auth/login");
  }
  return user;
}

export async function requireResearcher() {
  const user = await getAuthUser();
  if (!user || user.role !== "researcher") {
    redirect("/auth/login");
  }
  return user;
}
