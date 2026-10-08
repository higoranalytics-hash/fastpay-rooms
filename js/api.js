window.FP = window.FP || {};

FP.api = {
  async session(){
    if(!window.FP_SUPABASE_READY) return null;
    const { data } = await FP_SUPABASE.auth.getSession();
    return data?.session || null;
  },

  async currentAuthUser(){
    if(!window.FP_SUPABASE_READY) return null;
    const { data, error } = await FP_SUPABASE.auth.getUser();
    if(error) return null;
    return data?.user || null;
  },

  async profile(userId){
    const { data, error } = await FP_SUPABASE.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if(error) throw error;
    return data;
  },

  async bootstrap(){
    if(!window.FP_SUPABASE_READY) throw new Error('Configure o Supabase em js/supabase-config.js.');
    const authUser = await this.currentAuthUser();
    if(!authUser) return null;

    const profile = await this.profile(authUser.id);
    if(!profile) throw new Error('Seu usuário existe no Auth, mas ainda não possui perfil no FastPay Rooms.');
    if(profile.status !== 'active'){
      FP.store.set('currentUser', this.mapProfile(profile, authUser));
      try{await FP_SUPABASE.auth.signOut();}catch{}
      FP.store.remove('currentUser');
      const e=new Error(profile.status==='pending'?'Seu cadastro está aguardando aprovação do Administrador.':'Seu acesso está desativado. Procure o Administrador.');
      e.code='profile_not_active'; e.profileStatus=profile.status; throw e;
    }

    const { data: rooms, error: roomsError } = await FP_SUPABASE
      .from('rooms').select('*').order('name');
    if(roomsError) throw roomsError;

    const { data: mine, error: mineError } = await FP_SUPABASE
      .from('room_bookings').select('*')
      .eq('responsible_user_id', authUser.id)
      .order('starts_at', {ascending:false});
    if(mineError) throw mineError;

    let reservations = mine || [];
    let profiles = [profile];
    let audit = [];

    if(profile.role === 'admin' && profile.status === 'active'){
      const [{data: allBookings, error: bookingsError}, {data: allProfiles, error: profilesError}, {data: auditRows, error: auditError}] = await Promise.all([
        FP_SUPABASE.from('room_bookings').select('*').order('starts_at', {ascending:false}).limit(500),
        FP_SUPABASE.from('profiles').select('*').order('full_name'),
        FP_SUPABASE.from('audit_events').select('*').order('occurred_at', {ascending:false}).limit(200)
      ]);
      if(bookingsError) throw bookingsError;
      if(profilesError) throw profilesError;
      if(auditError) throw auditError;
      reservations = allBookings || [];
      profiles = allProfiles || [profile];
      audit = auditRows || [];
    }

    const userMap = new Map(profiles.map(p=>[p.user_id,p]));
    const user = FP.api.mapProfile(profile, authUser);
    FP.store.set('currentUser', user);
    FP.store.set('users', profiles.map(x=>FP.api.mapProfile(x)));
    FP.store.set('rooms', (rooms||[]).map(FP.api.mapRoom));
    FP.store.set('reservations', reservations.map(x=>FP.api.mapBooking(x,userMap)));
    const roomMap = new Map((rooms || []).map(r => [r.id, r]));
    const bookingMap = new Map((reservations || []).map(b => [b.id, b]));
    FP.store.set('audit', audit.map(x=>FP.api.mapAudit(x,{userMap,roomMap,bookingMap})));
    try {
      const {data: notificationRows,error:notificationError}=await FP_SUPABASE.from('user_notifications').select('*').order('created_at',{ascending:false}).limit(50);
      if(notificationError && notificationError.code!=='42P01') throw notificationError;
      if(!notificationError && FP.notifications?.load) FP.notifications.load(notificationRows||[]);
    } catch(e) {
      console.warn('[FastPay Rooms] Notificações persistentes indisponíveis:',e?.message||e);
    }
    return {
      user,
      users: FP.store.get('users',[]),
      rooms: FP.store.get('rooms',[]),
      reservations: FP.store.get('reservations',[]),
      audit: FP.store.get('audit',[])
    };
  },

  mapProfile(p, authUser){
    return {
      id: p.user_id,
      user_id: p.user_id,
      email: p.corporate_email,
      corporate_email: p.corporate_email,
      name: p.full_name,
      full_name: p.full_name,
      department: p.department || '',
      position: p.position || '',
      phone: p.phone || '',
      role: p.role,
      status: p.status === 'active' ? 'approved' : p.status,
      rawStatus: p.status,
      authUser: !!authUser,
      createdAt: p.created_at || null,
      updatedAt: p.updated_at || null
    };
  },

  mapRoom(r){
    return {
      id: r.id,
      name: r.name,
      description: r.description || '',
      capacity: Number(r.capacity || 0),
      resources: Array.isArray(r.resources) ? r.resources : [],
      features: Array.isArray(r.resources) ? r.resources : [],
      active: !!r.is_active,
      is_active: !!r.is_active,
      createdAt: r.created_at || null,
      updatedAt: r.updated_at || null
    };
  },

  mapBooking(b, userMap=new Map()){
    const start = new Date(b.starts_at), end = new Date(b.ends_at);
    const pad=n=>String(n).padStart(2,'0');
    const date=`${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`;
    const time=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const owner=userMap.get(b.responsible_user_id);
    const participants=Array.isArray(b.participants)?b.participants:[];
    return {
      id:b.id,
      roomId:b.room_id,
      room_id:b.room_id,
      responsibleUserId:b.responsible_user_id,
      createdBy:b.created_by,
      email:owner?.corporate_email || '',
      name:owner?.full_name || '',
      department:owner?.department || '',
      position:owner?.position || '',
      phone:owner?.phone || '',
      title:b.title||'',
      description:b.description||'',
      date,
      start:time(start),
      end:time(end),
      participants,
      participantCount:participants.length,
      resources:Array.isArray(b.resources)?b.resources:[],
      status:b.status,
      bookingType:b.booking_type,
      cancelledAt:b.cancelled_at,
      cancellationReason:b.cancellation_reason,
      createdAt:b.created_at || null,
      updatedAt:b.updated_at || null,
      starts_at:b.starts_at,
      ends_at:b.ends_at
    };
  },

  mapAudit(x, context={} ){
    const userMap=context.userMap || new Map();
    const roomMap=context.roomMap || new Map();
    const bookingMap=context.bookingMap || new Map();
    const metadata=x.metadata && typeof x.metadata==='object' ? x.metadata : {};
    const oldValues=x.old_values && typeof x.old_values==='object' ? x.old_values : null;
    const newValues=x.new_values && typeof x.new_values==='object' ? x.new_values : null;
    const actionLabels={
      initial_admin_bootstrap:'Administrador inicial configurado',
      signup_requested:'Solicitação de cadastro',
      signup_approved:'Cadastro aprovado',
      signup_rejected:'Cadastro rejeitado',
      user_created:'Usuário criado',
      user_activated:'Usuário reativado',
      user_deactivated:'Usuário desativado',
      user_promoted:'Administrador concedido',
      user_demoted:'Administrador removido',
      password_reset_requested:'Redefinição de senha solicitada',
      admin_user_listed:'Consulta de solicitações pendentes',
      room_created:'Sala criada',
      room_updated:'Sala atualizada',
      room_activated:'Sala ativada',
      room_deactivated:'Sala desativada',
      reservation_created:'Reserva criada',
      reservation_updated:'Reserva atualizada',
      reservation_cancelled:'Reserva cancelada'
    };
    const entityLabels={profile:'Usuário',room:'Sala',reservation:'Reserva',system:'Sistema'};
    const action=actionLabels[x.action] || this.humanizeAuditValue(x.action || '-');
    const actor=userMap.get(x.actor_user_id);
    let target='-';
    if(x.entity_type==='room' && roomMap.has(x.entity_id)) target=roomMap.get(x.entity_id).name;
    else if(x.entity_type==='profile' && userMap.has(x.entity_id)) {
      const u=userMap.get(x.entity_id); target=u.full_name || u.corporate_email || x.entity_id;
    } else if(x.entity_type==='reservation' && bookingMap.has(x.entity_id)) {
      const b=bookingMap.get(x.entity_id); target=b.title || `Reserva ${String(x.entity_id).slice(0,8)}`;
    } else if(x.entity_type) target=entityLabels[x.entity_type] || this.humanizeAuditValue(x.entity_type);

    const changed=Array.isArray(metadata.changed_fields)?metadata.changed_fields:[];
    const fieldLabels={
      name:'Nome',description:'Descrição',capacity:'Capacidade',resources:'Recursos',is_active:'Status',
      room_id:'Sala',responsible_user_id:'Responsável',starts_at:'Início',ends_at:'Término',title:'Título',
      participants:'Participantes',status:'Status',cancelled_at:'Cancelamento',cancellation_reason:'Motivo do cancelamento',
      role:'Perfil',department:'Área',position:'Cargo',phone:'Telefone',corporate_email:'E-mail'
    };
    const readableFields=changed.map(f=>fieldLabels[f]||this.humanizeAuditValue(f)).join(', ');
    const booking=bookingMap.get(x.entity_id);
    const profile=userMap.get(x.entity_id);
    const room=booking?.room_id ? roomMap.get(booking.room_id) : null;
    let detail='-';
    if(x.action==='room_updated') detail=readableFields?`Campos alterados: ${readableFields}.`:'Informações da sala atualizadas.';
    else if(x.action==='room_created') {
      const cap=newValues?.capacity ?? roomMap.get(x.entity_id)?.capacity;
      const resources=Array.isArray(newValues?.resources)?newValues.resources:[];
      detail=`Sala cadastrada${cap?` com capacidade para ${cap} pessoas`:''}${resources.length?`. Recursos: ${resources.join(', ')}.`:'.'}`;
    } else if(x.action==='room_activated') detail='Sala disponibilizada para novas reservas.';
    else if(x.action==='room_deactivated') detail='Sala retirada temporariamente de novas reservas.';
    else if(x.action==='signup_requested') detail=`Cadastro solicitado pelo portal. ${metadata.resubmission?'Reenvio de solicitação.':'Primeira solicitação.'}`;
    else if(['user_activated','user_deactivated'].includes(x.action)) detail=`Acesso ${x.action==='user_activated'?'reativado':'desativado'} pelo administrador.`;
    else if(['user_promoted','user_demoted'].includes(x.action)) detail=x.action==='user_promoted'?'Perfil alterado para administrador.':'Privilégio de administrador removido.';
    else if(x.action==='user_created') detail='Acesso corporativo criado pelo administrador.';
    else if(x.action==='password_reset_requested') detail='Solicitação de redefinição de senha enviada ao usuário.';
    else if(['reservation_created','reservation_updated','reservation_cancelled'].includes(x.action) && booking){
      const when=booking.date ? `${FP.dateBR(booking.date)} · ${booking.start}–${booking.end}` : '';
      if(x.action==='reservation_created') detail=`${room?.name||'Sala'}${when?` · ${when}`:''}. Responsável: ${booking.name||'-'}.`;
      else if(x.action==='reservation_updated') detail=readableFields?`Campos alterados: ${readableFields}. ${room?.name||''}${when?` · ${when}`:''}`.trim():`Reserva atualizada${room?.name?` · ${room.name}`:''}.`;
      else detail=booking.cancellation_reason?`Motivo: ${booking.cancellation_reason}`:'Reserva cancelada.';
    } else if(Object.keys(metadata).length){
      const parts=Object.entries(metadata).filter(([k])=>k!=='changed_fields').map(([k,v])=>`${fieldLabels[k]||this.humanizeAuditValue(k)}: ${typeof v==='boolean'?(v?'Sim':'Não'):String(v)}`);
      detail=parts.length?parts.join(' · '):(readableFields?`Campos alterados: ${readableFields}.`:'Registro atualizado.');
    } else if(newValues) {
      detail='Registro atualizado.';
    }
    return {
      id:x.id,
      at:x.occurred_at || null,
      action,
      actionCode:x.action || '',
      user:actor?.full_name || actor?.corporate_email || (x.actor_user_id ? x.actor_user_id : 'Sistema'),
      target,
      detail,
      entityType:x.entity_type,
      entityId:x.entity_id,
      actorUserId:x.actor_user_id,
      metadata,
      oldValues,
      newValues
    };
  },

  humanizeAuditValue(value){
    return String(value||'-').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  },

  async invoke(functionName, body){
    if(!window.FP_SUPABASE_READY) throw new Error('A conexão com o sistema não foi inicializada. Recarregue a página e tente novamente.');
    const labels={'room-management':'sala','reservation-operations':'reserva','admin-user-management':'usuários','admin-provision-user':'usuários','public-signup-request':'cadastro'};
    const label=labels[functionName]||'operação';
    const loadingMessage={'room-management':'Salvando informações da sala...','reservation-operations':'Processando a reserva...','admin-user-management':'Atualizando acesso do usuário...','admin-provision-user':'Criando usuário...','public-signup-request':'Enviando solicitação de cadastro...'}[functionName]||'Processando...';
    FP.ui?.loading?.(true, loadingMessage);
    try{
      const { data, error } = await FP_SUPABASE.functions.invoke(functionName, {body});
      if(error){
        let msg='Não foi possível concluir a operação.';
        try{
          if(error.context){
            let payload=null;
            if(typeof error.context?.json==='function') payload=await error.context.json();
            if(!payload && error.context?.body){try{payload=typeof error.context.body==='string'?JSON.parse(error.context.body):error.context.body;}catch{}}
            if(payload) msg=payload.message || payload.error || payload.code || msg;
          }
        }catch{}
        const raw=String(error.message||'').toLowerCase();
        if(raw.includes('failed to send a request to the edge function')||raw.includes('failed to fetch')||raw.includes('networkerror')) msg=`Não foi possível comunicar com o serviço de ${label}. Verifique a publicação da função e a configuração de acesso (CORS) no Supabase.`;
        else if(raw.includes('unauthorized')||raw.includes('jwt')) msg='Sua sessão expirou ou não foi autorizada. Saia do sistema, entre novamente e tente outra vez.';
        else if(raw.includes('forbidden')) msg='Você não possui permissão para realizar esta operação.';
        const map={invalid_input:'Os dados enviados não são válidos.',not_active_administrator:'Seu usuário não possui permissão de administrador ativa.',user_not_found:'Usuário não encontrado.',protected_initial_administrator:'O administrador inicial é protegido e não pode ser alterado.',cannot_change_own_access:'Você não pode alterar o próprio acesso.',invalid_status_transition:'O status atual do usuário não permite essa alteração.',invalid_actor_domain:'O domínio corporativo do administrador não está autorizado.',operation_not_supported:'Esta operação ainda não está disponível na versão publicada do serviço.',only_active_users_can_be_promoted:'Somente usuários ativos podem ser promovidos a administrador.',cannot_demote_last_administrator:'Não é possível remover o último administrador.',cannot_deactivate_last_administrator:'Não é possível desativar o último administrador.',user_not_pending:'O usuário não está aguardando aprovação.',duplicate_registration:'Este e-mail já possui uma solicitação ou cadastro.',domain_not_allowed:'O e-mail informado não pertence a um domínio corporativo autorizado.',room_unavailable:'A sala já está ocupada nesse horário. Escolha outro horário ou sala.',room_not_found:'A sala selecionada não foi encontrada.',room_inactive:'A sala está desativada e não pode receber novas reservas.',booking_not_found:'A reserva não foi encontrada.',conflict:'A sala já está ocupada nesse horário.'};
        if(map[msg]) msg=map[msg];
        const e=new Error(msg); e.cause=error; throw e;
      }
      return data;
    }finally{FP.ui?.loading?.(false);}
  }
};
