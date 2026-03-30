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

function deriveUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".");
}

export async function seedUsers(prisma: PrismaClient) {
  const client = prisma;

  const seedPath = path.join(process.cwd(), "seed.yaml");
  if (!fs.existsSync(seedPath)) {
    console.log("No seed.yaml found, skipping user seeding.");
    return;
  }

  const data = yaml.load(fs.readFileSync(seedPath, "utf-8")) as {
    users: SeedUser[];
  };

  for (const user of data.users) {
    const username = deriveUsername(user.name);
    const passwordHash = await bcrypt.hash(user.password, 10);

    await client.user.upsert({
      where: { username },
      update: {
        displayName: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        displayName: user.name,
        username,
        passwordHash,
        role: user.role,
      },
    });

    console.log(`  Seeded user: ${user.name} (${user.role})`);
  }
}
