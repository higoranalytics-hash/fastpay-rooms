(function(){
  const cfg = window.FP_SUPABASE_CONFIG || {};
  if (!cfg.url || cfg.url.startsWith('COLE_AQUI') || !cfg.anonKey || cfg.anonKey.startsWith('COLE_AQUI')) {
    console.warn('[FastPay Rooms] Configure js/supabase-config.js before testing Supabase.');
    window.FP_SUPABASE_READY = false;
    return;
  }
  window.supabase = window.supabase || {};
  window.FP_SUPABASE = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'fastpay-rooms-auth'
    }
  });
  window.FP_SUPABASE_READY = true;
})();
