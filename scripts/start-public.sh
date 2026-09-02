#!/usr/bin/env bash
# Start Postgres, the Next.js app, and the Cloudflare tunnel.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker ps --format '{{.Names}}' | grep -q '^schoolmatica_db$'; then
  docker compose -f docker-compose.yml up -d postgres
fi

echo "Waiting for Postgres..."
until docker exec schoolmatica_db pg_isready -U schoolmatica >/dev/null 2>&1; do
  sleep 1
done

if ! lsof -iTCP:44777 -sTCP:LISTEN >/dev/null 2>&1; then
  npm run dev &
fi

if ! pgrep -f 'cloudflared tunnel --config' >/dev/null 2>&1; then
  cloudflared tunnel --config "$(pwd)/cloudflare/config.yml" run &
fi

echo "SchoolMatica is serving on https://schoolmatic.cloud"
echo "Fallback hostname: https://schoolmatic.themediavault.app"
wait
