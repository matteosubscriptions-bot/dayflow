// Seed di sviluppo: utente demo + progetti + note di esempio con tag,
// così l'app si presenta come nelle schermate di riferimento.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const email = "demo@filo.app";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "Demo", passwordHash: hashPassword("filo") },
    });
  }

  const existing = await prisma.note.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log("Seed: note già presenti, salto.");
    return;
  }

  const brandProject = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Brand e contenuti",
      description: "Idee di comunicazione, serie di post, tono di voce.",
    },
  });
  const personalProject = await prisma.project.create({
    data: {
      userId: user.id,
      name: "Riflessioni personali",
      description: "Osservazioni su di me, energie, dinamiche ricorrenti.",
    },
  });

  const tagNames = ["ESEMPIO", "CLIENTI", "CONTENUTI", "METODO"];
  const tags = {};
  for (const name of tagNames) {
    tags[name] = await prisma.tag.create({ data: { userId: user.id, name } });
  }

  const notes = [
    {
      title: "Benvenuto in Filo",
      transcript:
        "Questa è una nota di esempio. Filo raccoglie le tue idee a voce o per iscritto, le trascrive e ti aiuta a rielaborarle: riassunti, punti chiave, todo, contenuti pronti da pubblicare. Prova a premere Registra da qualsiasi schermata.",
      tags: ["ESEMPIO"],
      project: null,
      status: "READY",
    },
    {
      title: "Idee per una serie di contenuti",
      transcript:
        "Sto pensando a una serie di contenuti per i prossimi tre mesi. L'idea centrale è raccontare il dietro le quinte del mio lavoro: come nascono i progetti, gli errori che faccio, gli strumenti che uso davvero. Potrei alternare un post lungo a settimana con due contenuti brevi, e chiudere ogni mese con una newsletter che riprende i temi migliori.",
      tags: ["ESEMPIO", "CONTENUTI"],
      project: brandProject.id,
      status: "DRAFT",
    },
    {
      title: "Note dalla call con un cliente",
      transcript:
        "Call con un cliente nuovo. Vuole diventare un punto di riferimento nel suo settore, ma non ha una strategia di contenuti. Ha materiale interessante: casi studio, dati, aneddoti. Il problema è la costanza. Proposta: partire con un formato leggero, una rubrica quindicinale, e misurare per tre mesi prima di ampliare.",
      tags: ["ESEMPIO", "CLIENTI"],
      project: brandProject.id,
      status: "DRAFT",
    },
    {
      title: "Il mio metodo di lavoro",
      transcript:
        "Mi accorgo che lavoro meglio quando comincio la giornata senza aprire i messaggi. Le idee migliori arrivano camminando o subito dopo, e se non le catturo entro pochi minuti le perdo. Vorrei costruire un'abitudine: registrare una nota vocale appena l'idea arriva, senza giudicarla, e rivederla la sera.",
      tags: ["ESEMPIO", "METODO"],
      project: personalProject.id,
      status: "DRAFT",
    },
  ];

  for (const n of notes) {
    await prisma.note.create({
      data: {
        userId: user.id,
        title: n.title,
        transcript: n.transcript,
        contentHtml: `<p>${n.transcript}</p>`,
        status: n.status,
        source: "TEXT",
        projectId: n.project,
        tags: {
          create: n.tags.map((t) => ({ tagId: tags[t].id })),
        },
      },
    });
  }

  console.log("Seed completato: demo@filo.app / filo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
