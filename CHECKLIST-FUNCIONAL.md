# FastPay Rooms V5.4 — checklist funcional

## Corrigido no frontend

- Login via Supabase Auth.
- Recuperação de senha via Supabase Auth.
- Auditoria usa `occurred_at` e não exibe mais `Invalid Date`.
- Gestão de salas usa somente os campos realmente persistidos no Supabase: nome, descrição, capacidade e recursos.
- Criar/editar/desativar/reativar sala mantém o modal aberto quando a API retorna erro e exibe a mensagem.
- Reservation department deixou de ser obrigatório.
- Participantes passaram a ser e-mails/textos em lista, coerente com `participants text[]`.
- Recursos da reserva são carregados conforme a sala selecionada.
- Administrador pode selecionar o responsável por uma reserva.
- Agenda consulta uma operação de disponibilidade, em vez de usar somente as reservas privadas carregadas pelo usuário.
- Usuários e acesso não pedem senha em texto no navegador.
- Fluxo antigo de aprovação/rejeição foi removido da interface principal.
- Gestão de usuários foi preparada para promoção/demissão de admin, ativação/desativação e envio de recuperação.
- Erros de Edge Functions são exibidos ao usuário.

## Backend ainda precisa estar alinhado

Execute `SUPABASE-AI-PHASE-8-FUNCTIONAL-FIX.md` no Supabase AI para alinhar CORS e os contratos das Edge Functions com esta versão.

### Contratos esperados
- `admin-provision-user`
- `admin-user-management`
- `room-management`
- `reservation-operations`

Não coloque Secret Key no frontend.
