// Seed minimo: abitudini di default (configurabili poi dall'app).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const habits = ["Movimento", "Lettura"];
  for (const [i, name] of habits.entries()) {
    const exists = await prisma.habit.findFirst({ where: { name } });
    if (!exists) {
      await prisma.habit.create({ data: { name, sortOrder: i } });
    }
  }
  console.log("Seed completato: abitudini default pronte.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
