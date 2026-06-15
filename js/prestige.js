'use strict';
const elPrestigeModal=$('#prestige-modal');
const elPrestigeGain=$('#prestige-gain');
const elPrestigeInfo=$('#prestige-info');
const elBtnPrestige=$('#btn-prestige');

function updatePrestigeBtn(){
  const eligible = S.total >= 1e9;
  const hasPrestige = (S.prestige||0) > 0;
  elBtnPrestige.style.display = (eligible || hasPrestige) ? '' : 'none';
  elBtnPrestige.disabled = !eligible;
  elBtnPrestige.style.opacity = eligible ? '1' : '0.45';
  if(hasPrestige){
    elPrestigeInfo.style.display='';
    elPrestigeInfo.textContent=
      '⚡ run #'+(S.prestige)+' · '+S.exploits+' exploit'+(S.exploits!==1?'s':'')+
      ' · ×'+prestigeMultiplier().toFixed(1);
  } else {
    elPrestigeInfo.style.display='none';
  }
}

elBtnPrestige.addEventListener('click',()=>{
  if(S.total < 1e9) return;
  const gain = exploitsForPrestige();
  const newMult = 1 + ((S.exploits||0) + gain) * 0.1;
  elPrestigeGain.textContent =
    '+'+gain+' exploit'+(gain>1?'s':'')+
    ' → multiplicador permanente: ×'+newMult.toFixed(1)+
    ' (todos os bits/s e cliques)';
  elPrestigeModal.classList.add('open');
});

$('#prestige-cancel').addEventListener('click',()=>{
  elPrestigeModal.classList.remove('open');
});

$('#prestige-confirm').addEventListener('click',()=>{
  elPrestigeModal.classList.remove('open');
  doPrestige();
});

function doPrestige(){
  const gain = exploitsForPrestige();
  /* preserve cross-run data */
  const keep = {
    prestige: (S.prestige||0) + 1,
    exploits: (S.exploits||0) + gain,
    ach:      [...S.ach],
    ttt:      {...S.ttt},
    muted:    S.muted,
    clicks:   S.clicks,
    goldClicks: S.goldClicks,
    adsClosed:  S.adsClosed,
  };
  S = defaultState();
  Object.assign(S, keep);

  recalc();
  applyLoc();
  renderShop();
  updateRoom();
  updateRank(true);
  renderMission();
  updateCounters();
  updatePrestigeBtn();

  /* reset timing so events don't fire immediately */
  nextPacket = Date.now() + 30000;
  nextDuel   = Date.now() + 120000;
  nextEvento = Date.now() + 45000;
  nextAds    = Date.now() + 90000;

  document.body.classList.remove('glitching');
  void document.body.offsetWidth;
  document.body.classList.add('glitching');

  sndPrestige();
  toast(
    '⚡ KERNEL PANIC #'+S.prestige,
    '+'+gain+' exploit'+(gain>1?'s':'')+
    ' · multiplicador permanente ×'+prestigeMultiplier().toFixed(1)+
    ' · boa sorte na próxima run',
    'rank'
  );
  log('KERNEL PANIC #'+S.prestige+': +'+gain+' exploits | ×'+prestigeMultiplier().toFixed(1)+' permanente','evt');
  termLine('sistema resetado. exploits carregados. que começa a próxima run.',true);

  checkAch();
}
