window.FP=window.FP||{};
FP.admin={
 isAdmin:true,
 stats(){
   const rs=FP.reservations.all(),today=FP.todayISO(),active=rs.filter(r=>r.status==="confirmed");
   const todayRs=active.filter(r=>r.date===today);
   const occupied=FP.rooms.active().filter(room=>todayRs.some(r=>r.roomId===room.id&&FP.overlap(FP.toISO(today,r.start),FP.toISO(today,r.end),new Date().toISOString(),new Date(Date.now()+1).toISOString())));
   const byRoom=FP.rooms.active().map(room=>({room,count:active.filter(r=>r.roomId===room.id).length}));
   return {today:todayRs.length,occupied:occupied.length,available:Math.max(0,FP.rooms.active().length-occupied.length),cancelled:rs.filter(r=>r.status==="cancelled").length,byRoom};
 }
};
