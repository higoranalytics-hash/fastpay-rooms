window.FP=window.FP||{};
FP.rooms={
  all(){return FP.store.get('rooms',[])},
  save(v){FP.store.set('rooms',v)},
  get(id){return this.all().find(r=>r.id===id)},
  active(){return this.all().filter(r=>r.active)},
  async create(data){
    const payload={operation:'create',room:{name:data.name,description:data.description||'',capacity:Number(data.capacity),resources:data.resources||[]}};
    const r=await FP.api.invoke('room-management',payload);
    await FP.api.bootstrap();
    return r?.room || r;
  },
  async update(id,data){
    const payload={operation:'update',room_id:id,room:{name:data.name,description:data.description||'',capacity:Number(data.capacity),resources:data.resources||[]}};
    const r=await FP.api.invoke('room-management',payload);
    await FP.api.bootstrap();
    return r?.room || r;
  },
  async setActive(id,isActive){
    const r=await FP.api.invoke('room-management',{operation:'set_active',room_id:id,is_active:!!isActive});
    await FP.api.bootstrap();
    return r;
  },
  async deactivate(id){return this.setActive(id,false)},
  async activate(id){return this.setActive(id,true)}
};
