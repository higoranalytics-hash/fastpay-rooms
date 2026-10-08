# FastPay Rooms — Supabase

## Projeto

Project ID: `sxjpbyoagqlmbfwaooxd`

Project URL: `https://sxjpbyoagqlmbfwaooxd.supabase.co`

Frontend key: **Publishable Key** somente.

## Segurança

Não inserir Secret Key, service_role, senha do banco ou segredo de Edge Function em arquivos públicos.

## Backend

O backend existente usa Supabase Auth, RLS, PostgreSQL, RPCs protegidos e Edge Functions. A versão revisada espera os contratos descritos em `SUPABASE-AI-PHASE-8-FUNCTIONAL-FIX.md`.

## Desenvolvimento local

Permitir temporariamente no Supabase Auth / Edge Functions as origens:

- `http://127.0.0.1:5500`
- `http://localhost:5500`

Depois do GitHub Pages, adicionar somente a origem oficial de produção.
