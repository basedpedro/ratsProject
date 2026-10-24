# rats pm

Gerenciador de projetos da ratsdev. Quadro kanban por projeto, pessoas com acesso
próprio, catálogo de status e colunas configuráveis por quadro. A interface segue
o visual do site da ratsdev: terminal, tipografia mono e verde só no que é ação.

## Stack

- Next.js 16 (App Router, Server Actions, Cache Components)
- PostgreSQL 18
- Tailwind CSS 4
- Sem ORM: SQL direto com `pg`

## Rodando local

Crie um banco e aponte a `DATABASE_URL` para ele:

```bash
cp .env.example .env.local
# ajuste DATABASE_URL, SESSION_SECRET e ADMIN_PASSWORD local se precisar
```

`SESSION_SECRET` é obrigatório: é ele que assina o cookie de sessão. Gere um com:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Depois:

```bash
npm install
npm run migrate    # cria as tabelas de db/*.sql
npm run seed       # cria status, colunas e um quadro de exemplo (só se estiver vazio)
npm run create-user -- pedro@ratsdev.com.br "Pedro"
npm run dev
```

O `create-user` imprime a senha uma vez. Sem senha no terceiro argumento, ele
gera uma. Não existe cadastro pelo site: conta nova só por esse script.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento na porta 3000 |
| `npm run build` | build de produção |
| `npm run start` | sobe o build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem emitir arquivos |
| `npm run migrate` | aplica `db/*.sql` em ordem e registra em `schema_migrations` |
| `npm run seed` | popula o banco com o quadro de exemplo |
| `npm run create-user` | cria ou redefine o acesso de uma pessoa |

## Modelo de dados

```
people ─────────────┐
  name, email, role  │  password_hash só existe para quem tem login
  color, active      │
                     │
projects             │
  name, description  │
  archived           │
   │                 │
   └─ board_columns  │
        name         │
        status_id ───┼──> statuses (name, color, kind)
        sort_order   │      kind: todo | doing | blocked | done
        │            │
        └─ tasks ────┘
             title, description, priority, due_date, sort_order
```

Cada tarefa pertence a uma coluna. O status da tarefa é o status da coluna
(`tasks.column_id → board_columns.status_id`), então não há dois lugares para
manter em sincronia: mover o cartão muda o status. `kind = 'done'` é o que conta
como concluído nos números do painel.

## Estrutura

```
app/
  (app)/            área logada (layout com cabeçalho e navegação)
    page.tsx        painel: números, projetos e prazos
    projects/[id]/  quadro kanban e configuração de colunas
    people/         cadastro de pessoas
    statuses/       catálogo de status
  actions/          server actions, uma por agregado
  login/            entrada
  api/health/       verificação usada no deploy
components/         quadro, gaveta da tarefa, formulários e campos
lib/
  domain.ts         tipos do domínio
  rows.ts           mapeamento linha do banco → domínio
  queries.ts        leituras
  auth.ts           sessão assinada com HMAC
  passwords.ts      hash scrypt
  validation.ts     schemas dos formulários (zod)
db/                 migrações SQL
scripts/            migrate, seed, create-user
deploy/             nginx, systemd, script de publicação
```

## Deploy

Instruções completas em [deploy/DEPLOY.md](deploy/DEPLOY.md). O resumo:

```bash
./deploy/deploy.sh
```
