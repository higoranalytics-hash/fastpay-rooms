window.FP=window.FP||{};
FP.notifications={
  all(){return FP.store.get("notifications",[])},
  load(rows){
    const readIds=new Set(FP.store.get('notificationReadIds',[]));
    const server=(Array.isArray(rows)?rows:[]).map(x=>({id:x.id,title:x.title||'Notificação',message:x.message||'',reservationId:x.reservation_id||null,createdAt:x.created_at||new Date().toISOString(),read:!!x.read_at||readIds.has(x.id)}));
    const local=this.all().filter(x=>String(x.id).startsWith('NTF-')&&!server.some(s=>s.id===x.id));
    FP.store.set('notifications',[...server,...local].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,50));
  },
  add(title,message,reservationId){const a=this.all();a.unshift({id:FP.uid("NTF"),title,message,reservationId,createdAt:new Date().toISOString(),read:false});FP.store.set("notifications",a.slice(0,50));},
  markAll(){const a=this.all();const readIds=new Set(FP.store.get('notificationReadIds',[]));a.forEach(n=>{n.read=true;if(n.id)readIds.add(n.id)});FP.store.set('notificationReadIds',[...readIds].slice(-200));FP.store.set("notifications",a)},
  unread(){return this.all().filter(n=>!n.read)}
};
FP.audit={
 all(){return FP.store.get("audit",[])},
 add(action,target,detail){const a=this.all();a.unshift({id:FP.uid("AUD"),action,target,detail,user:"Higor Silva",at:new Date().toISOString()});FP.store.set("audit",a.slice(0,200))}
};
