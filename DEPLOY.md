# Deploy & Login — DayFlow

## Può girare "su GitHub"?

**No, non da solo.** GitHub Pages serve solo file statici, mentre DayFlow è
un'app full-stack: ha bisogno di un processo Node in esecuzione (API routes),
di un database e di secret (chiavi). GitHub serve a **ospitare il codice**; per
**eseguirlo** servono o un hosting collegato al repo (consigliato: Vercel) o un
tuo server privato.

GitHub Actions può fare CI/CD (build, test, deploy verso un host) ma non tiene
viva l'app.

Due strade, sotto, entrambe con login funzionante.

---

> Lo schema è **già su PostgreSQL** e le migration sono versionate in
> `prisma/migrations/`. Per andare in produzione basta puntare `DATABASE_URL`
> al DB gestito e applicare le migration — nessuna conversione necessaria.

## Configurare Supabase come database

> Nota: su Supabase **non c'è un passo separato "crea database"**. Creando il
> progetto ottieni già un Postgres con un database chiamato `postgres`; le
> tabelle dell'app le crea Prisma con `prisma migrate deploy`.

### 1. Crea il progetto (= crea il database)
1. supabase.com → accedi → **New project**.
2. Compila: **Name** (es. `dayflow`), **Database Password** (scegline una forte
   e **salvala**: serve nella connection string), **Region** (la più vicina).
3. **Create new project** e attendi ~2 minuti che il database sia pronto.

### 2. Trova la connection string
Nella dashboard del progetto, in alto, premi il pulsante verde **Connect**.
Si apre "Connect to your project" con la sezione **Connection string** e tre
schede:
- **Direct connection** — host `db.<ref>.supabase.co`, porta `5432` (solo IPv6).
- **Transaction pooler** — host `aws-0-<region>.pooler.supabase.com`, porta
  `6543`, utente `postgres.<ref>`.
- **Session pooler** — stesso host pooler, porta `5432` (IPv4).

C'è anche una scheda **ORMs → Prisma** che mostra già pronti `DATABASE_URL` e
`DIRECT_URL`. In ogni stringa sostituisci `[YOUR-PASSWORD]` con la password del
punto 1. (Se l'hai persa: *Settings → Database → Database password → Reset*.)

> Vecchia UI alternativa: ingranaggio **Settings → Database → Connection string
> / Connection pooling**.

### 3. Quale URL usare
- **App in produzione** (Vercel/Netlify, serverless) → **Transaction pooler**
  (`6543`). Aggiungi in coda `?pgbouncer=true&connection_limit=1`.
- **Migration** (`prisma migrate deploy`) → **Direct** (`5432`). Se la tua rete
  è solo IPv4 (errore "network unreachable"), usa il **Session pooler** (`5432`)
  per le migration.

### 4. Applica lo schema e (opzionale) il seed
Da locale, una sola volta, con l'URL direct/session (5432):
```bash
DATABASE_URL="postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres" \
  npx prisma migrate deploy
DATABASE_URL="postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres" \
  npm run db:seed      # facoltativo: utente demo@dayflow.app / dayflow
```

### 5. Valore per l'hosting
Nelle env var di Vercel/Netlify usa il **pooler** (6543):
```
DATABASE_URL=postgresql://postgres.<ref>:PASSWORD@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

> RLS/Storage citati nella spec non servono per far girare l'app: lo scoping per
> `userId` di sessione è già applicato su ogni query; lo Storage servirebbe solo
> per l'audio opzionale (non implementato).

---

## Opzione A — GitHub → Vercel + Supabase (consigliata)

È lo stack della spec: codice su GitHub, deploy automatico su Vercel, database
Postgres gestito su Supabase.

### 1. Crea il database
Segui "Configurare Supabase" qui sopra e tieni a portata le due URL (pooler per
l'app, direct per le migration).

### 2. Importa il repo su Vercel
- vercel.com → *Add New Project* → importa `matteosubscriptions-bot/dayflow`.
- Framework: Next.js (auto). Build command predefinito (`npm run build`, che
  esegue già `prisma generate`).

### 3. Variabili d'ambiente su Vercel
In *Project → Settings → Environment Variables*:

| Nome | Valore |
|------|--------|
| `DATABASE_URL` | URL **pooler** Supabase (porta 6543, `?pgbouncer=true&connection_limit=1`) |
| `NEXTAUTH_SECRET` | genera con `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://<tuo-progetto>.vercel.app` |
| `ANTHROPIC_API_KEY` | la tua chiave Claude (opzionale: senza, fallback locali) |

### 4. Applica le migrazioni al DB di produzione
Una sola volta, da locale con `DATABASE_URL` puntato alla **direct connection**
Supabase (porta 5432):
```bash
npx prisma migrate deploy
npm run db:seed   # facoltativo: utente demo
```

### 5. Deploy
Ogni push su GitHub fa partire un deploy. L'URL pubblico è pronto.

---

## Opzione B — Server privato (VPS)

Per un tuo server (Ubuntu/Debian) con dominio e HTTPS.

### 1. Prerequisiti
```bash
# Node 20+ e Postgres
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx
```

### 2. Database
```bash
sudo -u postgres psql -c "CREATE DATABASE dayflow;"
sudo -u postgres psql -c "CREATE USER dayflow WITH PASSWORD 'scegli_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dayflow TO dayflow;"
```

### 3. Codice + env
```bash
git clone https://github.com/matteosubscriptions-bot/dayflow.git
cd dayflow
# imposta provider = "postgresql" in prisma/schema.prisma (vedi Opzione A.1)
cat > .env <<'ENV'
DATABASE_URL="postgresql://dayflow:scegli_password@localhost:5432/dayflow"
NEXTAUTH_URL="https://tuodominio.it"
NEXTAUTH_SECRET="incolla_qui_openssl_rand_base64_32"
ANTHROPIC_API_KEY=""
ENV
npm install
npx prisma migrate deploy   # o: npx prisma db push
npm run build
```

### 4. Avvio persistente (systemd)
`/etc/systemd/system/dayflow.service`:
```ini
[Unit]
Description=DayFlow
After=network.target postgresql.service

[Service]
WorkingDirectory=/home/USER/dayflow
ExecStart=/usr/bin/npm run start
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/home/USER/dayflow/.env
Restart=always
User=USER

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now dayflow
```

### 5. Reverse proxy + HTTPS (nginx + certbot)
```nginx
server {
  server_name tuodominio.it;
  location / { proxy_pass http://localhost:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
}
```
```bash
sudo certbot --nginx -d tuodominio.it
```
HTTPS è obbligatorio: il microfono (Web Speech API) e i cookie di sessione
funzionano solo su `https://` (o `http://localhost`).

---

## Come funziona il login

- Auth via **NextAuth** con provider Credentials (email + password). Le
  password sono hashate con scrypt (`src/lib/password.ts`); la sessione è un
  **JWT in cookie httpOnly**.
- **Registrazione**: nella pagina `/login` scegli "Registrati" — il primo
  accesso con un'email nuova crea l'account.
- **Utente demo** (dopo `npm run db:seed`): `demo@dayflow.app` / `dayflow`.
- Requisiti perché il login funzioni in produzione: `NEXTAUTH_SECRET` impostato
  e `NEXTAUTH_URL` uguale all'URL pubblico, il tutto **sotto HTTPS**.

> Magic link / OAuth (Google, GitHub) non sono attivi ma sono facili da
> aggiungere: bastano un provider SMTP o le credenziali OAuth come env var e
> un provider in `src/lib/auth.ts`.
