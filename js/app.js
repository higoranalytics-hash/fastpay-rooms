window.FP=window.FP||{};
const App={
 state:{view:"dashboard",role:"user",calendarDate:FP.todayISO(),availability:[],availabilityDate:null},
 async init(){
   this.bind(); this.initTheme();
   if(window.FP_SUPABASE_READY){
     FP_SUPABASE.auth.onAuthStateChange((event)=>{
       if(event==='PASSWORD_RECOVERY') setTimeout(()=>this.openRecoveryPassword(),0);
     });
   }
   try { await FP.api.bootstrap(); }
   catch { FP.store.remove('currentUser'); }
   if(!FP.auth.isLoggedIn()){ this.renderLogin(); return; }
   this.state.role=FP.auth.role; this.render(); this.updateNotifications(); if(FP.auth.user?.mustChangePassword)this.openChangePassword();
 },
 bind(){
   document.addEventListener("click",async e=>{
     const nav=e.target.closest("[data-view]"); if(nav){if(['admin-reservations','admin-rooms','audit','users'].includes(nav.dataset.view)&&!FP.auth.isAdmin())return;this.state.view=nav.dataset.view;document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x===nav));this.render();document.querySelector("#sidebar").classList.remove("open");}
     if(e.target.closest("#mobile-menu")){const open=!document.querySelector("#sidebar").classList.contains("open");document.querySelector("#sidebar").classList.toggle("open",open);document.body.classList.toggle("sidebar-open",open);document.querySelector("#mobile-overlay")?.setAttribute("aria-hidden",String(!open));document.querySelector("#mobile-menu")?.setAttribute("aria-expanded",String(open));}
     if(e.target.closest("[data-view]")||e.target.closest("#mobile-overlay")){document.querySelector("#sidebar")?.classList.remove("open");document.body.classList.remove("sidebar-open");document.querySelector("#mobile-overlay")?.setAttribute("aria-hidden","true");document.querySelector("#mobile-menu")?.setAttribute("aria-expanded","false");}
     if(e.target.closest("#theme-toggle"))this.toggleTheme();
     if(e.target.closest("#logout-btn")){await FP.auth.logout();}
     if(e.target.closest("#notification-btn"))this.showNotifications();
     if(e.target.closest("[data-action='new-reservation']"))this.openReservation();
     if(e.target.closest("[data-action='close-modal']"))this.closeModal();
     if(e.target.closest("[data-action='cancel']"))this.cancelReservation(e.target.closest("[data-action='cancel']").dataset.id);
     if(e.target.closest("[data-action='admin-cancel']"))this.adminCancel(e.target.closest("[data-action='admin-cancel']").dataset.id);
     if(e.target.closest("[data-action='edit-room']"))this.roomModal(e.target.closest("[data-action='edit-room']").dataset.id);
     if(e.target.closest("[data-action='new-room']"))this.roomModal();
     if(e.target.closest("[data-action='deactivate-room']"))this.deactivateRoom(e.target.closest("[data-action='deactivate-room']").dataset.id);
     if(e.target.closest("[data-action='activate-room']"))this.activateRoom(e.target.closest("[data-action='activate-room']").dataset.id);
     if(e.target.closest("[data-action='delete-demo-data']")){localStorage.clear();location.reload();}
     if(e.target.closest("[data-action='confirm-booking']")){await this.confirmBooking();}
     if(e.target.closest("[data-action='new-user']")){this.openUserForm();}
     if(e.target.closest("[data-action='edit-user-profile']")){this.openUserEdit(e.target.closest("[data-action='edit-user-profile']").dataset.id);}
     if(e.target.closest("[data-action='reset-user-password']")){await this.resetUserPassword(e.target.closest("[data-action='reset-user-password']").dataset.id);}
     if(e.target.closest("[data-action='deactivate-user']")){await this.setUserActive(e.target.closest("[data-action='deactivate-user']").dataset.id,false);}
     if(e.target.closest("[data-action='activate-user']")){await this.setUserActive(e.target.closest("[data-action='activate-user']").dataset.id,true);}
     if(e.target.closest("[data-action='approve-user']")){await this.approveUser(e.target.closest("[data-action='approve-user']").dataset.id);}
     if(e.target.closest("[data-action='reject-user']")){await this.rejectUser(e.target.closest("[data-action='reject-user']").dataset.id);}
     if(e.target.closest("[data-action='make-admin']")){await this.makeAdmin(e.target.closest("[data-action='make-admin']").dataset.id);}
     if(e.target.closest("[data-action='remove-admin']")){await this.makeAdmin(e.target.closest("[data-action='remove-admin']").dataset.id,false);}
     if(e.target.closest("[data-action='edit-reservation']")){this.openReservation("","","",e.target.closest("[data-action='edit-reservation']").dataset.id);}
   });
   document.addEventListener("submit",async e=>{
     if(e.target?.id==="admin-user-form"){e.preventDefault();await this.submitAdminUser();}
     if(e.target?.id==="admin-password-form"){e.preventDefault();await this.submitPasswordAction();}
   });
 },
 renderLogin(){
   const root=document.querySelector("#login-root"); if(root) root.style.display="block";
   const app=document.querySelector("#app"); if(app) app.style.display="none";
   root.innerHTML=`<div class="login-shell"><section class="login-panel">
     <div class="login-brand"><img src="assets/fastpay-logo.png" alt="FastPay"><span>Rooms</span></div>
     <div class="login-copy"><span class="eyebrow">FASTPAY · ROOMS</span><h1>Seu espaço para<br><em>reuniões.</em></h1><p>Consulte salas, encontre horários disponíveis e organize suas reuniões em um único ambiente.</p></div>
     <form class="login-form" id="login-form">
       <label for="login-email">E-mail corporativo</label><input id="login-email" name="email" type="email" autocomplete="username" placeholder="nome@fastpays.com.br" required autofocus>
       <label for="login-password">Senha</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required>
       <button class="btn primary login-btn" id="login-submit" type="submit">Entrar</button>
       <button class="link-btn" id="forgot-password" type="button">Esqueci minha senha</button>
       <button class="link-btn" id="signup-request" type="button">Ainda não tenho acesso? Solicitar cadastro</button>
       <div id="login-feedback" class="login-hint">Use seu e-mail corporativo e sua senha para acessar.</div>
     </form>
     <div class="login-footer">Acesso protegido por senha · Conta corporativa</div>
   </section><section class="login-art" aria-hidden="true"><div class="login-grid"></div><div class="login-art-copy"><span>MEET · PLAN · RESERVE</span><strong>Reserve<br>com clareza.</strong></div></section></div>`;
   const loginForm = document.querySelector('#login-form');
   if (loginForm) {
     loginForm.addEventListener('submit', async (event) => {
       event.preventDefault();
       await this.handleLogin();
     });
   }
   document.querySelector('#forgot-password')?.addEventListener('click',()=>this.openForgotPassword());
   document.querySelector('#signup-request')?.addEventListener('click',()=>this.openSignupRequest());
 },
 openChangePassword(){
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal modal-small"><div class="modal-head"><div><div class="eyebrow">PRIMEIRO ACESSO</div><h2>Crie sua senha pessoal</h2></div></div><form id="change-password-form"><div class="modal-body"><div class="notice info">Por segurança, esta é uma senha inicial. Defina uma senha pessoal para continuar.</div><div class="field" style="margin-top:16px"><label>Senha inicial</label><input id="current-password" type="password" autocomplete="current-password" required></div><div class="field" style="margin-top:12px"><label>Nova senha</label><input id="new-password" type="password" minlength="12" autocomplete="new-password" required><small class="hint">Mínimo de 12 caracteres.</small></div><div id="change-password-feedback" class="login-hint"></div></div><div class="modal-foot"><button class="btn primary" type="submit">Salvar nova senha</button></div></form></div></div>`;
   document.querySelector('#change-password-form').onsubmit=async(e)=>{e.preventDefault();const feedback=document.querySelector('#change-password-feedback');try{const current=document.querySelector('#current-password').value;const next=document.querySelector('#new-password').value;if(!current||!next) throw new Error('Preencha os campos de senha.');const {data,error}=await FP_SUPABASE.auth.updateUser({password:next});if(error) throw error;const user=FP.store.get('currentUser',{});user.mustChangePassword=false;FP.store.set('currentUser',user);this.closeModal();FP.toast('Senha alterada com sucesso.');}catch(err){feedback.className='login-hint error-text';feedback.textContent=err.message||'Não foi possível alterar a senha.';}};
 },
 async handleLogin(){
   const input=document.querySelector('#login-email'),password=document.querySelector('#login-password'),feedback=document.querySelector('#login-feedback'),button=document.querySelector('#login-submit');
   if(!input || !password || !feedback) return;
   if(button){button.disabled=true;button.textContent='Entrando...';}
   feedback.className='login-hint';
   feedback.textContent='Conectando ao FastPay Rooms...';
   try {
     const result=await FP.auth.login(input.value||'',password.value||'');
     if(result.ok){const root=document.querySelector('#login-root');if(root){root.innerHTML='';root.style.display='none';}const app=document.querySelector('#app');if(app)app.style.display='';this.state.view='dashboard';this.state.role=FP.auth.role;this.render();FP.toast(`Bem-vindo, ${result.user.name.split(' ')[0]}.`);if(result.user.mustChangePassword)this.openChangePassword();return;}
     if(result.type==='pending'){feedback.className='login-hint error-text';feedback.textContent=result.message||'Seu cadastro está aguardando aprovação do Administrador.';return;}
     if(result.type==='deactivated'){feedback.className='login-hint error-text';feedback.textContent=result.message||'Seu acesso está desativado. Procure o Administrador.';return;}
     if(result.type==='new'){feedback.className='login-hint error-text';feedback.textContent='Este e-mail ainda não possui acesso. Solicite seu cadastro pelo botão abaixo.';return;}
     if(result.type==='eligible'){feedback.className='login-hint error-text';feedback.textContent='Seu cadastro está liberado para novo pedido, mas o cadastro agora é feito pelo Administrador.';return;}
     feedback.className='login-hint error-text';
     feedback.textContent=result.message || 'Não foi possível entrar.';
   } catch (error) {
     console.error('[FastPay Rooms] Login error:', error);
     feedback.className='login-hint error-text';
     feedback.textContent=error?.message || 'Erro inesperado ao tentar entrar. Abra o Console (F12) para diagnóstico.';
   } finally {
     if(button){button.disabled=false;button.textContent='Entrar';}
   }
 },
 openSignupRequest(){
   const departmentOptions=FP.DEPARTMENTS.map(x=>`<option value="${FP.escape(x)}">${FP.escape(x)}</option>`).join('');
   const positionOptions=FP.POSITIONS.map(x=>`<option value="${FP.escape(x)}">${FP.escape(x)}</option>`).join('');
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">NOVO ACESSO</div><h2>Solicitar cadastro</h2></div><button class="close" data-action="close-modal" aria-label="Fechar">×</button></div><form id="signup-request-form"><div class="modal-body"><div class="notice info">O cadastro é destinado a colaboradores FastPay e Grecale. Após o envio, o Administrador analisará a solicitação antes de liberar o acesso.</div><div class="form-grid"><div class="field full"><label>Nome completo *</label><input id="signup-name" required autocomplete="name" placeholder="Ex.: Pedro Oliveira"></div><div class="field"><label>E-mail corporativo *</label><input id="signup-email" type="email" required autocomplete="email" placeholder="nome@fastpays.com.br"></div><div class="field"><label>Área / departamento *</label><select id="signup-department" required><option value="">Selecione uma área</option>${departmentOptions}</select></div><div class="field" id="signup-department-other-wrap" style="display:none"><label>Informe a área *</label><input id="signup-department-other" placeholder="Digite a área/departamento"></div><div class="field"><label>Cargo / função *</label><select id="signup-position" required><option value="">Selecione o cargo/função</option>${positionOptions}</select></div><div class="field"><label>Telefone / ramal</label><input id="signup-phone" placeholder="Ex.: Ramal 1234"></div><div class="field"><label>Senha *</label><input id="signup-password" type="password" minlength="12" required autocomplete="new-password"><small class="hint">Mínimo de 12 caracteres.</small></div><div class="field"><label>Confirmar senha *</label><input id="signup-password-confirm" type="password" minlength="12" required autocomplete="new-password"><small id="signup-password-match" class="hint">Digite a senha novamente.</small></div></div><div id="signup-feedback" class="login-hint"></div></div><div class="modal-foot"><button class="btn" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Solicitar cadastro</button></div></form></div></div>`;
   const form=document.querySelector('#signup-request-form');
   const password=document.querySelector('#signup-password'),confirmPassword=document.querySelector('#signup-password-confirm'),match=document.querySelector('#signup-password-match');
   const dept=document.querySelector('#signup-department'),otherWrap=document.querySelector('#signup-department-other-wrap');
   const updatePasswordMatch=()=>{const a=password.value,b=confirmPassword.value;if(!b){match.textContent='Digite a senha novamente.';match.className='hint';return;}if(a===b){match.textContent='✓ As senhas conferem.';match.className='hint password-match-ok';}else{match.textContent='✕ As senhas não conferem.';match.className='hint password-match-error';}};
   password.addEventListener('input',updatePasswordMatch);confirmPassword.addEventListener('input',updatePasswordMatch);
   dept.addEventListener('change',()=>{const other=dept.value==='Outros';otherWrap.style.display=other?'grid':'none';document.querySelector('#signup-department-other').required=other;});
   form.onsubmit=async(e)=>{e.preventDefault();const f=id=>document.querySelector(id)?.value?.trim()||'';const selectedDept=f('#signup-department');const department=selectedDept==='Outros'?f('#signup-department-other'):selectedDept;const data={full_name:f('#signup-name'),corporate_email:f('#signup-email'),department,position:f('#signup-position'),phone:f('#signup-phone'),password:password.value,password_confirmation:confirmPassword.value};const feedback=document.querySelector('#signup-feedback'),button=form.querySelector('button[type=submit]');try{if(!data.full_name||!data.corporate_email||!data.department||!data.position||!data.password||!data.password_confirmation)throw new Error('Preencha todos os campos obrigatórios.');if(!FP.users.isCorporateEmail(data.corporate_email))throw new Error('Use um e-mail @fastpays.com.br ou @grecale.com.br.');if(data.password!==data.password_confirmation)throw new Error('As senhas não conferem.');button.disabled=true;button.textContent='Enviando...';const r=await FP.users.requestSignup(data);feedback.className='login-hint';feedback.textContent=r?.message||'Solicitação enviada. Aguarde a análise do Administrador.';button.textContent='Solicitação enviada';setTimeout(()=>this.closeModal(),2200);}catch(err){feedback.className='login-hint error-text';feedback.textContent=err.message||'Não foi possível enviar sua solicitação.';button.disabled=false;button.textContent='Solicitar cadastro';}};
 },
 openRecoveryPassword(){
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal modal-small"><div class="modal-head"><div><div class="eyebrow">RECUPERAÇÃO DE ACESSO</div><h2>Defina sua nova senha</h2></div></div><form id="recovery-password-form"><div class="modal-body"><div class="notice info">O link de recuperação foi validado. Escolha uma nova senha para sua conta.</div><div class="field" style="margin-top:16px"><label>Nova senha</label><input id="recovery-new-password" type="password" minlength="12" autocomplete="new-password" required><small class="hint">Mínimo de 12 caracteres.</small></div><div id="recovery-password-feedback" class="login-hint"></div></div><div class="modal-foot"><button class="btn primary" type="submit">Salvar nova senha</button></div></form></div></div>`;
   document.querySelector('#recovery-password-form').onsubmit=async(e)=>{e.preventDefault();const feedback=document.querySelector('#recovery-password-feedback');try{const password=document.querySelector('#recovery-new-password').value;const {error}=await FP_SUPABASE.auth.updateUser({password});if(error)throw error;this.closeModal();FP.toast('Senha redefinida com sucesso.');await FP.auth.logout();}catch(err){feedback.className='login-hint error-text';feedback.textContent=err.message||'Não foi possível redefinir a senha.';}};
 },
 openForgotPassword(){
   const email=FP.users.normalizeEmail(document.querySelector('#login-email')?.value||'');
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal modal-small"><div class="modal-head"><div><div class="eyebrow">RECUPERAÇÃO DE ACESSO</div><h2>Nova senha</h2></div><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><p class="subtitle">Informe seu e-mail corporativo. A solicitação será registrada e o Administrador poderá definir uma nova senha para você.</p><div class="field" style="margin-top:16px"><label for="forgot-email">E-mail corporativo</label><input id="forgot-email" type="email" value="${FP.escape(email)}" placeholder="nome@fastpays.com.br"></div><div id="forgot-feedback" class="login-hint"></div></div><div class="modal-foot"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn primary" id="send-reset">Solicitar redefinição</button></div></div></div>`;
   document.querySelector('#send-reset').onclick=async()=>{const f=document.querySelector('#forgot-email'),feedback=document.querySelector('#forgot-feedback');const r=await FP.auth.forgotPassword(f.value);if(!r.ok){feedback.className='login-hint error-text';feedback.textContent=r.error;return;}feedback.className='login-hint';feedback.textContent=r.message;FP.toast(r.message);setTimeout(()=>this.closeModal(),1800);};
 },
 openUserForm(){
   const departmentOptions=FP.DEPARTMENTS.map(x=>`<option value="${FP.escape(x)}">${FP.escape(x)}</option>`).join('');
   const positionOptions=FP.POSITIONS.map(x=>`<option value="${FP.escape(x)}">${FP.escape(x)}</option>`).join('');
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">USUÁRIOS E ACESSO</div><h2>Novo usuário</h2></div><button class="close" data-action="close-modal" aria-label="Fechar">×</button></div><form id="admin-user-form"><div class="modal-body"><div class="notice info">O acesso é criado pelo administrador. O usuário receberá o fluxo seguro do Supabase para definir a própria senha.</div><div class="form-grid"><div class="field full"><label>Nome completo *</label><input id="admin-user-name" required placeholder="Ex.: Pedro Oliveira"></div><div class="field"><label>E-mail corporativo *</label><input id="admin-user-email" type="email" required placeholder="pedro.oliveira@fastpays.com.br"></div><div class="field"><label>Área / departamento</label><select id="admin-user-department"><option value="">Selecione uma área</option>${departmentOptions}</select></div><div class="field" id="admin-user-department-other-wrap" style="display:none"><label>Informe a área</label><input id="admin-user-department-other" placeholder="Digite a área/departamento"></div><div class="field"><label>Cargo / função</label><select id="admin-user-position"><option value="">Selecione o cargo/função</option>${positionOptions}</select></div><div class="field"><label>Telefone / ramal</label><input id="admin-user-phone" placeholder="Ex.: Ramal 1234"></div></div><div id="admin-user-feedback" class="login-hint"></div></div><div class="modal-foot"><button class="btn" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Criar acesso</button></div></form></div></div>`;
   const dept=document.querySelector('#admin-user-department'),otherWrap=document.querySelector('#admin-user-department-other-wrap');
   dept.addEventListener('change',()=>{const other=dept.value==='Outros';otherWrap.style.display=other?'grid':'none';document.querySelector('#admin-user-department-other').required=other;});
 },
 openUserEdit(id){
   const u=FP.users.getById(id);if(!u)return;
   const knownDept=FP.DEPARTMENTS.includes(u.department)?u.department:(u.department?'Outros':'');
   const departmentOptions=FP.DEPARTMENTS.map(x=>`<option value="${FP.escape(x)}" ${knownDept===x?'selected':''}>${FP.escape(x)}</option>`).join('');
   const positionOptions=FP.POSITIONS.map(x=>`<option value="${FP.escape(x)}" ${u.position===x?'selected':''}>${FP.escape(x)}</option>`).join('');
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">PERFIL DO USUÁRIO</div><h2>Editar dados</h2></div><button class="close" data-action="close-modal" aria-label="Fechar">×</button></div><form id="admin-edit-user-form"><div class="modal-body"><div class="notice info">O administrador pode atualizar os dados profissionais quando houver mudança de área, cargo ou telefone. O e-mail corporativo não pode ser alterado por aqui.</div><div class="form-grid"><div class="field full"><label>Nome completo *</label><input id="edit-user-name" value="${FP.escape(u.name||'')}" required></div><div class="field full"><label>E-mail corporativo</label><input value="${FP.escape(u.email||'')}" readonly></div><div class="field"><label>Área / departamento *</label><select id="edit-user-department" required><option value="">Selecione uma área</option>${departmentOptions}</select></div><div class="field" id="edit-user-department-other-wrap" style="display:${knownDept==='Outros'?'grid':'none'}"><label>Informe a área *</label><input id="edit-user-department-other" value="${knownDept==='Outros'&&!FP.DEPARTMENTS.includes(u.department)?FP.escape(u.department):''}" placeholder="Digite a área/departamento"></div><div class="field"><label>Cargo / função *</label><select id="edit-user-position" required><option value="">Selecione o cargo/função</option>${positionOptions}</select></div><div class="field"><label>Telefone / ramal</label><input id="edit-user-phone" value="${FP.escape(u.phone||'')}" placeholder="Ex.: Ramal 1234"></div></div><div id="admin-edit-user-feedback" class="login-hint"></div></div><div class="modal-foot"><button class="btn" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">Salvar alterações</button></div></form></div></div>`;
   const dept=document.querySelector('#edit-user-department'),otherWrap=document.querySelector('#edit-user-department-other-wrap');
   dept.addEventListener('change',()=>{const other=dept.value==='Outros';otherWrap.style.display=other?'grid':'none';document.querySelector('#edit-user-department-other').required=other;});
   document.querySelector('#admin-edit-user-form').onsubmit=async(e)=>{e.preventDefault();const feedback=document.querySelector('#admin-edit-user-feedback'),button=e.target.querySelector('button[type=submit]');const selected=dept.value;const department=selected==='Outros'?(document.querySelector('#edit-user-department-other').value||'').trim():selected;const data={full_name:document.querySelector('#edit-user-name').value.trim(),department,position:document.querySelector('#edit-user-position').value,phone:document.querySelector('#edit-user-phone').value.trim()};if(!data.full_name||!data.department||!data.position){feedback.className='login-hint error-text';feedback.textContent='Nome, área e cargo são obrigatórios.';return;}try{button.disabled=true;button.textContent='Salvando...';await FP.users.updateProfile(id,data);this.closeModal();FP.toast('Dados do usuário atualizados com sucesso.');this.render();}catch(err){feedback.className='login-hint error-text';feedback.textContent=err.message||'Não foi possível atualizar os dados.';button.disabled=false;button.textContent='Salvar alterações';}};
 },
 async submitAdminUser(){
   const selectedDepartment=document.querySelector('#admin-user-department').value;const department=selectedDepartment==='Outros'?(document.querySelector('#admin-user-department-other').value||'').trim():selectedDepartment;const data={name:document.querySelector('#admin-user-name').value.trim(),email:document.querySelector('#admin-user-email').value.trim(),department,position:document.querySelector('#admin-user-position').value,phone:document.querySelector('#admin-user-phone').value.trim()},feedback=document.querySelector('#admin-user-feedback'),button=document.querySelector('#admin-user-form button[type="submit"]');
   if(!data.name||!data.email){feedback.className='login-hint error-text';feedback.textContent='Nome e e-mail são obrigatórios.';return;}
   if(!FP.users.isCorporateEmail(data.email)){feedback.className='login-hint error-text';feedback.textContent='Use um e-mail @fastpays.com.br ou @grecale.com.br.';return;}
   try{button.disabled=true;button.textContent='Criando...';await FP.users.create(data);this.closeModal();FP.toast('Acesso criado. O usuário receberá o fluxo de definição de senha.');this.render();}catch(e){feedback.className='login-hint error-text';feedback.textContent=e.message||'Não foi possível criar o acesso.';button.disabled=false;button.textContent='Criar acesso';}
 },
 openPasswordAction(mode,id){
   const u=FP.users.all().find(x=>x.id===id);if(!u)return;const approve=mode==='approve';
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal modal-small"><div class="modal-head"><div><div class="eyebrow">${approve?'APROVAR USUÁRIO':'REDEFINIR SENHA'}</div><h2>${approve?'Definir senha de acesso':'Nova senha do usuário'}</h2></div><button class="close" data-action="close-modal" aria-label="Fechar">×</button></div><form id="admin-password-form"><div class="modal-body"><p class="subtitle"><strong>${FP.escape(u.name)}</strong><br>${FP.escape(u.email)}</p><div class="field" style="margin-top:16px"><label>Nova senha *</label><input id="admin-password" type="password" minlength="12" required autocomplete="new-password"><small class="hint">Mínimo de 12 caracteres. Nenhuma senha será enviada por e-mail.</small></div><div class="field" style="margin-top:12px"><label>Confirmar senha *</label><input id="admin-password-confirm" type="password" minlength="12" required autocomplete="new-password"></div><div id="admin-password-feedback" class="login-hint"></div></div><div class="modal-foot"><button class="btn" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">${approve?'Aprovar e liberar acesso':'Salvar nova senha'}</button></div></form></div></div>`;
   this.passwordAction={mode,id};
 },
 async submitPasswordAction(){ this.closeModal(); },
 async approveUser(id){
   if(!FP.auth.isAdmin()) return;
   const u=FP.users.getById(id); if(!u || u.rawStatus!=='pending') return;
   if(!confirm(`Aprovar o cadastro de ${u.name}?\n\nO acesso será liberado com a senha definida pelo próprio usuário no cadastro.`)) return;
   try{await FP.users.approve(id);FP.toast('Cadastro aprovado. O acesso foi liberado.');this.render();}
   catch(e){FP.toast(e.message||'Não foi possível aprovar o cadastro.','error');}
 },
 async rejectUser(id){
   if(!FP.auth.isAdmin()) return;
   const u=FP.users.getById(id); if(!u || u.rawStatus!=='pending') return;
   if(!confirm(`Rejeitar o cadastro de ${u.name}?\n\nO usuário ficará sem acesso ao sistema.`)) return;
   try{await FP.users.reject(id);FP.toast('Cadastro rejeitado.');this.render();}
   catch(e){FP.toast(e.message||'Não foi possível rejeitar o cadastro.','error');}
 },
 async resetUserPassword(id){
   if(!FP.auth.isAdmin()) return;
   const u=FP.users.getById(id); if(!u) return;
   if(!confirm(`Enviar um link de redefinição de senha para ${u.email}?`)) return;
   try{await FP.users.resetPassword(id);FP.toast('Link de redefinição enviado.');}catch(e){FP.toast(e.message,'error');}
 },
 async setUserActive(id,isActive){
   if(!FP.auth.isAdmin()) return;
   const u=FP.users.getById(id); if(!u) return;
   if(isActive && u.rawStatus!=='deactivated'){
     if(u.rawStatus==='pending') FP.toast('Este usuário está pendente. Use “Aprovar cadastro”.','error');
     return;
   }
   if(!isActive && u.rawStatus!=='active') return;
   const action=isActive?'reativar':'desativar';
   if(!confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} o acesso de ${u.name}?`)) return;
   try{await FP.users.setActive(id,isActive);FP.toast(`Acesso ${isActive?'reativado':'desativado'}.`);this.render();}catch(e){FP.toast(e.message||'Não foi possível alterar o acesso.','error');}
 },
 async removeUser(id){return this.setUserActive(id,false);},
 async makeAdmin(id,makeAdmin=true){ if(!FP.auth.isAdmin())return; try{await FP.users.setAdmin(id,makeAdmin);FP.toast(makeAdmin?'Usuário promovido a administrador.':'Perfil de administrador removido.');this.render();}catch(e){FP.toast(e.message,'error');} },
 updateThemeButton(){
   const b=document.querySelector("#theme-toggle");
   if(!b)return;
   const dark=document.documentElement.dataset.theme==="dark";
   b.setAttribute("aria-label",dark?"Alternar para tema claro":"Alternar para tema escuro");
   b.setAttribute("title",dark?"Alternar para tema claro":"Alternar para tema escuro");
 },
 initTheme(){
   const saved=localStorage.getItem("fp_theme")||"dark";
   document.documentElement.dataset.theme=saved;
   this.updateThemeButton();
 },
 toggleTheme(){
   const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
   document.documentElement.dataset.theme=next;localStorage.setItem("fp_theme",next);
   this.updateThemeButton();
 },
updateRole(){
   const admin=FP.auth.isAdmin(); const user=FP.auth.user; this.state.role=admin?"admin":"user";
   document.querySelectorAll(".admin-only").forEach(x=>x.style.display=admin?"flex":"none");
   const role=document.querySelector("#role-pill"); if(role)role.textContent=admin?"Administrador":"Colaborador";
   const hr=document.querySelector("#header-role"); if(hr)hr.textContent=admin?"Administrador":"Colaborador";
   const pendingBadge=document.querySelector('#pending-users-badge');
   if(pendingBadge){const pending=admin?FP.users.all().filter(u=>u.rawStatus==='pending').length:0;pendingBadge.textContent=pending?String(pending):'';pendingBadge.hidden=!pending;}
   const hn=document.querySelector("#header-user-name"); if(hn)hn.textContent=user?.name||"Usuário";
   const avatar=document.querySelector(".avatar"); if(avatar)avatar.textContent=(user?.name||"U").split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase();
 },
 updateNotifications(){document.querySelector("#notification-dot").style.display=FP.notifications.unread().length?"block":"none"},
 render(){
   this.updateRole(); const root=document.querySelector("#view-root");
   if(!FP.auth.isLoggedIn()){this.renderLogin();return;}
   if(["admin-reservations","admin-rooms","audit","users"].includes(this.state.view)&&!FP.auth.isAdmin())this.state.view="dashboard";
   const map={dashboard:this.dashboard,rooms:this.roomsView,calendar:this.calendar,"my-reservations":this.myReservations,"admin-reservations":this.adminReservations,"admin-rooms":this.adminRooms,audit:this.audit,users:this.users};
   const fn=map[this.state.view]||this.dashboard;root.innerHTML=fn.call(this);document.querySelector("#page-title").textContent=this.title();
   this.updateNotifications();
 },
 title(){return ({dashboard:"Dashboard",rooms:"Salas",calendar:"Agenda","my-reservations":"Minhas reservas","admin-reservations":"Gestão de reservas","admin-rooms":"Gestão de salas",audit:"Auditoria",users:"Usuários e acesso"})[this.state.view]},
 dashboard(){
   const s=FP.admin.stats(), next=FP.reservations.all().filter(r=>r.status==="confirmed"&&new Date(FP.toISO(r.date,r.end))>=new Date()).sort((a,b)=>new Date(FP.toISO(a.date,a.start))-new Date(FP.toISO(b.date,b.start)))[0];
   const current=FP.auth.user; const displayName=FP.users.nameFromEmail(current?.email)||current?.name||"Usuário"; return `<div class="hero"><div><h2>Olá, ${FP.escape(displayName)}.</h2><p>Gerencie suas reuniões, consulte a disponibilidade das salas e encontre rapidamente o melhor espaço para cada encontro.</p></div><button class="btn" data-action="new-reservation">+ Nova reserva</button><div class="hero-art">▦</div></div>
   <div class="grid grid-4"><div class="card metric"><div class="metric-top"><span class="metric-label">Reservas hoje</span><span class="metric-icon">✓</span></div><div class="metric-value">${s.today}</div><div class="metric-note">confirmadas</div></div><div class="card metric"><div class="metric-top"><span class="metric-label">Salas ocupadas</span><span class="metric-icon">◉</span></div><div class="metric-value">${s.occupied}</div><div class="metric-note">neste momento</div></div><div class="card metric"><div class="metric-top"><span class="metric-label">Salas disponíveis</span><span class="metric-icon">○</span></div><div class="metric-value">${s.available}</div><div class="metric-note">para uso</div></div><div class="card metric"><div class="metric-top"><span class="metric-label">Canceladas</span><span class="metric-icon">×</span></div><div class="metric-value">${s.cancelled}</div><div class="metric-note">histórico total</div></div></div>
   <div class="split section-gap"><div class="card card-pad next-card">${next?`<div class="card-title"><h3>Próxima reunião</h3><span>Agenda</span></div><div class="next-time">${next.start} - ${next.end}</div><div class="next-room">${FP.escape(FP.rooms.get(next.roomId)?.name||"Sala")}</div><div class="next-title">${FP.escape(next.title)}</div><div class="subtitle">${FP.dateBR(next.date)} · ${next.participants} participantes</div>`:`<div class="empty"><div class="empty-icon">◫</div><strong>Nenhuma próxima reunião</strong><span>Você está livre por enquanto.</span></div>`}</div>
   <div class="card card-pad"><div class="card-title"><h3>Utilização por sala</h3><span>Total</span></div>${s.byRoom.map(x=>`<div class="mini-item"><div><strong>${FP.escape(x.room.name)}</strong><span>${x.count} reservas</span></div><strong>${Math.min(100,x.count*12)}%</strong></div>`).join("")}</div></div>
   <div class="card card-pad section-gap"><div class="card-title"><h3>Reservas recentes</h3><button class="btn small" data-view="admin-reservations">Ver todas</button></div>${this.reservationTable(FP.reservations.all().slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5),false)}</div>`;
 },
 roomsView(){
   return `<div class="page-head"><div><h1>Salas</h1><p class="subtitle">Consulte capacidade, recursos e disponibilidade.</p></div><div class="actions"><button class="btn primary" data-action="new-reservation">+ Reservar sala</button></div></div><div class="grid grid-3">${FP.rooms.active().map(r=>`<div class="card room-card"><div class="room-visual"><span class="room-code">${r.id}</span></div><div class="room-body"><h3>${FP.escape(r.name)}</h3><div class="room-meta">${r.capacity} pessoas</div><div class="feature-list">${r.features.map(f=>`<span class="feature">${FP.escape(f)}</span>`).join("")}</div><div class="availability"><i class="dot green"></i> Disponível para reserva</div></div></div>`).join("")}</div>`;
 },
 calendar(){
   const date=this.state.calendarDate,rooms=FP.rooms.active(),hours=['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
   const apiBusy=this.state.availabilityDate===date?this.state.availability:[];
   const localBusy=FP.reservations.all().filter(r=>r.status==='confirmed'&&r.date===date).map(r=>({room_id:r.roomId,starts_at:FP.toISO(r.date,r.start),ends_at:FP.toISO(r.date,r.end),title:r.title,local:true}));
   const busy=[...apiBusy];
   for(const item of localBusy){if(!busy.some(x=>x.room_id===item.room_id&&x.starts_at===item.starts_at&&x.ends_at===item.ends_at))busy.push(item);}
   const busyFor=(roomId,h)=>{const slotStart=FP.toISO(date,h),slotEnd=FP.toISO(date,`${String(Number(h.slice(0,2))+1).padStart(2,'0')}:00`);return busy.find(x=>x.room_id===roomId&&FP.overlap(slotStart,slotEnd,x.starts_at,x.ends_at));};
   const loading=!this.state.availabilityDate||this.state.availabilityDate!==date;
   const html=`<div class="page-head"><div><h1>Agenda</h1><p class="subtitle">Visualização diária da disponibilidade das salas.</p></div><div class="actions"><input id="calendar-date" type="date" value="${date}" onchange="App.state.calendarDate=this.value;App.state.availabilityDate=null;App.render();App.loadAvailability(this.value)"><button class="btn primary" data-action="new-reservation">+ Nova reserva</button></div></div>
   <div class="card card-pad"><div class="calendar"><div class="calendar-grid"><div class="cal-head"><div>Horário</div>${rooms.map(r=>`<div>${FP.escape(r.name)}</div>`).join('')}</div>${hours.map(h=>`<div class="cal-row"><div class="cal-time">${h}</div>${rooms.map(r=>{const found=busyFor(r.id,h);return `<div>${loading?`<div class="slot">Carregando…</div>`:found?`<div class="slot busy">Ocupado<br>${FP.time(found.starts_at)}–${FP.time(found.ends_at)}</div>`:`<div class="slot free" onclick="App.openReservation('${r.id}','${date}','${h}')">Disponível<br>Reservar</div>`}</div>`}).join('')}</div>`).join('')}</div></div></div>
   <div class="subtitle" style="margin-top:12px">Legenda: <b>Disponível</b> · Ocupado</div>`;
   setTimeout(()=>{if(loading)this.loadAvailability(date)},0);
   return html;
 },
 async loadAvailability(date){
   try{const rows=await FP.reservations.availability(date);this.state.availability=rows;this.state.availabilityDate=date;if(this.state.view==='calendar'&&this.state.calendarDate===date)this.render();}
   catch(e){this.state.availability=[];this.state.availabilityDate=date;if(this.state.view==='calendar')this.render();FP.toast(e.message||'Não foi possível consultar a disponibilidade.','error');}
 },
 myReservations(){
   const rs=FP.reservations.mine(FP.auth.user?.email);return `<div class="page-head"><div><h1>Minhas reservas</h1><p class="subtitle">Acompanhe e gerencie suas reservas.</p></div><button class="btn primary" data-action="new-reservation">+ Nova reserva</button></div>
   <div class="card card-pad"><div class="card-title"><h3>Próximas e anteriores</h3><span>${rs.length} registros</span></div>${this.reservationTable(rs,true)}</div>`;
 },
 adminReservations(){
   const rs=FP.reservations.all();return `<div class="page-head"><div><h1>Gestão de reservas</h1><p class="subtitle">Pesquise, filtre, edite e cancele reservas.</p></div><button class="btn primary" data-action="new-reservation">+ Criar reserva</button></div>
   <div class="card card-pad"><div class="filter-row"><input id="admin-search" placeholder="Pesquisar usuário ou título..." oninput="App.filterAdmin()"><select id="admin-room" onchange="App.filterAdmin()"><option value="">Todas as salas</option>${FP.rooms.all().map(r=>`<option value="${r.id}">${r.name}</option>`).join("")}</select><select id="admin-status" onchange="App.filterAdmin()"><option value="">Todos os status</option><option value="confirmed">Confirmadas</option><option value="cancelled">Canceladas</option></select></div><div id="admin-table">${this.reservationTable(rs,false,true)}</div></div>`;
 },
 filterAdmin(){
   const q=(document.querySelector("#admin-search")?.value||"").toLowerCase(),room=document.querySelector("#admin-room")?.value,status=document.querySelector("#admin-status")?.value;
   let rs=FP.reservations.all().filter(r=>(!q||`${r.name} ${r.title}`.toLowerCase().includes(q))&&(!room||r.roomId===room)&&(!status||r.status===status));
   document.querySelector("#admin-table").innerHTML=this.reservationTable(rs,false,true);
 },
 reservationTable(rs,onlyMine=false,admin=false){
   if(!rs.length)return `<div class="empty"><div class="empty-icon">◫</div><strong>Nenhuma reserva encontrada</strong><span>Crie uma nova reserva para começar.</span></div>`;
   return `<div class="table-wrap"><table class="table"><thead><tr><th>Reunião</th><th>Responsável</th><th>Sala</th><th>Data</th><th>Horário</th><th>Participantes</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rs.map(r=>`<tr><td><strong>${FP.escape(r.title)}</strong><br><span class="hint">${FP.escape(r.department)}</span></td><td>${FP.escape(r.name)}</td><td>${FP.escape(FP.rooms.get(r.roomId)?.name||r.roomId)}</td><td>${FP.dateBR(r.date)}</td><td>${r.start}–${r.end}</td><td>${1+(Array.isArray(r.participants)?r.participants.length:Number(r.participantCount||0))}</td><td><span class="status ${r.status}">${r.status==='confirmed'?'Confirmada':'Cancelada'}</span></td><td>${r.status==='confirmed'&&admin?`<div class="actions"><button class="btn small" data-action="edit-reservation" data-id="${r.id}">Alterar</button><button class="btn small danger" data-action="admin-cancel" data-id="${r.id}">Cancelar</button></div>`:r.status==='confirmed'&&onlyMine?`<button class="btn small danger" data-action="cancel" data-id="${r.id}">Cancelar</button>`:'-'}</td></tr>`).join('')}</tbody></table></div>`;
 },
 adminRooms(){
   return `<div class="page-head"><div><h1>Gestão de salas</h1><p class="subtitle">Cadastre e mantenha capacidade, descrição e recursos das salas.</p></div><button class="btn primary" data-action="new-room">+ Nova sala</button></div>
   <div class="grid grid-2">${FP.rooms.all().map(r=>`<div class="card card-pad"><div class="card-title"><h3>${FP.escape(r.name)}</h3><span class="status ${r.active?'confirmed':'cancelled'}">${r.active?'Ativa':'Desativada'}</span></div><div class="detail-list"><div class="detail"><span>Capacidade</span><strong>${r.capacity} pessoas</strong></div><div class="detail"><span>Descrição</span><strong>${FP.escape(r.description||'-')}</strong></div></div><div class="feature-list">${r.resources.length?r.resources.map(f=>`<span class="feature">${FP.escape(f)}</span>`).join(''):'<span class="hint">Sem recursos cadastrados</span>'}</div><div class="actions" style="margin-top:14px"><button class="btn small" data-action="edit-room" data-id="${r.id}">Editar</button>${r.active?`<button class="btn small danger" data-action="deactivate-room" data-id="${r.id}">Desativar</button>`:`<button class="btn small" data-action="activate-room" data-id="${r.id}">Reativar</button>`}</div></div>`).join('')}</div>`;
 },
 users(){
   const users=FP.users.all();
   const pending=users.filter(u=>u.rawStatus==='pending');
   const active=users.filter(u=>u.rawStatus==='active');
   const inactive=users.filter(u=>u.rawStatus==='deactivated');
   const rowDetails=u=>`<div class="user-detail-line"><strong>${FP.escape(u.name)}</strong><span>${FP.escape(u.email)}</span></div>`;
   return `<div class="page-head"><div><h1>Usuários e acesso</h1><p class="subtitle">Gerencie acesso, área, cargo e dados profissionais dos colaboradores.</p></div><button class="btn primary" data-action="new-user">+ Novo usuário</button></div>
   <div class="grid grid-4">
     <div class="card metric"><div class="metric-top"><span class="metric-label">Ativos</span><span class="metric-icon">✓</span></div><div class="metric-value">${active.length}</div><div class="metric-note">acesso liberado</div></div>
     <div class="card metric"><div class="metric-top"><span class="metric-label">Pendentes</span><span class="metric-icon">!</span></div><div class="metric-value">${pending.length}</div><div class="metric-note">aguardando aprovação</div></div>
     <div class="card metric"><div class="metric-top"><span class="metric-label">Administradores</span><span class="metric-icon">◆</span></div><div class="metric-value">${users.filter(u=>u.role==='admin'&&u.rawStatus==='active').length}</div><div class="metric-note">perfis administrativos</div></div>
     <div class="card metric"><div class="metric-top"><span class="metric-label">Desativados</span><span class="metric-icon">×</span></div><div class="metric-value">${inactive.length}</div><div class="metric-note">sem acesso</div></div>
   </div>
   <div class="notice info section-gap"><b>Gestão de perfil:</b> a área, cargo e telefone podem ser atualizados pelo Administrador sempre que houver mudança de função ou estrutura.</div>
   ${pending.length?`<div class="card card-pad section-gap"><div class="card-title"><div><h3>Solicitações pendentes</h3><span class="subtitle">Revise e, se necessário, ajuste os dados antes de liberar o acesso.</span></div><span class="status warning">${pending.length} pendente(s)</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Área</th><th>Cargo</th><th>Telefone</th><th>Solicitado em</th><th>Ações</th></tr></thead><tbody>${pending.map(u=>`<tr><td>${rowDetails(u)}</td><td>${FP.escape(u.email)}</td><td>${FP.escape(u.department||'-')}</td><td>${FP.escape(u.position||'-')}</td><td>${FP.escape(u.phone||'-')}</td><td>${u.createdAt?FP.formatDateTime(u.createdAt):'-'}</td><td><div class="actions"><button class="btn small" data-action="edit-user-profile" data-id="${u.id}">Editar dados</button><button class="btn small primary" data-action="approve-user" data-id="${u.id}">Aprovar cadastro</button><button class="btn small danger" data-action="reject-user" data-id="${u.id}">Rejeitar</button></div></td></tr>`).join('')}</tbody></table></div></div>`:''}
   <div class="card card-pad section-gap"><div class="card-title"><div><h3>Usuários ativos</h3><span class="subtitle">Contas atualmente autorizadas a utilizar o sistema.</span></div><span>${active.length} usuário(s)</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Área</th><th>Cargo</th><th>Telefone</th><th>Perfil</th><th>Ações</th></tr></thead><tbody>${active.map(u=>`<tr><td>${rowDetails(u)}</td><td>${FP.escape(u.email)}</td><td>${FP.escape(u.department||'-')}</td><td>${FP.escape(u.position||'-')}</td><td>${FP.escape(u.phone||'-')}</td><td><span class="status ${u.role==='admin'?'confirmed':'blocked'}">${u.role==='admin'?'Administrador':'Colaborador'}</span></td><td><div class="actions"><button class="btn small" data-action="edit-user-profile" data-id="${u.id}">Editar dados</button>${u.id===FP.auth.user?.id?'<span class="hint">Administrador atual</span>':`${u.role==='admin'?`<button class="btn small" data-action="remove-admin" data-id="${u.id}">Tornar colaborador</button>`:`<button class="btn small" data-action="make-admin" data-id="${u.id}">Tornar admin</button>`}<button class="btn small" data-action="reset-user-password" data-id="${u.id}">Redefinir senha</button><button class="btn small danger" data-action="deactivate-user" data-id="${u.id}">Desativar</button>`}</div></td></tr>`).join('')}</tbody></table></div></div>
   ${inactive.length?`<div class="card card-pad section-gap"><div class="card-title"><div><h3>Usuários desativados</h3><span class="subtitle">Contas sem acesso que podem ser reativadas.</span></div><span>${inactive.length}</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Área</th><th>Cargo</th><th>Telefone</th><th>Perfil</th><th>Ação</th></tr></thead><tbody>${inactive.map(u=>`<tr><td>${rowDetails(u)}</td><td>${FP.escape(u.email)}</td><td>${FP.escape(u.department||'-')}</td><td>${FP.escape(u.position||'-')}</td><td>${FP.escape(u.phone||'-')}</td><td><span class="status cancelled">${u.role==='admin'?'Administrador':'Colaborador'}</span></td><td><div class="actions"><button class="btn small" data-action="edit-user-profile" data-id="${u.id}">Editar dados</button><button class="btn small" data-action="activate-user" data-id="${u.id}">Reativar</button></div></td></tr>`).join('')}</tbody></table></div></div>`:''}`;
 },
 audit(){
   const rows=FP.audit.all();
   const actions=[...new Map(rows.map(x=>[x.actionCode,x.action])).entries()];
   return `<div class="page-head"><div><h1>Auditoria</h1><p class="subtitle">Rastreabilidade das principais ações do sistema, com linguagem de negócio.</p></div></div>
   <div class="card card-pad"><div class="filter-row audit-filters"><input id="audit-search" placeholder="Pesquisar ação, usuário, alvo ou detalhe..." oninput="App.filterAudit()"><select id="audit-action" onchange="App.filterAudit()"><option value="">Todas as ações</option>${actions.map(([code,label])=>`<option value="${FP.escape(code)}">${FP.escape(label)}</option>`).join('')}</select></div><div id="audit-table">${this.auditTable(rows)}</div></div>`;
 },
 auditTable(rows){
   if(!rows.length)return `<div class="empty"><div class="empty-icon">◌</div><strong>Nenhum registro encontrado</strong><span>Ajuste os filtros ou realize uma nova operação.</span></div>`;
   return `<div class="table-wrap"><table class="table audit-table"><thead><tr><th>Data/hora</th><th>Ação</th><th>Usuário</th><th>Alvo</th><th>Detalhe</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.at?FP.formatDateTime(x.at):'-'}</td><td><span class="audit-action">${FP.escape(x.action)}</span></td><td>${FP.escape(x.user)}</td><td><strong>${FP.escape(x.target)}</strong></td><td><span class="audit-detail">${FP.escape(x.detail)}</span></td></tr>`).join('')}</tbody></table></div>`;
 },
 filterAudit(){
   const q=(document.querySelector('#audit-search')?.value||'').trim().toLowerCase();
   const action=document.querySelector('#audit-action')?.value||'';
   const rows=FP.audit.all().filter(x=>(!action||x.actionCode===action)&&(!q||`${x.action} ${x.user} ${x.target} ${x.detail}`.toLowerCase().includes(q)));
   const root=document.querySelector('#audit-table'); if(root) root.innerHTML=this.auditTable(rows);
 },
 openReservation(roomId='',date=FP.todayISO(),start='',editId=null){
   this.editingReservationId=editId;
   const existing=editId?FP.reservations.all().find(r=>r.id===editId):null;
   const room=roomId?FP.rooms.get(roomId):(existing?FP.rooms.get(existing.roomId):FP.rooms.active()[0]);
   const d=existing?.date||date||FP.todayISO(),s=existing?.start||start||'09:00',end=existing?.end||(FP.addMinutes(FP.toISO(d,s),60).toTimeString().slice(0,5));
   const admin=FP.auth.isAdmin();
   const selectedOwner=existing?.responsibleUserId||FP.auth.user?.id;
   const ownerOptions=admin?FP.users.all().filter(u=>u.rawStatus==='active'||u.status==='approved').map(u=>`<option value="${u.id}" ${u.id===selectedOwner?'selected':''}>${FP.escape(u.name)} · ${FP.escape(u.email)}</option>`).join(''):'';
   const participantText=Array.isArray(existing?.participants)?existing.participants.join('\n'):'';
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${existing?'Alterar reserva':'Nova reserva'}</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div id="booking-alert"></div><div class="form-grid">
   ${admin?`<div class="field full"><label>Responsável *</label><select id="f-responsible">${ownerOptions}</select></div>`:''}
   <div class="field"><label>Nome completo</label><input id="f-name" value="${FP.escape(existing?.name||FP.auth.user?.name||'Não informado')}" readonly></div><div class="field"><label>E-mail corporativo</label><input id="f-email" value="${FP.escape(existing?.email||FP.auth.user?.email||'Não informado')}" readonly></div><div class="field"><label>Área/departamento</label><input id="f-dept" value="${FP.escape(existing?.department||FP.auth.user?.department||'Não informado')}" readonly></div><div class="field"><label>Cargo/função</label><input id="f-position" value="${FP.escape(existing?.position||FP.auth.user?.position||'Não informado')}" readonly></div><div class="field"><label>Telefone/ramal</label><input id="f-phone" value="${FP.escape(existing?.phone||FP.auth.user?.phone||'Não informado')}" readonly></div><div class="field"><label>Título da reunião *</label><input id="f-title" value="${FP.escape(existing?.title||'')}" placeholder="Ex.: Reunião de alinhamento" required></div><div class="field"><label>Data *</label><input id="f-date" type="date" value="${d}" min="${FP.todayISO()}" required></div><div class="field"><label>Sala *</label><select id="f-room" required>${FP.rooms.active().map(r=>`<option value="${r.id}" ${r.id===room?.id?'selected':''}>${FP.escape(r.name)} · até ${r.capacity} pessoas</option>`).join('')}</select></div><div class="field"><label>Horário de início *</label><select id="f-start" required>${FP.timeSlots('08:00','18:45',15).map(t=>`<option value="${t}" ${t===s?'selected':''}>${t}</option>`).join('')}</select><small class="hint">Intervalos de 15 minutos.</small></div><div class="field"><label>Horário de término *</label><select id="f-end" required>${FP.timeSlots('08:15','19:00',15).map(t=>`<option value="${t}" ${t===end?'selected':''}>${t}</option>`).join('')}</select></div><div class="field full"><label>Participantes (e-mails)</label><textarea id="f-participants" rows="3" placeholder="um e-mail por linha ou separados por vírgula">${FP.escape(participantText)}</textarea><small class="hint">O responsável não precisa ser repetido. A capacidade inclui o responsável + participantes.</small></div><div class="field full"><label>Recursos solicitados</label><div id="resource-options" class="check-grid">${(room?.resources||[]).length?(room.resources.map(x=>`<label class="check"><input type="checkbox" value="${FP.escape(x)}" ${existing?.resources?.includes(x)?'checked':''}>${FP.escape(x)}</label>`).join('')):'<span class="hint">Nenhum recurso cadastrado para esta sala.</span>'}</div></div><div class="field full"><label>Objetivo / descrição</label><textarea id="f-description" placeholder="Descreva brevemente o objetivo da reunião">${FP.escape(existing?.description||'')}</textarea></div></div><div class="notice info" style="margin-top:14px">${existing?'A alteração só será confirmada se não criar conflito com outra agenda.':'A confirmação verifica conflito, capacidade, antecedência, duração e recursos da sala.'}</div></div><div class="modal-foot"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn primary" data-action="confirm-booking">${existing?'Salvar alteração':'Continuar para revisão'}</button></div></div></div>`;
   document.querySelector('#f-room')?.addEventListener('change',()=>this.refreshReservationResources());
   document.querySelector('#f-start')?.addEventListener('change',()=>{const start=document.querySelector('#f-start').value;const end=document.querySelector('#f-end');const options=[...end.options];const first=options.find(o=>o.value>start);if(first)end.value=first.value;});
 },
 refreshReservationResources(){
   const room=FP.rooms.get(document.querySelector('#f-room')?.value);const box=document.querySelector('#resource-options');if(!box)return;const selected=[...box.querySelectorAll('input:checked')].map(x=>x.value);
   box.innerHTML=(room?.resources||[]).length?room.resources.map(x=>`<label class="check"><input type="checkbox" value="${FP.escape(x)}" ${selected.includes(x)?'checked':''}>${FP.escape(x)}</label>`).join(''):'<span class="hint">Nenhum recurso cadastrado para esta sala.</span>';
 },
 bookingData(){
   const owner=document.querySelector('#f-responsible')?.value||FP.auth.user.id;
   const ownerProfile=FP.users.getById(owner)||FP.auth.user;
   return {name:ownerProfile?.name||'',email:ownerProfile?.email||'',department:ownerProfile?.department||'',responsibleUserId:owner,title:document.querySelector('#f-title').value.trim(),date:document.querySelector('#f-date').value,start:document.querySelector('#f-start').value,end:document.querySelector('#f-end').value,roomId:document.querySelector('#f-room').value,participants:FP.reservations.parseParticipants(document.querySelector('#f-participants').value),resources:[...document.querySelectorAll('#resource-options input:checked')].map(x=>x.value),description:document.querySelector('#f-description').value.trim()};
 },
 async confirmBooking(){
   const data=this.bookingData(),errors=FP.reservations.validate(data,this.editingReservationId),alert=document.querySelector('#booking-alert');
   if(errors.length){let suggestions=this.suggest(data);alert.innerHTML=`<div class="notice error">${errors.map(x=>`• ${FP.escape(x)}`).join('<br>')}</div>${suggestions}`;return;}
   const room=FP.rooms.get(data.roomId);alert.innerHTML=`<div class="summary"><div class="card-title"><h3>${this.editingReservationId?'Confira a alteração':'Confira sua reserva'}</h3></div>${[['Sala',room.name],['Data',FP.dateBR(data.date)],['Horário',`${data.start}–${data.end}`],['Participantes',1+data.participants.length],['Responsável',data.name],['Título',data.title]].map(x=>`<div class="summary-row"><span>${x[0]}</span><strong>${FP.escape(String(x[1]))}</strong></div>`).join('')}</div>`;
   const foot=document.querySelector('.modal-foot');foot.innerHTML=`<button class="btn" data-action="close-modal">Voltar</button><button class="btn primary" id="finalize">${this.editingReservationId?'Confirmar alteração':'Confirmar reserva'}</button>`;
   const originView=this.state.view;
   document.querySelector('#finalize').onclick=async()=>{const button=document.querySelector('#finalize');button.disabled=true;button.textContent=this.editingReservationId?'Salvando alteração...':'Confirmando reserva...';const result=this.editingReservationId?await FP.reservations.update(this.editingReservationId,data):await FP.reservations.create(data);if(result.ok){const keepCalendar=originView==='calendar';this.closeModal();FP.toast(this.editingReservationId?'Reserva alterada com sucesso.':'Reserva criada com sucesso.');this.editingReservationId=null;this.state.view=originView;this.state.availabilityDate=null;this.render();if(keepCalendar){await this.loadAvailability(this.state.calendarDate);}else if(originView==='my-reservations'||originView==='admin-reservations'||originView==='dashboard'){this.render();}}else{button.disabled=false;button.textContent=this.editingReservationId?'Confirmar alteração':'Confirmar reserva';alert.innerHTML=`<div class="notice error">${result.errors.map(x=>`• ${FP.escape(x)}`).join('<br>')}</div>`;}};
 },
 suggest(data){
   const alternatives=[];const room=FP.rooms.get(data.roomId);const rs=FP.reservations.forRoom(data.roomId,data.date);
   for(let h=8;h<19&&alternatives.length<3;h++){const s=String(h).padStart(2,"0")+":00",e=String(h+1).padStart(2,"0")+":00",open=room?.open||'08:00',close=room?.close||'19:00';if(s>=open&&e<=close&&!rs.some(r=>FP.overlap(FP.toISO(data.date,r.start),FP.toISO(data.date,r.end),FP.toISO(data.date,s),FP.toISO(data.date,e))))alternatives.push(`${s}–${e}`)}
   const other=FP.rooms.active().find(r=>r.id!==data.roomId&&r.capacity>=Number(data.participants)&&!FP.reservations.forRoom(r.id,data.date).some(x=>FP.overlap(FP.toISO(data.date,x.start),FP.toISO(data.date,x.end),FP.toISO(data.date,data.start),FP.toISO(data.date,data.end))));
   return `<div class="notice warning"><b>Sugestões:</b> ${alternatives.length?`horários ${alternatives.join(", ")}`:"nenhum horário próximo encontrado."}${other?` · ${FP.escape(other.name)} está disponível no período solicitado.`:""}</div>`;
 },
 closeModal(){document.querySelector("#modal-root").innerHTML=""},
 async cancelReservation(id){if(confirm('Cancelar esta reserva?')){if(await FP.reservations.cancel(id)){FP.toast('Reserva cancelada.');this.state.availabilityDate=null;this.render();if(this.state.view==='calendar')await this.loadAvailability(this.state.calendarDate);}}},
 async adminCancel(id){const reason=prompt('Informe o motivo do cancelamento administrativo:');if(!reason?.trim()){FP.toast('O motivo é obrigatório.','error');return}if(await FP.reservations.cancel(id,reason,FP.auth.user?.name)){FP.toast('Reserva cancelada e registrada na auditoria.');this.state.availabilityDate=null;this.render();if(this.state.view==='calendar')await this.loadAvailability(this.state.calendarDate);}},
 roomModal(id){
   const r=id?FP.rooms.get(id):{name:'',description:'',capacity:10,resources:[]};
   const common=['TV','Videoconferência','Quadro branco','Projetor','Ar-condicionado','Tomadas'];
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${id?'Editar sala':'Nova sala'}</h2><button class="close" data-action="close-modal">×</button></div><form id="room-form"><div class="modal-body"><div id="room-feedback"></div><div class="form-grid"><div class="field full"><label>Nome *</label><input id="r-name" value="${FP.escape(r.name)}" required></div><div class="field"><label>Capacidade *</label><input id="r-cap" type="number" min="1" value="${r.capacity||10}" required></div><div class="field full"><label>Descrição</label><textarea id="r-description" placeholder="Descrição da sala">${FP.escape(r.description||'')}</textarea></div><div class="field full"><label>Recursos</label><div class="check-grid">${common.map(x=>`<label class="check"><input type="checkbox" value="${FP.escape(x)}" ${r.resources.map(String).includes(x)?'checked':''}>${FP.escape(x)}</label>`).join('')}</div></div></div></div><div class="modal-foot"><button class="btn" type="button" data-action="close-modal">Cancelar</button><button class="btn primary" type="submit">${id?'Salvar alterações':'Criar sala'}</button></div></form></div></div>`;
   document.querySelector('#room-form').onsubmit=async(e)=>{e.preventDefault();const feedback=document.querySelector('#room-feedback'),button=document.querySelector('#room-form button[type="submit"]');const data={name:document.querySelector('#r-name').value.trim(),capacity:Number(document.querySelector('#r-cap').value),description:document.querySelector('#r-description').value.trim(),resources:[...document.querySelectorAll('#room-form .check input:checked')].map(x=>x.value)};if(!data.name||!data.capacity){feedback.innerHTML='<div class="notice error">Nome e capacidade são obrigatórios.</div>';return;}try{button.disabled=true;button.textContent=id?'Salvando alterações...':'Criando sala...';if(id)await FP.rooms.update(id,data);else await FP.rooms.create(data);this.closeModal();FP.toast(id?'Sala atualizada com sucesso.':'Sala criada com sucesso.');this.render();}catch(e){feedback.innerHTML=`<div class="notice error">${FP.escape(e.message||'Não foi possível salvar a sala.')}</div>`;button.disabled=false;button.textContent=id?'Salvar alterações':'Criar sala';}};
 },
 async deactivateRoom(id){await this.toggleRoom(id,false)},
 async activateRoom(id){await this.toggleRoom(id,true)},
 async toggleRoom(id,isActive){if(!FP.auth.isAdmin())return;const r=FP.rooms.get(id);if(!r)return;const action=isActive?'reativar':'desativar';if(!confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} a sala ${r.name}?`))return;try{await FP.rooms.setActive(id,isActive);FP.toast(`Sala ${isActive?'reativada':'desativada'} com sucesso.`);this.render();}catch(e){FP.toast(e.message||`Não foi possível ${action} a sala.`,'error');}},
 showNotifications(){
   const n=FP.notifications.all();
   FP.notifications.markAll();
   this.updateNotifications();
   const iconBell=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`;
   const iconCancel=`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M9 14l6 6M15 14l-6 6"/></svg>`;
   const iconInfo=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>`;
   const iconCalendar=`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>`;
   const items=n.slice(0,10).map(x=>{
     const title=String(x.title||'Notificação');
     const message=String(x.message||'');
     const isDanger=/cancelad/i.test(title);
     const isWarning=/atenção|alerta|pendente/i.test(title);
     const tone=isDanger?'is-danger':isWarning?'is-warning':'';
     const icon=isDanger?iconCancel:iconBell;
     const reasonMatch=message.match(/\s*Motivo:\s*(.+)$/i);
     const mainMessage=(reasonMatch?message.slice(0,reasonMatch.index):message).trim();
     const reason=reasonMatch?reasonMatch[1].trim():'';
     const dt=new Date(x.createdAt);
     const date=Number.isNaN(dt.getTime())?FP.escape(FP.formatDateTime(x.createdAt)):dt.toLocaleDateString('pt-BR');
     const time=Number.isNaN(dt.getTime())?'':dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
     return `<article class="notification-item ${tone}">
       <div class="notification-icon">${icon}</div>
       <div class="notification-copy">
         <strong class="notification-title">${FP.escape(title)}</strong>
         <span class="notification-message">${FP.escape(mainMessage)}</span>
         ${reason?`<span class="notification-reason">${iconInfo}<span><b>Motivo:</b> ${FP.escape(reason)}</span></span>`:''}
       </div>
       <time class="notification-date">${iconCalendar}<span>${FP.escape(date)}${time?`<br>${FP.escape(time)}`:''}</span></time>
     </article>`;
   }).join('');
   document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal notification-modal"><div class="modal-head"><h2><span class="notification-heading-icon">${iconBell}</span>Notificações</h2><button class="close" data-action="close-modal" aria-label="Fechar notificações">×</button></div><div class="modal-body"><div class="notification-list">${items||'<div class="empty notification-empty"><div class="empty-icon">🔔</div><strong>Nenhuma notificação</strong><span>Você está em dia. Novas atualizações aparecerão aqui.</span></div>'}</div></div></div></div>`;
 }
};
window.App=App;document.addEventListener("DOMContentLoaded",()=>App.init());
