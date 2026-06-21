import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const email = "demo@dayflow.app";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo",
      passwordHash: hashPassword("dayflow"),
    },
  });

  // Habits
  const habitNames = ["Meditazione", "Movimento", "Lettura", "Acqua"];
  for (let i = 0; i < habitNames.length; i++) {
    const existing = await prisma.habit.findFirst({
      where: { userId: user.id, name: habitNames[i] },
    });
    if (!existing) {
      await prisma.habit.create({
        data: { userId: user.id, name: habitNames[i], sortOrder: i },
      });
    }
  }

  // Routines
  const existingRoutine = await prisma.routine.findFirst({ where: { userId: user.id } });
  if (!existingRoutine) {
    await prisma.routine.createMany({
      data: [
        { userId: user.id, name: "Stretching mattutino", targetSlot: "morning", durationMin: 10, sortOrder: 0 },
        { userId: user.id, name: "Passeggiata", targetSlot: "midday", durationMin: 20, sortOrder: 1 },
        { userId: user.id, name: "Journaling", targetSlot: "evening", durationMin: 10, sortOrder: 2 },
      ],
    });
  }

  // A vision + goal
  const existingVision = await prisma.vision.findFirst({ where: { userId: user.id } });
  if (!existingVision) {
    const vision = await prisma.vision.create({
      data: {
        userId: user.id,
        text: "Vivere con più presenza e costruire qualcosa che conta.",
        area: "Crescita",
        horizon: "3y",
      },
    });
    await prisma.goal.create({
      data: {
        userId: user.id,
        visionId: vision.id,
        title: "Scrivere un libro",
        area: "Creatività",
        horizon: "12m",
        whyDeep: "Voglio lasciare traccia di quello che ho capito.",
        progress: 15,
      },
    });
  }

  console.log("Seed completato. Login demo: demo@dayflow.app / dayflow");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
