# Deploy — Filo (Netlify + Supabase)

Filo è un'app full-stack: serve un processo Node (API routes) e un database
PostgreSQL. Lo schema consigliato — lo stesso che conosci già da DayFlow — è:

- **Supabase** → database Postgres gestito (piano free sufficiente)
- **Netlify** → hosting dell'app Next.js, collegato al repo GitHub

## 1. Database su Supabase

> Su Supabase non c'è un passo separato "crea database": creando il progetto
> ottieni già un Postgres con database `postgres`; le tabelle le crea Prisma.

1. [supabase.com](https://supabase.com) → **New project**: scegli Name (es.
   `filo`), una **Database Password** forte (salvala!) e la Region più vicina.
2. Attendi ~2 minuti, poi premi il pulsante verde **Connect** in alto: si apre
   la sezione **Connection string**. Nella scheda **ORMs → Prisma** trovi già
   pronte `DATABASE_URL` e `DIRECT_URL` — sostituisci `[YOUR-PASSWORD]`.
   - `DATABASE_URL` = **Transaction pooler** (porta `6543`) con
     `?pgbouncer=true&connection_limit=1` in coda → usata dall'app.
   - `DIRECT_URL` = **Direct** (porta `5432`) → usata dalle migration. Se la
     tua rete è solo IPv4 e la direct dà "network unreachable", usa il
     **Session pooler** (porta `5432`).
3. Applica lo schema, da locale, una sola volta:

```bash
DATABASE_URL="<direct o session pooler>" DIRECT_URL="<direct o session pooler>" \
  npx prisma migrate deploy
```

> Nota audio: le note vocali sono salvate nel database come bytes. Il piano
> free di Supabase ha 500 MB di database: per un uso personale bastano
> centinaia di note vocali brevi. Tienilo d'occhio in Dashboard → Database.

## 2. App su Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → scegli il repo GitHub e il branch.
2. Le impostazioni di build sono già nel repo (`netlify.toml`): build command
   `npm run build`, plugin Next.js incluso. Non serve cambiare nulla.
3. **Site settings → Environment variables** — aggiungi:

| Variabile | Valore |
|---|---|
| `DATABASE_URL` | connection string **Transaction pooler** (6543) con `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | connection string **Direct/Session pooler** (5432) |
| `NEXTAUTH_URL` | l'URL del sito, es. `https://filo.netlify.app` |
| `NEXTAUTH_SECRET` | output di `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | *(opzionale)* abilita insights, agenti, Crea, Chiedi al cervello |
| `OPENAI_API_KEY` o `GROQ_API_KEY` | *(opzionale)* trascrizione server (upload e note offline) |

4. **Deploy site**. Al primo accesso usa una email/password nuove: l'account
   si crea da solo (l'app è pensata per un solo utente — tu).

## 3. Verifiche dopo il deploy

- **Microfono**: funziona solo su HTTPS (Netlify lo è già) e richiede il
  permesso del browser al primo uso.
- **Trascrizione live**: Chrome/Edge/Safari la supportano; Firefox no — in
  quel caso configura `GROQ_API_KEY` (gratis) o `OPENAI_API_KEY` e la
  trascrizione avviene al salvataggio.
- **PWA**: da mobile "Aggiungi a schermata Home" per l'esperienza app,
  incluso l'uso offline (registrazione in coda + sync automatico).

## Alternativa: Vercel

Funziona senza `netlify.toml`: importa il repo su vercel.com, imposta le
stesse variabili d'ambiente e deploya. Tutto il resto è identico.

## Aggiornamenti

Ogni push sul branch collegato rideploya il sito. Se una modifica tocca lo
schema Prisma, riesegui `npx prisma migrate deploy` con `DIRECT_URL` prima (o
dopo) il deploy.
