#!/bin/bash
# DayFlow — SessionStart hook: prepares the repo so build/lint/db work in
# Claude Code on the web. Idempotent and non-interactive.
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

# A fresh container has no .env (it is gitignored). Seed a dev one (points at
# the local Postgres started below) so Prisma and Next can run.
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Start the local PostgreSQL cluster if installed and not already running.
if command -v pg_ctlcluster >/dev/null 2>&1; then
  PG_VER="$(ls /etc/postgresql 2>/dev/null | head -n1 || true)"
  if [ -n "${PG_VER:-}" ]; then
    sudo pg_ctlcluster "$PG_VER" main start 2>/dev/null \
      || pg_ctlcluster "$PG_VER" main start 2>/dev/null || true

    # Ensure the dev role + database exist (CREATEDB needed for Prisma's
    # shadow database used by `migrate`).
    sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='dayflow'" \
      | grep -q 1 \
      || sudo -u postgres psql -c "CREATE ROLE dayflow LOGIN PASSWORD 'dayflow' CREATEDB;" 2>/dev/null || true
    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='dayflow'" \
      | grep -q 1 \
      || sudo -u postgres createdb -O dayflow dayflow 2>/dev/null || true
  fi
fi

# Install deps (postinstall runs `prisma generate`). `install` (not `ci`)
# benefits from the cached container state.
npm install

# Apply committed migrations to the dev database.
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate

echo "DayFlow session ready."
