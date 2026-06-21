# DayFlow

Journal coach web app per la crescita personale. Check-in giornalieri guidati e
voice-first, obiettivi a reverse-engineering, analisi pattern via AI, report
riflessivi. Implementazione full-stack secondo le specifiche v1.0.

## Stack

- **Next.js 14** (App Router) + React + TypeScript
- **Tailwind CSS** — design system "calma intenzionale"
- **Prisma** — ORM (SQLite in dev, PostgreSQL/Supabase in produzione)
- **NextAuth.js** — auth email/password (JWT, cookie httpOnly)
- **Zustand** — state UI (quick-capture, stato online)
- **Recharts** — grafici review/report
- **Web Speech API** — input vocale nativo, con fallback a testo
- **Anthropic Claude** (`claude-sonnet-4-6`) — domande dinamiche, reverse
  engineering, narrativa report, suggerimenti idee

## Avvio rapido

```bash
npm install                # installa dipendenze + prisma generate
cp .env.example .env       # già presente un .env di dev con SQLite
npm run db:push            # crea il database SQLite (dev.db)
npm run db:seed            # utente demo + dati di esempio
npm run dev                # http://localhost:3000
```

Login demo: **demo@dayflow.app** / **dayflow** (oppure registra un nuovo account
dalla pagina di login).

### AI opzionale in dev

Senza `ANTHROPIC_API_KEY` l'app funziona comunque: ogni feature AI ha un
fallback locale (domande fisse, template di obiettivi, report senza narrativa).
Imposta la chiave in `.env` per attivare le funzioni generative.

## Produzione (Postgres/Supabase)

1. In `prisma/schema.prisma` cambia `datasource db { provider = "postgresql" }`.
2. Imposta `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`.
3. `npx prisma migrate deploy` e deploy su Vercel.

## Struttura

```
src/
├── app/
│   ├── (main)/         # pagine con shell+nav (home, goals, journal, tasks, …)
│   ├── checkin/[type]/ # flusso check-in distraction-free (morning|midday|evening|quick)
│   ├── login, onboarding
│   └── api/            # API routes (checkin, goals, tasks, ai, patterns, reports, …)
├── components/         # VoiceInput, MoodPicker, CheckInFlow, GoalTree, ReportDashboard, QuickCapture, …
├── hooks/useVoice.ts   # lifecycle Web Speech API
├── lib/                # prisma, auth, anonymize, ai/*, patterns, reports, reflections, …
├── store/              # Zustand
└── types/
```

## Privacy

`lib/anonymize.ts` rimuove nomi, luoghi e contatti **prima** di ogni chiamata
all'API Claude (sostituzioni `[persona]`/`[luogo]`/`[collega]`…). I dati grezzi
del journal restano solo sul server. Le query filtrano sempre per `userId` di
sessione (mai dall'input), rate limit 10 chiamate AI/minuto per utente.

## Note di implementazione

- DB di sviluppo: **SQLite** per partire senza servizi esterni. Lo schema è
  portabile su Postgres (tutti gli "enum" sono `String`, come da spec).
- Service Worker (`public/sw.js`) registrato solo in produzione per l'app-shell
  offline; un banner segnala lo stato offline.
- Riduzione animazioni rispettata via `prefers-reduced-motion`.
