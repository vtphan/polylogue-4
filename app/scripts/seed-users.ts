import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";

interface SeedUser {
  name: string;
  password: string;
  role: "teacher" | "researcher";
}

interface SeedClass {
  name: string;
  teacher: string;
  students: string[];
}

interface SeedData {
  users: SeedUser[];
  classes?: SeedClass[];
}

function deriveUsername(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

function loadSeedData(): SeedData | null {
  const seedPath = path.join(process.cwd(), "seed.yaml");
  if (!fs.existsSync(seedPath)) return null;
  return yaml.load(fs.readFileSync(seedPath, "utf-8")) as SeedData;
}

/** Seed researchers, teachers, classes, and students. */
export async function seedUsers(prisma: PrismaClient) {
  const data = loadSeedData();
  if (!data) {
    console.log("No seed.yaml found, skipping user seeding.");
    return;
  }

  // Seed researchers first
  const researchers = data.users.filter((u) => u.role === "researcher");
  let researcherId: string | null = null;

  for (const user of researchers) {
    const username = deriveUsername(user.name);
    const passwordHash = await bcrypt.hash(user.password, 10);

    const dbUser = await prisma.user.upsert({
      where: { username },
      update: { displayName: user.name, passwordHash, role: user.role },
      create: {
        displayName: user.name,
        username,
        passwordHash,
        role: user.role,
      },
    });

    if (!researcherId) researcherId = dbUser.id;
    console.log(`  Seeded user: ${user.name} (${user.role})`);
  }

  // Seed teachers (createdBy the first researcher)
  for (const user of data.users.filter((u) => u.role === "teacher")) {
    const username = deriveUsername(user.name);
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { username },
      update: { displayName: user.name, passwordHash, role: user.role },
      create: {
        displayName: user.name,
        username,
        passwordHash,
        role: user.role,
        createdById: researcherId,
      },
    });

    console.log(`  Seeded user: ${user.name} (${user.role})`);
  }

  // Seed classes with students
  if (!data.classes) return;

  for (const cls of data.classes) {
    const teacher = await prisma.user.findFirst({
      where: { displayName: cls.teacher, role: "teacher" },
    });
    if (!teacher) {
      console.warn(`  Skipped class "${cls.name}": teacher "${cls.teacher}" not found`);
      continue;
    }

    // Create or find the Class record
    let dbClass = await prisma.class.findUnique({
      where: { name_teacherId: { name: cls.name, teacherId: teacher.id } },
    });
    if (!dbClass) {
      dbClass = await prisma.class.create({
        data: { name: cls.name, teacherId: teacher.id },
      });
    }

    // Create students and enroll in class
    for (const studentName of cls.students) {
      const username = deriveUsername(studentName);
      const student = await prisma.user.upsert({
        where: { username },
        update: { displayName: studentName },
        create: {
          displayName: studentName,
          username,
          role: "student",
          createdById: teacher.id,
        },
      });

      await prisma.classStudent.upsert({
        where: { classId_userId: { classId: dbClass.id, userId: student.id } },
        update: {},
        create: { classId: dbClass.id, userId: student.id },
      });
    }

    console.log(`  Seeded class "${cls.name}": ${cls.students.length} students`);
  }
}
