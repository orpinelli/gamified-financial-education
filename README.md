# gamified-financial-education

## Setup rápido

1. Copie o arquivo de ambiente:

```powershell
Copy-Item .env.example .env.local
```

2. Preencha `DATABASE_URL` e `JWT_SECRET` no `.env.local`.

### Usando Supabase

1. No Supabase, abra `Project Settings` -> `Database` -> `Connection string`.
2. Copie a URL no formato `URI`.
3. Cole em `DATABASE_URL` no `.env.local`.

Se sua senha tiver caracteres especiais (ex.: `@`, `#`, `%`), use URL encode na senha dentro da URL.

Exemplo:
- senha: `@#GaK13141924`
- senha encoded: `%40%23GaK13141924`

3. Instale dependências e rode o projeto:

```bash
pnpm install
pnpm dev
```

## Se o login falhar

- Erro `DATABASE_URL nao configurada no ambiente`: faltou configurar o `.env.local`.
- Erro `DATABASE_URL ainda esta com valores de exemplo`: a URL real do Supabase nao foi colada.
- Erro `password authentication failed`: senha do banco esta incorreta para o pooler (redefina a senha em `Project Settings -> Database`).
- Erro `Banco desatualizado: rode a migracao de planos`: seu banco ainda nao tem as colunas/tipos de planos.

### Diagnostico rapido

Com o projeto rodando, acesse:

- `/api/health/connection`

Essa rota mostra se as variaveis de ambiente estao carregadas e tenta conectar no banco, retornando uma dica do que corrigir.

### Migracao de banco

Com o `.env.local` pronto, rode:

```bash
pnpm db:bootstrap
```

Isso cria/atualiza todas as tabelas no Supabase.

Ou rode tudo de uma vez (conexao + migracao + seed):

```bash
pnpm setup:supabase
```

### Usuarios demo

Depois da base criada, execute:

```bash
pnpm db:seed
```

Senha demo: `senha123`

## RLS (Supabase)

Para aplicar Row Level Security no banco:

```bash
pnpm db:rls
```

Essa migracao cria politicas em `scripts/002-enable-rls.sql`.

Observacao importante:
- O backend atual usa `DATABASE_URL` com conexao de servidor (`postgres`), entao as queries server-side nao dependem de RLS para funcionar.
- O RLS passa a proteger principalmente acessos via Supabase Auth (roles `authenticated`/`anon`) e APIs do Supabase.
