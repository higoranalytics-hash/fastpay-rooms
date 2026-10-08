window.FP = window.FP || {};
FP.uid = (prefix="RES") => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
FP.todayISO = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
FP.dateBR = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");
FP.time = (iso) => new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
FP.escape = (s="") => String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
FP.store = {
  get(k, fallback){try{return JSON.parse(localStorage.getItem("fp_"+k)) ?? fallback}catch{return fallback}},
  set(k,v){localStorage.setItem("fp_"+k,JSON.stringify(v));},
  remove(k){localStorage.removeItem("fp_"+k)}
};
FP.toast = (message,type="success") => {
  const root=document.querySelector("#toast-root"); const el=document.createElement("div");
  el.className=`toast ${type}`; el.textContent=message; root.appendChild(el);
  setTimeout(()=>el.remove(),3500);
};
FP.overlap=(aStart,aEnd,bStart,bEnd)=>new Date(aStart)<new Date(bEnd)&&new Date(aEnd)>new Date(bStart);
FP.addMinutes=(date,minutes)=>new Date(new Date(date).getTime()+minutes*60000);
FP.toISO=(date,time)=>`${date}T${time}:00-03:00`;
FP.formatDateTime=(iso)=>new Date(iso).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
FP.daysBetween=(a,b)=>Math.ceil((new Date(b)-new Date(a))/86400000);
FP.slug=(s)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-");


/* Feedback global de operações assíncronas */
FP.ui = FP.ui || {};
FP.ui._loadingCount = 0;
FP.ui.loading = (show, message='Processando...') => {
  FP.ui._loadingCount = Math.max(0, FP.ui._loadingCount + (show ? 1 : -1));
  let el = document.querySelector('#fp-global-loading');
  if (!el && show) {
    el = document.createElement('div');
    el.id = 'fp-global-loading';
    el.className = 'fp-global-loading';
    el.innerHTML = '<div class="fp-loading-card"><span class="fp-spinner" aria-hidden="true"></span><span id="fp-loading-message">Processando...</span></div>';
    document.body.appendChild(el);
  }
  if (el) {
    const msg = el.querySelector('#fp-loading-message');
    if (msg) msg.textContent = message;
    el.classList.toggle('is-visible', FP.ui._loadingCount > 0);
    el.setAttribute('aria-hidden', String(FP.ui._loadingCount === 0));
    if (FP.ui._loadingCount === 0) setTimeout(()=>el.remove(),150);
  }
};
FP.ui.busy = async (message, fn) => {
  FP.ui.loading(true, message);
  try { return await fn(); } finally { FP.ui.loading(false); }
};

FP.timeSlots=(start='08:00',end='19:00',step=15)=>{const out=[];let [h,m]=String(start).split(':').map(Number);const [eh,em]=String(end).split(':').map(Number);let cur=h*60+m,last=eh*60+em;while(cur<=last){out.push(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`);cur+=step;}return out;};
FP.durationLabel=(minutes)=>{const h=Math.floor(minutes/60),m=minutes%60;return h&&m?`${h}h ${m}min`:h?`${h}h`:`${m}min`;};
