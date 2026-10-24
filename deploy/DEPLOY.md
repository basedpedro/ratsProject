# Deploy do rats pm

O app roda em `project.ratsdev.tech`, na mesma VPS dos outros sites da ratsdev.
Ele escuta em `127.0.0.1:3003`; o Nginx é quem expõe o domínio com HTTPS.

## Layout

```
/srv/ratsdev-pm/
  current -> releases/20261101-093000
  releases/                builds versionados
  .env.local               variáveis (modo 600, dono ratsdevpm)
```

## Banco

O PostgreSQL 18 já roda na máquina. O banco e o usuário do app são separados dos
outros projetos:

```bash
sudo -u postgres createuser --login ratsdevpm
sudo -u postgres createdb -O ratsdevpm rats_pm
```

A autenticação é peer, pelo socket local. A `DATABASE_URL` usada pelo app:

```
postgresql://ratsdevpm@/rats_pm?host=/var/run/postgresql
```

## Variáveis

`/srv/ratsdev-pm/.env.local`, dono `ratsdevpm`, modo 600:

```
DATABASE_URL=postgresql://ratsdevpm@/rats_pm?host=/var/run/postgresql
SESSION_SECRET=<string aleatória de 32 caracteres ou mais>
HOSTNAME=127.0.0.1
PORT=3003
NODE_ENV=production
```

## Primeira instalação

```bash
useradd --create-home --home-dir /home/ratsdevpm --shell /bin/bash ratsdevpm
mkdir -p /srv/ratsdev-pm/releases
chown -R ratsdevpm:ratsdevpm /srv/ratsdev-pm
```

Envie a primeira versão com `./deploy/deploy.sh` (da máquina de desenvolvimento).
Ele cria a release, instala dependências, compila, aplica as migrações e troca o
link `current`.

Depois da primeira publicação, crie o seed e os acessos:

```bash
cd /srv/ratsdev-pm/current
sudo -u ratsdevpm node --env-file=/srv/ratsdev-pm/.env.local scripts/seed.mjs
sudo -u ratsdevpm node --env-file=/srv/ratsdev-pm/.env.local --import tsx scripts/create-user.mts pedro@ratsdev.com.br "Pedro"
```

O `seed` só roda com o banco vazio. O `create-user` gera a senha e imprime uma
única vez; guarde e entregue para a pessoa.

## Serviço

`/etc/systemd/system/ratsdev-pm.service` é o arquivo `deploy/ratsdev-pm.service`:

```bash
cp deploy/ratsdev-pm.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now ratsdev-pm
systemctl status ratsdev-pm
```

## Nginx

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/ratsdev-pm
ln -s /etc/nginx/sites-available/ratsdev-pm /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d project.ratsdev.tech
```

O certificado só é emitido depois que o DNS de `project.ratsdev.tech` aponta para
a VPS. O cookie de sessão é `Secure` em produção, então o login só funciona por
HTTPS.

## Atualizar

```bash
./deploy/deploy.sh
```

O script mantém as releases antigas para rollback. Cada release ocupa cerca de
665 MB (dependências e build). Para manter só as três mais recentes:

```bash
ls -dt /srv/ratsdev-pm/releases/* | tail -n +4 | xargs rm -rf
```

## Rollback

```bash
ln -sfn /srv/ratsdev-pm/releases/<release-anterior> /srv/ratsdev-pm/current.new
mv -Tf /srv/ratsdev-pm/current.new /srv/ratsdev-pm/current
systemctl restart ratsdev-pm
```

Migrações não são revertidas automaticamente. Se a release anterior não conhece
uma coluna nova, ela continua funcionando; se o rollback exigir desfazer schema,
aplique o SQL na mão.

## Verificação

```bash
curl -s https://project.ratsdev.tech/api/health
# {"ok":true}
```

## Backup

O banco é `rats_pm`. O cron que já existe para os outros bancos também guarda
`/var/backups/cavedosol/rats-pm-<data>.dump`, com 14 dias de retenção.

Para tirar um dump na mão:

```bash
sudo -u postgres pg_dump -Fc rats_pm > /var/backups/rats_pm-$(date +%F).dump
```
