# Sessão - 05/07/2026

## Stack
- React + TanStack Start + SSR
- Supabase (projeto `uzkjppmbjbesjzfrtftz`)
- Cloudflare Pages (projeto `hub-insight-corp`)
- Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`) — único provedor IA
- Response cache SHA-256 no Supabase (TTL 10 min)

## Credenciais
### Supabase (novo — Lovable Cloud)
- Project URL: https://uzkjppmbjbesjzfrtftz.supabase.co
- Project Ref: `uzkjppmbjbesjzfrtftz`

### Cloudflare
- Account ID: `cb0343c38137553945815b685fa8afb8`
- OAuth Token: armazenado em `~/.wrangler/config/default.toml`
- Pages secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Google Gemini (removido)
- API Key removida — não usado mais

### User Admin
- Email: brunno.lima@adapti.tec.br
- Role: admin
- User ID: `53716b7a-ef2a-43c0-a5f0-8c9e7aec0a4e`

## Deploy
- URL base: https://hub-insight-corp.pages.dev
- Deploy mais recente: `https://7a5a6dee.hub-insight-corp.pages.dev` (06/07 00:04)
- Deploy anterior: `https://0fb2cc09.hub-insight-corp.pages.dev` (05/07 23:48)

## Estrutura Multi-Tenant

### Tabelas novas (migration `20260705220000_add_multi_tenant_empresas.sql` rodada)
- `empresas` — cadastro de clientes (tenants)
- `integracoes` — conexões com ERP de cada cliente
- `sync_logs` — histórico de extração de dados

### Tabelas alteradas (+ `empresa_id`)
- `profiles` — cada usuário vinculado a uma empresa
- `empreendimentos` — dados isolados por empresa
- `indicadores_financeiros` — isolado por empresa
- `fluxo_caixa_projecao` — isolado por empresa

### RLS
- Todas as policies de domínio verificam `empresa_id` do usuário logado
- Ninguém vê dados de outra empresa
- `integracoes` e `sync_logs` têm RLS service_role apenas

## Admin
- Página `/admin/empresas` — CRUD de empresas (admin only)
- Server functions em `src/lib/admin.functions.ts` (usa service_role)
- Sidebar: grupo Admin com "Empresas" + "Configurações"

## Feito nesta sessão
- [x] Chat IA: removido Gemini, implementado Cloudflare Workers AI como único provider
- [x] Chat IA: implementado cache SHA-256 no Supabase (response_cache, TTL 10min)
- [x] Secrets Cloudflare configurados: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- [x] Multi-tenant: migration com `empresas`, `integracoes`, `sync_logs`, `empresa_id` nas tabelas
- [x] Multi-tenant: RLS isolado por empresa
- [x] Multi-tenant: trigger `handle_new_user` atualizado para ler `empresa_id` do metadata
- [x] Admin: página `/admin/empresas` com CRUD (server functions + service_role)
- [x] Admin: sidebar com link "Empresas"
- [x] Build + deploy bem-sucedido (Cloudflare Workers AI + cache + multi-tenant + admin)

## Pendente / Futuro
- [ ] Tela de admin para gerenciar usuários por empresa
- [ ] Tela de admin para configurar integrações com ERP por empresa
- [ ] Sistema de sync engine (extract → transform → load) para puxar dados dos ERPs
- [ ] Webhook receiver para ERPs que empurram dados
- [ ] Adicionar novos tenants (empresas) via `/admin/empresas`
- [ ] Criar CRUD completo de integrações (`/admin/empresas/:id/integracoes`)
- [ ] Dashboard com visão do admin geral (todos os tenants)
- [ ] Verificar se o chat IA funciona em produção (Cloudflare Workers AI)
- [ ] Configurar provedor SMTP se quiser emails de confirmação

## Notas
- Wrangler CLI precisa de `$env:CLOUDFLARE_API_TOKEN = "cfoat_..."` para deploy
- O OAuth token expira e precisa ser renovado via `wrangler login`
- A build atual gera ~92-99 módulos SSR (~3.3 MB total)
- Vite mudou para rolldown (v8) — chunks otimizados
- O token `cfoat_dVYghYCWwKXo2mRPfJMuS9RkK7OT-T8Y-L_urfwUyng.af4wHaS7bkOPrBwphnRKAB-vKyTUeTLgSTKJl4FBUes` expira em `2026-07-06T15:44`
