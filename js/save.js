'use strict';
function save(){
  S.saved=Date.now();
  try{ localStorage.setItem(SAVE_KEY,JSON.stringify(S)); }catch(e){}
}
function load(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const d=JSON.parse(raw);
    S=Object.assign(defaultState(),d);
    if(!Array.isArray(S.seen)||!S.seen.length) S.seen=['script'];
    if(!S.ttt) S.ttt={wins:0,losses:0,draws:0};
    S.prestige  = S.prestige  || 0;
    S.exploits  = S.exploits  || 0;
    return true;
  }catch(e){ return false; }
}
function offlineGains(){
  const away=(Date.now()-S.saved)/1000;
  if(away<60) return;
  recalc();
  if(bps<=0) return;
  const capped=Math.min(away,8*3600);
  const gain=bps*capped*0.5;
  S.bits+=gain; S.total+=gain;
  toast('BEM-VINDO DE VOLTA','seus scripts mineraram '+fmt(gain)+' bits enquanto você dormia','gold');
  log('ganho offline: +'+fmt(gain)+' bits ('+Math.floor(capped/60)+' min a 50%)','warn');
}

/* ---- header buttons ---- */
$('#btn-mute').addEventListener('click',()=>{
  S.muted=!S.muted;
  $('#btn-mute').textContent='[som: '+(S.muted?'off':'on')+']';
});
$('#btn-reset').addEventListener('click',()=>{
  if(!confirm('Apagar TODO o progresso e começar do zero?')) return;
  localStorage.removeItem(SAVE_KEY);
  window.removeEventListener('beforeunload',save);
  location.reload();
});

/* ---- recurring intervals ---- */
setInterval(tick, 100);
setInterval(checkAch, 1000);
setInterval(missionTick, 400);
setInterval(save, 10000);
setInterval(()=>{ if(Math.random()<0.6) log(LOG_POOL[Math.floor(Math.random()*LOG_POOL.length)]); }, 7000);
window.addEventListener('beforeunload', save);

/* ---- init ---- */
(function init(){
  const had=load();
  if(had) offlineGains();
  recalc();
  applyLoc();
  $('#btn-mute').textContent='[som: '+(S.muted?'off':'on')+']';
  renderShop();
  updateRoom();
  updateRank(true);
  renderMission();
  updateCounters();
  updatePrestigeBtn();
  termLine(had?'sessão restaurada. bem-vindo de volta.':'sistema iniciado. clique no terminal pra minerar bits.',true);
  log(had?'save carregado do disco':'novo operador registrado na rede','evt');
  renderPrompt();
  lastTick=Date.now();
})();
