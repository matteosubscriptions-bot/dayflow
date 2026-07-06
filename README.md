# Filo

Archivio personale di idee e note vocali, self-hosted: registri un pensiero a
voce (anche offline), Filo lo trascrive e ti aiuta a rielaborarlo — riassunti,
punti chiave, todo, contenuti pronti da pubblicare, connessioni tra note e tre
agenti di elaborazione. I dati sono tuoi: nel tuo database, esportabili in
JSON, senza limiti di utilizzo.

## Funzionalità

- **Cattura ovunque** — pulsante ● REGISTRA flottante in ogni schermata;
  nuova nota testuale; upload di file audio.
- **Trascrizione doppia** — live nel browser (Web Speech API, gratis) mentre
  parli; server-side (Whisper via OpenAI o Groq, opzionale) per i file
  caricati e le note registrate offline.
- **Offline-first** — PWA con service worker; le registrazioni fatte senza
  rete finiscono in una coda locale (IndexedDB) e si sincronizzano da sole.
- **Nota ricca** — audio originale riascoltabile, editor rich-text (Tiptap),
  tag, stato bozza/pronta, assegnazione a progetto.
- **Insights AI** — Riassumi · Estrai punti chiave · Crea todo list (con
  checkbox), salvati sulla nota.
- **Crea contenuti** — trasforma la nota in Post social / Email / Articolo /
  Speech, con Copia e Rigenera.
- **Agenti di elaborazione** — passa la nota a:
  - **Pamela** (project manager): obiettivi, step, priorità, rischi;
  - **Simone** (social media manager/copywriter): post, stories, reel per il
    tuo brand;
  - **Corinne** (counselor/psicologa olistica): dinamiche e domande sulle tue
    riflessioni personali.
  Ogni agente mantiene la conversazione per nota.
- **Ricerca semantica** (TF-IDF locale, ⌘K) con Reindicizza.
- **Chiedi al tuo cervello** — domande in linguaggio naturale sull'intero
  archivio, con citazioni delle note usate.
- **Connessioni** — grafo force-directed delle note (drag, zoom, pan) e
  **mindmap per progetto** centrata sull'idea principale.
- **Progetti/cartelle**, tema chiaro/scuro, dimensione testo, **export JSON**,
  cancellazione totale dei dati.

## Stack

- **Next.js 14** (App Router) + React + TypeScript + Tailwind CSS
- **Prisma** su **PostgreSQL** (dev: Postgres locale via hook; prod: Supabase)
- **NextAuth.js** — email/password (al primo accesso l'account si crea da solo)
- **Anthropic Claude** (`claude-sonnet-4-6`) per insights, contenuti, agenti,
  Q&A — *opzionale*: senza chiave ogni funzione ha un fallback locale
- **Whisper** (OpenAI o Groq) per la trascrizione server — *opzionale*
- **Tiptap** per l'editor; grafo in SVG puro senza librerie

## Avvio rapido

```bash
npm install                          # dipendenze + prisma generate
cp .env.example .env                 # DATABASE_URL punta a un Postgres locale
# Avvia un Postgres locale e crea ruolo/db "filo" (oppure usa Supabase):
#   sudo pg_ctlcluster 16 main start
#   sudo -u postgres psql -c "CREATE ROLE filo LOGIN PASSWORD 'filo' CREATEDB;"
#   sudo -u postgres createdb -O filo filo
npx prisma migrate deploy            # applica le migration
npm run db:seed                      # utente demo + note di esempio
npm run dev                          # http://localhost:3000
```

> Nelle sessioni Claude Code sul web, il SessionStart hook fa tutto questo da
> solo (avvia Postgres, crea il db, applica le migration).

Login demo: **demo@filo.app** / **filo** — oppure entra con una email nuova e
l'account viene creato al volo.

### Chiavi opzionali (`.env`)

| Variabile | Cosa abilita | Senza |
|---|---|---|
| `ANTHROPIC_API_KEY` | Insights, Crea, agenti, Chiedi al cervello, titoli/tag auto | fallback locali (estratti, template) |
| `OPENAI_API_KEY` **o** `GROQ_API_KEY` | trascrizione di upload e note offline | resta la trascrizione live nel browser |

## Deploy

Vedi **[DEPLOY.md](DEPLOY.md)**: guida passo-passo per Netlify + Supabase.

## Struttura

```
src/
├── app/
│   ├── (main)/          # home, library, note/[id], note/new, connections,
│   │   projects, settings (shell con header + REGISTRA flottante)
│   ├── login/
│   └── api/             # notes (+insights/generate/agent/audio), search,
│       reindex, ask, graph, tags, projects, export, data, settings, auth
├── components/          # RecorderPanel, NoteEditor, InsightsPanel,
│   CreatePanel, AgentsPanel, GraphExplorer, SearchBar, AskBrain, …
├── hooks/               # useRecorder (MediaRecorder + Web Speech), useOnline
├── lib/                 # brand, ai/* (client, insights, generate, agents,
│   ask), stt (Whisper), similarity (TF-IDF), offlineQueue (IndexedDB), …
└── prisma/              # schema, migrations, seed
```

## Privacy e possesso dei dati

- Tutto vive nel **tuo** database Postgres; l'audio è salvato lì come bytes.
- Le API filtrano sempre per l'utente di sessione.
- I testi delle note escono dal server **solo** verso le API che configuri tu
  (Anthropic per l'elaborazione, OpenAI/Groq per la trascrizione). Senza
  chiavi, nulla lascia il server.
- Export JSON completo e cancellazione totale in Impostazioni → I tuoi dati.
