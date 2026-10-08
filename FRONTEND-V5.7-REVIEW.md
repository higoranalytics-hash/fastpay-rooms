# FastPay Rooms — revisão frontend V5.7

## Objetivo
Revisão integrada da experiência de acesso, usuários, auditoria e agenda, preservando a arquitetura Supabase existente.

## Melhorias aplicadas

### 1. Fluxo de usuários
- `pending` deixou de ser tratado como "desativado".
- Solicitações pendentes aparecem em uma seção própria.
- Ação correta: **Aprovar cadastro**.
- Ação separada: **Rejeitar**.
- `active` permite desativar.
- `deactivated` permite reativar.
- O frontend não tenta mais usar reativação para um usuário pendente.
- Contador de pendências no menu administrativo.

### 2. Segurança de acesso
- Perfil `pending` ou `deactivated` não entra na aplicação.
- A sessão Auth é encerrada quando o perfil não está `active`.
- Mensagens específicas informam se o cadastro está aguardando aprovação ou se o acesso está desativado.
- A autorização administrativa continua dependente do perfil ativo/admin no backend.

### 3. Auditoria
- Ações, entidades e detalhes são apresentados em linguagem de negócio.
- UUIDs técnicos deixam de ser priorizados quando existe nome/e-mail/sala/reserva correspondente.
- Adicionados busca textual e filtro por ação.
- Detalhes de campos alterados são traduzidos para nomes amigáveis.

### 4. Agenda
- Após criar/alterar/cancelar uma reserva, a disponibilidade é invalidada e recarregada.
- A agenda combina a disponibilidade do backend com as reservas já sincronizadas no frontend como fallback visual, reduzindo risco de estado stale.
- Slots de horário agora consideram sobreposição real do intervalo, inclusive reservas iniciadas no meio da hora.

### 5. Sugestões de horário
- Corrigido o uso de `room.open`/`room.close` inexistentes no modelo atual.
- Sugestões usam janela padrão 08:00–19:00 quando a sala não possui horário configurado.

## Contrato backend esperado
O frontend utiliza as operações administrativas já previstas no fluxo de self-registration:

- `approve_pending`
- `reject_pending`
- `set_active`
- `set_admin`
- `set_user`
- `send_password_reset`

A aprovação deve mudar `pending -> active`; a reativação deve continuar restrita a `deactivated -> active`.

Se a Edge Function `admin-user-management` publicada atualmente não expuser `approve_pending` e `reject_pending`, ela deve ser alinhada ao RPC existente antes do teste final. Não se deve alterar a regra de negócio para permitir `pending -> active` por `set_active`.

## Segurança preservada
- Nenhuma credencial privilegiada foi adicionada ao frontend.
- RLS não foi enfraquecido.
- A identidade do ator administrativo continua vindo da sessão/JWT e do backend.
- O frontend não escreve diretamente em `profiles`.
