window.FP = window.FP || {};
FP.CORPORATE_DOMAINS = ['@fastpays.com.br','@grecale.com.br'];
FP.DEPARTMENTS = [
  'Atendimento e Ouvidoria',
  'Compliance e Regulatório',
  'Diretoria e Governança',
  'Estratégia',
  'Finanças e Tesouraria',
  'Gestão de Pessoas / RH',
  'Marketing e Growth',
  'Operações e BackOffice',
  'Prevenção à Fraude e Riscos',
  'Produtos e Projetos',
  'Tecnologia e Infraestrutura / TI',
  'Outros'
];
FP.POSITIONS = [
  'Estagiário',
  'Assistente',
  'Auxiliar',
  'Técnico',
  'Analista',
  'Especialista / Consultor',
  'Tech Lead',
  'Supervisor / Coordenador',
  'Gerente',
  'Head',
  'Diretor',
  'Vice-Presidente',
  'C-Level (CEO, CTO, CFO, COO, CRO, CISO)'
];
FP.users = {
  normalizeEmail(email){return String(email||'').trim().toLowerCase();},
  nameFromEmail(email){const local=this.normalizeEmail(email).split('@')[0];return local.split(/[._-]+/).filter(Boolean).map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ');},
  isCorporateEmail(email){const n=this.normalizeEmail(email);return FP.CORPORATE_DOMAINS.some(d=>n.endsWith(d.toLowerCase()));},
  isAdminEmail(email){const u=this.get(email);return !!u&&u.role==='admin';},
  all(){return FP.store.get('users',[]);},
  save(users){FP.store.set('users',users);},
  get(email){const n=this.normalizeEmail(email);return this.all().find(u=>this.normalizeEmail(u.email)===n);},
  getById(id){return this.all().find(u=>u.id===id);},
  current(){return FP.store.get('currentUser',null);},
  role(user){return user?.role||'user';},
  async requestSignup(data){
    if(!this.isCorporateEmail(data.corporate_email)) throw new Error('Informe um e-mail @fastpays.com.br ou @grecale.com.br.');
    if(data.password!==data.password_confirmation) throw new Error('As senhas não conferem.');
    if(String(data.password||'').length<12) throw new Error('A senha deve possuir no mínimo 12 caracteres.');
    return await FP.api.invoke('public-signup-request',{full_name:data.full_name,corporate_email:data.corporate_email,department:data.department,position:data.position||'',phone:data.phone||'',password:data.password});
  },
  async create(data){
    if(!this.isCorporateEmail(data.email)) throw new Error('Informe um e-mail @fastpays.com.br ou @grecale.com.br.');
    const r=await FP.api.invoke('admin-provision-user',{full_name:data.name||data.full_name,corporate_email:data.email||data.corporate_email,department:data.department||'',position:data.position||'',phone:data.phone||''});
    await FP.api.bootstrap();
    return r;
  },
  async setAdmin(id,makeAdmin=true){
    const r=await FP.api.invoke('admin-user-management',{operation:makeAdmin?'set_admin':'set_user',user_id:id});
    await FP.api.bootstrap(); return r;
  },
  async resetPassword(id){
    const r=await FP.api.invoke('admin-user-management',{operation:'send_password_reset',user_id:id});
    return r;
  },
  async setActive(id,isActive){
    const r=await FP.api.invoke('admin-user-management',{operation:'set_active',user_id:id,is_active:!!isActive});
    await FP.api.bootstrap(); return r;
  },
  async updateProfile(id,data){
    const r=await FP.api.invoke('admin-user-management',{operation:'update_profile',user_id:id,full_name:data.full_name,department:data.department,position:data.position||'',phone:data.phone||''});
    await FP.api.bootstrap(); return r;
  },
  async approve(id){
    const r=await FP.api.invoke('admin-user-management',{operation:'approve_pending',user_id:id});
    await FP.api.bootstrap(); return r;
  },
  async reject(id){
    const r=await FP.api.invoke('admin-user-management',{operation:'reject_pending',user_id:id});
    await FP.api.bootstrap(); return r;
  },
  async remove(id){return this.setActive(id,false);}
};
