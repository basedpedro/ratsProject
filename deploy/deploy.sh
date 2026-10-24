#!/usr/bin/env bash
# Publica uma versão nova na VPS. Roda da máquina de desenvolvimento.
#
#   ./deploy/deploy.sh
#
# Cada execução cria /srv/ratsdev-pm/releases/<data>, instala as dependências,
# compila, aplica migrações e troca o link current. O serviço reinicia no fim.
set -euo pipefail

HOST="${HOST:-root@179.236.76.7}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/cavedosol_vps}"
APP_DIR="/srv/ratsdev-pm"
RELEASE="$(date +%Y%m%d-%H%M%S)"
TARGET="$APP_DIR/releases/$RELEASE"

echo "enviando para $HOST:$TARGET"
tar -czf - \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.env.local' \
  --exclude='./test-results' \
  . | ssh -i "$SSH_KEY" "$HOST" "mkdir -p '$TARGET' && tar xzf - -C '$TARGET'"

ssh -i "$SSH_KEY" "$HOST" "RELEASE='$RELEASE' APP_DIR='$APP_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$APP_DIR/releases/$RELEASE"

chown -R ratsdevpm:ratsdevpm "$APP_DIR/releases/$RELEASE"

# npm ci quebra aqui: o lock foi gerado no Windows e o npm valida as
# dependências opcionais por plataforma. npm install respeita o lock e resolve
# os binários certos para a VPS.
sudo -u ratsdevpm npm install --no-audit --no-fund

# O build lê DATABASE_URL ao importar lib/db.ts. Um link para o .env.local
# deixa o Next carregar o arquivo sozinho (node --env-file quebra o worker).
ln -sfn "$APP_DIR/.env.local" "$APP_DIR/releases/$RELEASE/.env.local"
sudo -u ratsdevpm npm run build
sudo -u ratsdevpm node --env-file="$APP_DIR/.env.local" scripts/migrate.mjs

ln -sfn "$APP_DIR/releases/$RELEASE" "$APP_DIR/current.new"
mv -Tf "$APP_DIR/current.new" "$APP_DIR/current"

systemctl restart ratsdev-pm
systemctl is-active --quiet ratsdev-pm

for attempt in 1 2 3 4 5; do
  if curl -fsS http://127.0.0.1:3003/api/health > /dev/null; then
    break
  fi
  sleep 2
done

curl -fsS http://127.0.0.1:3003/api/health
echo
echo "publicado: $APP_DIR/releases/$RELEASE"
REMOTE

echo "pronto. confira https://project.ratsdev.tech/api/health"
