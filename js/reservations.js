window.FP=window.FP||{};
FP.reservations={
  all(){return FP.store.get('reservations',[])},
  save(v){FP.store.set('reservations',v)},
  forRoom(roomId,date){return this.all().filter(r=>r.roomId===roomId&&r.date===date&&r.status==='confirmed')},
  mine(){const uid=FP.auth?.user?.id;return this.all().filter(r=>!uid||r.responsibleUserId===uid)},
  parseParticipants(value){
    if(Array.isArray(value)) return value.map(x=>String(x).trim()).filter(Boolean);
    return String(value||'').split(/[\n,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  },
  conflicts(data,ignoreId=null){return this.forRoom(data.roomId,data.date).filter(r=>r.id!==ignoreId&&FP.overlap(FP.toISO(r.date,r.start),FP.toISO(r.date,r.end),FP.toISO(data.date,data.start),FP.toISO(data.date,data.end)))},
  validate(data,ignoreId=null){
    const errors=[],room=FP.rooms.get(data.roomId);
    if(!data.title||!data.date||!data.start||!data.end||!data.roomId) errors.push('Preencha os campos obrigatórios.');
    if(data.date<FP.todayISO()) errors.push('A reserva não pode ser realizada no passado.');
    if(data.start>=data.end) errors.push('O horário de término deve ser posterior ao início.');
    if(data.date===FP.todayISO()){
      const now=new Date(), requested=new Date(FP.toISO(data.date,data.start));
      if(requested<now) errors.push('A reserva não pode começar em um horário que já passou.');
      else if(!FP.auth.isAdmin() && requested<new Date(now.getTime()+5*60000)) errors.push('A reserva deve ser realizada com pelo menos 5 minutos de antecedência.');
    }
    if(!room) errors.push('Selecione uma sala válida.');
    const participants=this.parseParticipants(data.participants);
    if(room){
      const mins=(new Date(FP.toISO(data.date,data.end))-new Date(FP.toISO(data.date,data.start)))/60000;
      if(mins<15) errors.push('A duração mínima é de 15 minutos.');
      if(mins>240) errors.push('A duração máxima é de 4 horas.');
      if(1+participants.length>room.capacity) errors.push(`A sala comporta até ${room.capacity} pessoas contando o responsável.`);
      const allowed=new Set(room.resources.map(x=>String(x).toLowerCase()));
      const invalid=(data.resources||[]).filter(x=>!allowed.has(String(x).toLowerCase()));
      if(invalid.length) errors.push('Um ou mais recursos selecionados não estão disponíveis nesta sala.');
    }
    if(this.conflicts(data,ignoreId).length) errors.push('Existe uma reserva conflitante para esta sala e horário.');
    return errors;
  },
  async create(data){
    try{
      const availabilityConflict=await this.checkAvailability(data);
      if(availabilityConflict) return {ok:false,errors:['A sala já está ocupada nesse horário. Escolha outro horário ou sala.']};
      const participants=this.parseParticipants(data.participants);
      const isAdmin=FP.auth.isAdmin();
      const body=isAdmin
        ? {operation:'admin_create',responsible_user_id:data.responsibleUserId||FP.auth.user.id,room_id:data.roomId,title:data.title,description:data.description||'',starts_at:FP.toISO(data.date,data.start),ends_at:FP.toISO(data.date,data.end),participants,resources:data.resources||[]}
        : {operation:'create',room_id:data.roomId,title:data.title,description:data.description||'',starts_at:FP.toISO(data.date,data.start),ends_at:FP.toISO(data.date,data.end),participants,resources:data.resources||[]};
      const r=await FP.api.invoke('reservation-operations',body);
      await FP.api.bootstrap();
      return {ok:true,item:FP.api.mapBooking(r.booking||r.reservation||r)};
    }catch(e){return {ok:false,errors:[e.message]};}
  },
  async update(id,data){
    try{
      const availabilityConflict=await this.checkAvailability(data,id);
      if(availabilityConflict) return {ok:false,errors:['A sala já está ocupada nesse horário. Escolha outro horário ou sala.']};
      const participants=this.parseParticipants(data.participants);
      const body=FP.auth.isAdmin()
        ? {operation:'admin_update',booking_id:id,room_id:data.roomId,responsible_user_id:data.responsibleUserId,title:data.title,description:data.description||'',starts_at:FP.toISO(data.date,data.start),ends_at:FP.toISO(data.date,data.end),participants,resources:data.resources||[]}
        : {operation:'update',booking_id:id,room_id:data.roomId,title:data.title,description:data.description||'',starts_at:FP.toISO(data.date,data.start),ends_at:FP.toISO(data.date,data.end),participants,resources:data.resources||[]};
      const r=await FP.api.invoke('reservation-operations',body);
      await FP.api.bootstrap();
      return {ok:true,item:r.booking||r.reservation||r};
    }catch(e){return {ok:false,errors:[e.message]};}
  },
  async cancel(id,reason='Cancelamento solicitado pelo usuário'){
    try{
      await FP.api.invoke('reservation-operations',{operation:FP.auth.isAdmin()?'admin_cancel':'cancel',booking_id:id,reason:String(reason||'').trim()});
      await FP.api.bootstrap();
      return true;
    }catch(e){FP.toast(e.message,'error');return false;}
  },
  async availability(date){
    const parts=String(date||'').split('-').map(Number);
    if(parts.length!==3||parts.some(Number.isNaN)) throw new Error('Data inválida para consulta de disponibilidade.');
    const nextDay=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]+1));
    const toDate=nextDay.toISOString().slice(0,10);
    const r=await FP.api.invoke('reservation-operations',{operation:'availability',from_local_date:date,to_local_date_exclusive:toDate});
    return Array.isArray(r?.availability)?r.availability:(Array.isArray(r)?r:[]);
  },
  async checkAvailability(data,ignoreId=null){
    try{
      const rows=await this.availability(data.date);
      const start=FP.toISO(data.date,data.start),end=FP.toISO(data.date,data.end);
      const own=this.forRoom(data.roomId,data.date).filter(r=>r.id!==ignoreId);
      const apiConflict=rows.some(x=>x.room_id===data.roomId&&FP.overlap(start,end,x.starts_at,x.ends_at));
      const localConflict=own.some(r=>FP.overlap(start,end,FP.toISO(r.date,r.start),FP.toISO(r.date,r.end)));
      return apiConflict||localConflict;
    }catch{
      return false;
    }
  }
};
