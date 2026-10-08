> Revisão integrada do frontend: V5.7 — acesso pendente/desativado, auditoria e agenda.

# FastPay Rooms V5.4 — Supabase Reviewed

Versão revisada do FastPay Rooms para o projeto Supabase existente.

## Supabase

Project URL:
`https://sxjpbyoagqlmbfwaooxd.supabase.co`

O frontend usa somente a **Publishable Key** em `js/supabase-config.js`.

**Nunca coloque Secret Key/service_role no frontend.**

## Teste local

1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Use Live Server em `index.html`.
4. Faça login com o usuário administrativo já criado.

## Correções desta versão

- Auditoria sem `Invalid Date`.
- Gestão de salas com campos compatíveis com o schema real.
- Tratamento de erros em criar/editar/desativar/reativar sala.
- Reativação de sala.
- Área/departamento não bloqueia mais uma reserva quando o perfil antigo não possui esse dado.
- Participantes em e-mails/texto, compatível com `participants text[]`.
- Recursos da reserva são específicos por sala.
- Admin pode selecionar responsável pela reserva.
- Agenda preparada para consultar disponibilidade sem expor detalhes privados.
- Gestão de usuários revisada para não pedir senha em texto no frontend.
- Gestão de perfil admin, ativação/desativação e recuperação de senha preparada via Edge Function administrativa.

## Backend

Leia e execute no Supabase AI:

`SUPABASE-AI-PHASE-8-FUNCTIONAL-FIX.md`

Esse prompt alinha CORS e os contratos das Edge Functions com o frontend desta versão e pede testes reais no projeto existente.

## Checklist

Consulte:

`CHECKLIST-FUNCIONAL.md`


## Novo fluxo de cadastro
A tela inicial agora possui **“Ainda não tenho acesso? Solicitar cadastro”**. O fluxo previsto é: colaborador informa dados corporativos e senha → solicitação fica pendente → administrador analisa → somente após aprovação o acesso fica ativo.

O backend deste fluxo deve ser implementado pelo prompt `SUPABASE-AI-PHASE-9-SELF-REGISTRATION.md` no projeto Supabase existente. Não habilite o “Allow new users to sign up” do Supabase Auth.


## Correção V5.5 — gestão de usuários
- Corrigido o contrato das ações administrativas com a Edge Function `admin-user-management`.
- Reativação agora envia `activate_user` e inclui `request_id`.
- Desativação agora envia `deactivate_user` e inclui `request_id`.
- Promoção/rebaixamento administrativo agora usa `promote_admin` / `demote_admin`.
- Cada operação gera um `request_id` UUID no frontend.
