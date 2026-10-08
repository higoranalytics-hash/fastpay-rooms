window.FP = window.FP || {};
FP.auth = {
  get user(){ return FP.store.get('currentUser', null); },
  get role(){ return this.user?.role || 'user'; },
  isLoggedIn(){ return !!this.user; },
  isAdmin(){ return this.role === 'admin' && this.user?.status === 'approved'; },
  async login(email,password){
    const normalized=FP.users.normalizeEmail(email);
    if(!FP.users.isCorporateEmail(normalized)) return {ok:false,type:'invalid',message:'Informe um e-mail corporativo autorizado.'};
    if(!window.FP_SUPABASE_READY || !window.FP_SUPABASE?.auth?.signInWithPassword) return {ok:false,type:'error',message:'A conexão com o Supabase não foi inicializada. Recarregue a página e, se persistir, abra o Console (F12).'};
    try {
      const {data,error}=await FP_SUPABASE.auth.signInWithPassword({email:normalized,password});
      if(error) throw error;
      try {
        await FP.api.bootstrap();
      } catch(e) {
        const code=e?.code || '';
        if(code==='profile_not_active') return {ok:false,type:e.profileStatus==='pending'?'pending':'deactivated',message:e.message};
        throw e;
      }
      const user=FP.store.get('currentUser');
      if(user?.rawStatus && user.rawStatus!=='active'){
        try{await FP_SUPABASE.auth.signOut();}catch{}
        FP.store.remove('currentUser');
        const type=user.rawStatus==='pending'?'pending':'deactivated';
        return {ok:false,type,message:type==='pending'?'Seu cadastro está aguardando aprovação do Administrador.':'Seu acesso está desativado. Procure o Administrador.'};
      }
      return {ok:true,user};
    } catch(e){
      return {ok:false,type:'error',email:normalized,message:e.message||'Não foi possível entrar.'};
    }
  },
  async forgotPassword(email){
    try{
      const {error}=await FP_SUPABASE.auth.resetPasswordForEmail(FP.users.normalizeEmail(email),{redirectTo:window.location.origin+window.location.pathname});
      if(error) throw error;
      return {ok:true,message:'Se o e-mail estiver cadastrado, a recuperação será enviada.'};
    }catch(e){return {ok:false,error:e.message};}
  },
  async logout(){
    try{await FP_SUPABASE.auth.signOut();}catch{}
    FP.store.remove('currentUser'); location.reload();
  }
};
