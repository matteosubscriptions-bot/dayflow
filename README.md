# Officina & Specchio

Sistema personale in due superfici (evoluzione di DayFlow, spec v2.0):

- 🛠 **OFFICINA** — il fare: progetti, task, priorità, idee, connessioni
- 🪞 **SPECCHIO** — l'essere: dialogo, umore/energia, gratitudine, abitudini,
  obiettivi di vita, profilo evolutivo

Le due superfici vivono nella stessa app e condividono solo gli **obiettivi di
vita**: Specchio ne è proprietario, Officina li legge (in sola lettura) quando
prioritizza.

## Principi implementati

- **La cattura non fallisce mai.** Un tasto, si parla (Web Speech API it-IT,
  trascrizione live) o si scrive. Il grezzo si salva subito; se manca la rete
  finisce in una coda locale (localStorage) e viene re-inviato al ritorno
  online. L'elaborazione AI è sempre differibile e il grezzo non si cancella
  mai.
- **Router locale.** La classificazione task/idea/specchio e il rilevamento
  del disagio girano client-side, senza rete. Se il router è in dubbio,
  decide l'utente ("Dove va?"), mai il sistema in silenzio.
- **Commutatore normale/disagio (non negoziabile).** Nei dialoghi di
  Specchio, i segnali di sofferenza acuta bloccano le domande e il cloud:
  quei contenuti non lasciano il dispositivo; resta un messaggio di ascolto
  che rimanda a persone vere e professionisti.
- **AI a chiamata, mai custode dei dati.** Al cloud va solo il testo minimo,
  anonimo. Senza `ANTHROPIC_API_KEY` tutto funziona con fallback locali.
- **Sovranità del dato.** Export JSON completo in un click (tab Profilo).

## Scelte di semplificazione (utente singolo, pre-produzione)

Rispetto alla spec: una sola web app con commutatore invece di due app
native; nessun multi-utente/auth; ricerca testuale (ILIKE) invece di
embeddings; Postgres come "server personale" invece di SQLite on-device;
niente Google Calendar né sync multi-dispositivo (fase 2+). Il modello dati
(§6) è però completo: `links` (il grafo), `tags`, `captures`, `life_goals`,
`dialogues`, `profile_traits`, `reports`…

## Stack

- **Next.js 14** (App Router) + React + TypeScript — UI a due temi
  (Officina chiara, Specchio scura)
- **Prisma + PostgreSQL** — persistenza (dev: Postgres locale avviato
  dall'hook; prod: Supabase/Neon/Railway)
- **Zustand** — stato client con update ottimistici e coda offline
- **Web Speech API** — cattura vocale nativa con fallback testo
- **Anthropic Claude** (`claude-sonnet-4-6`) — agenti: Elaboratore,
  Counselor, Creatività, Pensiero laterale, Systems thinking, Design
  thinking, narrativa review

## Avvio rapido

```bash
npm install                # dipendenze + prisma generate
cp .env.example .env       # DATABASE_URL punta a un Postgres locale
npx prisma migrate deploy  # applica le migration
npm run db:seed            # abitudini di default
npm run dev                # http://localhost:3000
```

> Nelle sessioni Claude Code sul web il SessionStart hook fa tutto da solo
> (Postgres, db, migration, seed).

### AI opzionale

Senza `ANTHROPIC_API_KEY` l'app resta usabile: elaborazione euristica dei
grezzi, dialogo con domande locali, review senza narrativa. Con la chiave in
`.env` si attivano gli agenti veri.

## Mappa del codice

```
prisma/schema.prisma        modello dati v2 (grafo links, captures, ecc.)
src/lib/router.ts           router locale + rilevamento disagio (client-side)
src/lib/heuristics.ts       rana, Eisenhower, pattern proattivi, similarità
src/lib/agents.ts           prompt di sistema degli agenti
src/lib/anthropic.ts        client AI + fallback locali
src/app/api/*               API (state, captures, elaborate, dialogue, …)
src/store/useAppStore.ts    stato client + coda offline
src/components/AppShell.tsx la soglia tra le due superfici
src/components/officina/*   Oggi · Progetti · Idee · Cerca
src/components/specchio/*   Dialogo · Diario · Timeline · Obiettivi · Profilo
src/app/status              pagina di stato + self-test end-to-end
```

## Pagina di stato — `/status`

Health check e collaudo in un posto solo:

- **Server & dati**: app/API, connessione PostgreSQL (con latenza), stato
  AI (chiave presente o fallback), conteggi dell'archivio.
- **Questo browser**: disponibilità Web Speech API con **test microfono**
  live (parli, vedi la trascrizione), localStorage per la coda offline,
  stato rete.
- **Self-test end-to-end** (bottone): esercita tutte le funzionalità via
  API reali — cattura grezza + router, elaborazione→task e →idea con
  connessioni proposte, idea→task nel grafo, rana del giorno, dialogo
  Counselor, commutatore disagio, storico dialoghi, tratto nel profilo,
  check-in umore/energia, gratitudine, ciclo abitudini, obiettivo di vita
  + task che lo sostiene, ricerca, review, export — con dati marcati
  `[TEST]` rimossi automaticamente alla fine.

## Produzione

1. `DATABASE_URL` verso un Postgres gestito, `ANTHROPIC_API_KEY` per l'AI.
2. `npx prisma migrate deploy && npm run db:seed`.
3. Deploy su Netlify (config inclusa) o Vercel. L'app è pensata per un solo
   utente: non esporla pubblicamente senza una protezione davanti (es.
   password protection di Netlify o Basic Auth del reverse proxy).
