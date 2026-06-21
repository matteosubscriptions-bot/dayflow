#!/bin/bash
# DayFlow — SessionStart hook: prepares the repo so build/lint/db work in
# Claude Code on the web. Idempotent and non-interactive.
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

# A fresh container has no .env (it is gitignored). Seed a dev one with the
# SQLite default so Prisma and Next can run.
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Install deps (postinstall runs `prisma generate`). `install` (not `ci`)
# benefits from the cached container state.
npm install

# Create/sync the local SQLite database from the schema.
npx prisma db push --skip-generate

echo "DayFlow session ready."
