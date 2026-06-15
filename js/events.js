'use strict';
/* ---- terminal / invasion event ---- */
const elTyped=$('#typed'), elGhost=$('#ghost'), elEvento=$('#evento'),
      elKbd=$('#kbd-input'), elPrompt=$('#term-prompt');
let curCmd=null, typedLen=0, combo=0, lastCmdAt=0;

function subst(t){
  return t.replace(/\{n\}/g,()=>Math.floor(Math.random()*900+100))
          .replace(/\{h\}/g,()=>Math.floor(Math.random()*0xFFFF).toString(16).toUpperCase());
}
function newCmd(){
  const start=Math.min(Math.floor(combo*0.8), CMDS.length-4);
  curCmd=CMDS[start+Math.floor(Math.random()*4)];
  typedLen=0;
  renderPrompt();
}
function renderPrompt(){
  if(eventOn&&curCmd){
    elPrompt.style.display='block';
    elTyped.textContent=curCmd.c.slice(0,typedLen);
    elGhost.textContent=curCmd.c.slice(typedLen);
  } else {
    elPrompt.style.display='none';
    elTyped.textContent='';
    elGhost.textContent='';
  }
}

const EVENT_MS=10000, EVENT_MIN_MS=4000, EVENT_HARD_MS=120000;
let eventBits=0, eventStart=0;
function eventMult(){ return 10+2*Math.min(combo,20); }
function cmdWindow(){ return Math.max(EVENT_MIN_MS, EVENT_MS-combo*350); }

const elEvtMult=$('#evento-mult'), elEvtFill=$('#evento-fill'),
      elEvtSecs=$('#evento-secs'), elEvtGain=$('#evento-gain'),
      elEvtTotal=$('#evento-total');
const elEvtModal=$('#evt-modal');

function offerEvento(){
  evtModalOpen=true;
  $('#evt-msg').textContent='uma janela de invasão foi detectada na rede. digite os comandos exibidos antes do temporizador zerar — cada ENTER renova o tempo e aumenta o multiplicador. quanto mais comandos você encadeia, mais longos eles ficam e menos tempo você tem. o evento dura no máximo 2 minutos.';
  elEvtModal.classList.add('open');
  log('janela de invasão detectada — aceite pra digitar e saquear','evt');
  sndGold();
}
$('#evt-accept').addEventListener('click',()=>{
  elEvtModal.classList.remove('open');
  evtModalOpen=false;
  startEvento();
});
$('#evt-ignore').addEventListener('click',()=>{
  elEvtModal.classList.remove('open');
  evtModalOpen=false;
  log('você ignorou a janela de invasão. ela fechou.','warn');
  nextEvento=Date.now()+(60+Math.random()*60)*1000;
});

function startEvento(){
  eventOn=true; combo=0; eventBits=0; lastCmdAt=Date.now(); eventStart=Date.now();
  elEvento.classList.add('on');
  refreshEventoUI();
  newCmd();
  toast('⚡ EVENTO: INVASÃO','digite os comandos antes do temporizador zerar — cada ENTER renova o tempo','gold');
  termLine('!! janela de invasão aberta — digite os comandos !!',true);
  document.body.classList.remove('glitching'); void document.body.offsetWidth;
  document.body.classList.add('glitching');
  elKbd.focus({preventScroll:true});
}
function refreshEventoUI(){
  elEvento.classList.remove('low');
  elEvtMult.textContent='bits ×'+eventMult().toFixed(1);
  elEvtSecs.textContent=(cmdWindow()/1000).toFixed(1)+'s';
  elEvtFill.style.width='100%';
  elEvtGain.innerHTML='saqueado neste evento: <b>'+fmt(eventBits)+'</b> bits — cada comando completo renova o temporizador';
  updateEvtTotal();
}
function updateEvtTotal(){
  const tot=Math.max(0, EVENT_HARD_MS-(Date.now()-eventStart));
  elEvtTotal.textContent='evento encerra em '+Math.ceil(tot/1000)+'s';
}
function updateEventoTimer(rem){
  elEvtFill.style.width=(rem*100)+'%';
  elEvtSecs.textContent=(rem*cmdWindow()/1000).toFixed(1)+'s';
  updateEvtTotal();
  elEvento.classList.toggle('low',rem<0.3);
}
function endEvento(maxed){
  eventOn=false; combo=0; curCmd=null;
  elEvento.classList.remove('on','low');
  renderPrompt();
  toast('EVENTO ENCERRADO',(maxed?'limite de 2 minutos atingido':'o temporizador zerou')+' — você saqueou '+fmt(eventBits)+' bits durante a invasão','');
  log('evento encerrado: +'+fmt(eventBits)+' bits saqueados no total','evt');
  beep(160,0.22,'sawtooth',0.05);
  eventBits=0;
  nextEvento=Date.now()+(60+Math.random()*60)*1000;
}
function typoFlash(){
  elPrompt.classList.remove('typo'); void elPrompt.offsetWidth;
  elPrompt.classList.add('typo');
  beep(110,0.08,'sawtooth',0.04);
}
function completeCmd(){
  combo++;
  lastCmdAt=Date.now();
  if(combo>S.bestCombo) S.bestCombo=combo;
  const crit=Math.random()<critChance;
  const bonus=clickPow*clickBuffMult()*curCmd.c.length*curCmd.m*eventMult()*(crit?10:1);
  S.bits+=bonus; S.total+=bonus; S.clicks++;
  eventBits+=bonus;
  termLine(curCmd.c);
  for(const o of curCmd.out) termLine(subst(o),true);
  spawnFloat(elTerm.clientWidth/2,elTerm.clientHeight/2,'+'+fmt(bonus)+(crit?' ⚡CRIT':''),crit);
  if(crit){ sndCrit(); document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); }
  else sndBuy();
  refreshEventoUI();
  checkAch(); updateRoom();
  newCmd();
}
function handleKey(key){
  if(!eventOn||!curCmd) return;
  if(key==='Enter'){
    if(typedLen===curCmd.c.length) completeCmd();
    else typoFlash();
    return;
  }
  if(key==='Backspace'){
    if(typedLen>0){ typedLen--; renderPrompt(); }
    return;
  }
  if(key.length!==1) return;
  if(typedLen<curCmd.c.length && key===curCmd.c[typedLen]){
    typedLen++;
    const gain=clickPow*clickBuffMult()*eventMult();
    S.bits+=gain; S.total+=gain;
    eventBits+=gain;
    beep(500+Math.random()*200,0.025,'square',0.018);
    if(typedLen%4===0)
      spawnFloat(40+Math.random()*(elTerm.clientWidth-80),elTerm.clientHeight-70,'+'+fmt(gain),false,true);
    renderPrompt();
  } else {
    typoFlash();
  }
}
document.addEventListener('keydown',e=>{
  if(duelOpen||!eventOn) return;
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  if(e.key==='Enter'||e.key==='Backspace'||e.key.length===1){
    e.preventDefault();
    handleKey(e.key);
  }
});
elKbd.addEventListener('beforeinput',e=>{
  e.preventDefault();
  if(e.inputType==='insertText'&&e.data){ for(const ch of e.data) handleKey(ch); }
  else if(e.inputType==='deleteContentBackward') handleKey('Backspace');
});
elTerm.addEventListener('pointerdown',e=>{
  if(e.target.classList.contains('packet')) return;
  if(eventOn){ elKbd.focus({preventScroll:true}); return; }
  mineClick(e);
});
function mineClick(e){
  const crit=Math.random()<critChance;
  const gain=clickPow*clickBuffMult()*(crit?10:1);
  S.bits+=gain; S.total+=gain; S.clicks++;
  const r=elTerm.getBoundingClientRect();
  spawnFloat(e.clientX-r.left,e.clientY-r.top,'+'+fmt(gain)+(crit?' ⚡CRIT':''),crit);
  if(crit){
    sndCrit();
    document.body.classList.remove('shake'); void document.body.offsetWidth;
    document.body.classList.add('shake');
  } else sndClick();
  termLine(CMDS[Math.floor(Math.random()*CMDS.length)].c);
  checkAch(); updateRoom();
}

/* ---- golden packet ---- */
function spawnPacket(){
  if(packetEl) return;
  const d=document.createElement('div');
  d.className='packet'; d.textContent='$';
  d.style.left=(20+Math.random()*(elTerm.clientWidth-90))+'px';
  d.style.top=(20+Math.random()*(elTerm.clientHeight-90))+'px';
  d.addEventListener('pointerdown',ev=>{
    ev.stopPropagation();
    const bonus=Math.max(50, clickPow*200, bps*60);
    S.bits+=bonus; S.total+=bonus; S.goldClicks++;
    toast('PACOTE INTERCEPTADO','+'+fmt(bonus)+' bits roubados do tráfego','gold');
    log('pacote de dados dourado interceptado: +'+fmt(bonus)+' bits','warn');
    sndGold();
    killPacket();
    checkAch();
  });
  elTerm.appendChild(d);
  packetEl=d;
  setTimeout(()=>{ if(packetEl===d) killPacket(); },9000);
}
function killPacket(){
  if(packetEl){ packetEl.remove(); packetEl=null; }
  nextPacket=Date.now()+(45+Math.random()*70)*1000;
}

/* ---- adware ---- */
const AD_POOL=[
  ['🎰 PARABÉNS!!!','você é o visitante 1.000.000 — resgate seu prêmio'],
  ['💊 TRUQUE SECRETO','hackers ODEIAM esse truque de mineração'],
  ['🔥 90% OFF','GPUs quase de graça (fonte: confia)'],
  ['👁 ALERTA','sua webcam pode estar ligada AGORA'],
  ['🤑 RENDA EXTRA','ganhe bits DORMINDO com 1 clique'],
  ['💘 ENCONTROS','hackers solteiros na sua área'],
  ['🛡 VÍRUS DETECTADO','seu PC está infectado (a infecção é você)'],
  ['🏆 SORTEIO','clique pra ganhar um datacenter usado'],
];
function adReward(){ return Math.max(25, clickPow*40, bps*8); }
function screenFloat(x,y,txt){
  const s=document.createElement('span');
  s.className='float-num screen';
  s.textContent=txt;
  s.style.left=x+'px'; s.style.top=y+'px';
  document.body.appendChild(s);
  setTimeout(()=>s.remove(),1300);
}
function adCascadePos(i){
  const W=240, H=150, stepX=32, stepY=30, m=16;
  const perDiagX=Math.floor((innerWidth -m-W)/stepX);
  const perDiagY=Math.floor((innerHeight-m-H)/stepY);
  const perDiag=Math.max(3, Math.min(perDiagX, perDiagY));
  const cycle=Math.floor(i/perDiag);
  const k=i%perDiag;
  let x=m + k*stepX + cycle*46;
  let y=m + k*stepY;
  const maxX=Math.max(m, innerWidth -W-m);
  if(x>maxX) x=m + (x-m)%(maxX-m+1);
  return [x,y];
}
function spawnAd(){
  if(adsOpen>=18) return;
  const [title,body]=AD_POOL[Math.floor(Math.random()*AD_POOL.length)];
  const d=document.createElement('div');
  d.className='popup-ad';
  d.innerHTML='<div class="ad-bar"><span></span><span class="ad-x">✕</span></div><div class="ad-body"></div>';
  d.querySelector('.ad-bar span').textContent=title;
  const bd=d.querySelector('.ad-body');
  bd.textContent=body;
  const small=document.createElement('span');
  small.className='ad-small';
  small.textContent='feche no ✕ pra faturar — clicar no anúncio abre MAIS';
  bd.appendChild(small);
  const [cx,cy]=adCascadePos(cascadeIdx++);
  d.style.left=cx+'px';
  d.style.top=cy+'px';
  d.style.zIndex=80+cascadeIdx;
  d.style.transform='rotate('+(Math.random()*4-2).toFixed(1)+'deg)';
  d.querySelector('.ad-x').addEventListener('pointerdown',ev=>{
    ev.stopPropagation();
    const gain=adReward();
    S.bits+=gain; S.total+=gain; S.adsClosed=(S.adsClosed||0)+1;
    adsBits+=gain; adsOpen--;
    screenFloat(ev.clientX,ev.clientY,'+'+fmt(gain));
    sndBuy();
    d.remove();
    if(adsOpen<=0&&adsPending<=0) endAds();
  });
  bd.addEventListener('pointerdown',ev=>{
    ev.stopPropagation();
    beep(140,0.1,'sawtooth',0.05);
    spawnAd();
  });
  document.body.appendChild(d);
  adsOpen++;
}
function spawnAdBurst(){
  adsBits=0;
  nextAds=Infinity;
  cascadeIdx=0;
  const n=8+Math.floor(Math.random()*5);
  adsPending=n;
  for(let i=0;i<n;i++) setTimeout(()=>{ adsPending--; spawnAd(); }, i*(120+Math.random()*110));
  log('ADWARE!! popups brotando na tela — feche tudo no ✕','warn');
  termLine('!! adware detectado — feche as janelas !!',true);
  beep(180,0.15,'sawtooth',0.06); beep(140,0.15,'sawtooth',0.06,0.18);
}
function endAds(){
  adsOpen=0;
  toast('ADWARE REMOVIDO','você faturou '+fmt(adsBits)+' bits fechando propaganda','gold');
  log('adware limpo: +'+fmt(adsBits)+' bits de "consultoria"','evt');
  sndGold();
  checkAch();
  nextAds=Date.now()+(120+Math.random()*150)*1000;
}

/* ---- format PC buff ---- */
const elFmtBtn=$('#format-btn');
function updateFmtBtn(){
  const now=Date.now();
  if(now<clickBuffUntil){
    elFmtBtn.disabled=true;
    elFmtBtn.classList.add('active-buff');
    elFmtBtn.textContent='⚡ TURBINADO — clicks ×'+FMT_MULT+' por '+Math.ceil((clickBuffUntil-now)/1000)+'s';
  } else if(now<fmtReadyAt){
    elFmtBtn.disabled=true;
    elFmtBtn.classList.remove('active-buff');
    elFmtBtn.textContent='💾 reinstalando sistema... pronto em '+Math.ceil((fmtReadyAt-now)/1000)+'s';
  } else {
    elFmtBtn.disabled=false;
    elFmtBtn.classList.remove('active-buff');
    elFmtBtn.textContent='💾 FORMATAR PC — clicks ×'+FMT_MULT+' por '+FMT_SECS+'s';
  }
}
elFmtBtn.addEventListener('click',()=>{
  const now=Date.now();
  if(now<fmtReadyAt) return;
  clickBuffUntil=now+FMT_SECS*1000;
  fmtReadyAt=now+FMT_CD*1000;
  elTermLines.innerHTML='';
  termLine('formatando /dev/sda1 ...',true);
  termLine('reinstalando kernel otimizado pra mineração',true);
  termLine('sistema limpo — clique como se não houvesse amanhã',true);
  toast('💾 PC FORMATADO','clicks ×'+FMT_MULT+' por '+FMT_SECS+'s — aproveita que tá rápido','gold');
  log('PC formatado: clicks ×'+FMT_MULT+' por '+FMT_SECS+'s','evt');
  document.body.classList.remove('glitching'); void document.body.offsetWidth;
  document.body.classList.add('glitching');
  sndGold();
});

/* ---- missions tick ---- */
function missionTick(){
  const m=curMission();
  if(!m) return;
  const [cur,goal]=m.prog(S);
  elMsFill.style.width=Math.min(100,cur/goal*100)+'%';
  elMsProg.textContent=fmt(Math.min(cur,goal))+' / '+fmt(goal);
  if(cur<goal) return;
  S.missionIdx++;
  let rewTxt='';
  if(m.buffMult){
    applyBuff(m.buffMult,m.buffSecs);
    rewTxt='produção ×'+m.buffMult+' por '+m.buffSecs+'s';
  }
  if(m.rew){
    const b=Math.floor(m.rew());
    S.bits+=b; S.total+=b;
    rewTxt=(rewTxt?rewTxt+' + ':'')+fmt(b)+' bits';
  }
  toast('✔ MISSÃO: '+m.nome.toUpperCase(), m.evento+' — recompensa: '+rewTxt,'gold');
  log('missão concluída: '+m.nome+' ('+rewTxt+')','evt');
  termLine(m.evento,true);
  sndAch();
  document.body.classList.remove('glitching'); void document.body.offsetWidth;
  document.body.classList.add('glitching');
  renderMission();
  checkAch();
}

/* ---- duel / tic-tac-toe ---- */
const LINES3=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const elTTT=$('#ttt-modal'), elBoard=$('#ttt-board'), elTttMsg=$('#ttt-msg'),
      elTttA=$('#ttt-accept'), elTttC=$('#ttt-close');

function openDuel(){
  duelOpen=true;
  duelPrize=Math.max(500,Math.floor(bps*120+clickPow*300));
  elTttMsg.textContent='uma IA de defesa antiga trava um cofre de '+fmt(duelPrize)+
    ' bits. ela só libera se você vencer no jogo da velha. empate paga 25%. perder não custa nada (só seu orgulho).';
  elBoard.classList.remove('on'); elBoard.innerHTML='';
  tttB=null;
  elTttA.style.display='';
  elTttC.textContent='[recusar]';
  elTTT.classList.add('open');
  log('IA de defesa te desafiou pra um duelo','evt');
  sndDuel();
}
function startDuel(){
  tttB=Array(9).fill(null); tttLock=false;
  elTttA.style.display='none';
  elTttC.textContent='[fugir]';
  elBoard.classList.add('on');
  elTttMsg.textContent='você é X. a IA é O. boa sorte, operador.';
  renderTTT();
}
function renderTTT(){
  elBoard.innerHTML='';
  tttB.forEach((v,i)=>{
    const c=document.createElement('div');
    c.className='ttt-cell'+(v==='O'?' o':v==='X'?' x':'');
    c.textContent=v||'';
    if(!v) c.addEventListener('pointerdown',()=>playTTT(i));
    elBoard.appendChild(c);
  });
}
function winnerTTT(b){
  for(const L of LINES3){
    if(b[L[0]]&&b[L[0]]===b[L[1]]&&b[L[1]]===b[L[2]]) return {w:b[L[0]],line:L};
  }
  if(b.every(x=>x)) return {w:'draw'};
  return null;
}
function botMove(b){
  const empty=b.map((v,i)=>v?null:i).filter(v=>v!==null);
  if(!empty.length) return null;
  if(Math.random()<0.25) return empty[Math.floor(Math.random()*empty.length)];
  const tryLine=who=>{
    for(const L of LINES3){
      const vals=L.map(i=>b[i]);
      if(vals.filter(v=>v===who).length===2 && vals.includes(null))
        return L[vals.indexOf(null)];
    }
    return null;
  };
  let m=tryLine('O'); if(m!=null) return m;
  m=tryLine('X');     if(m!=null) return m;
  if(b[4]==null) return 4;
  const corners=[0,2,6,8].filter(i=>!b[i]);
  if(corners.length) return corners[Math.floor(Math.random()*corners.length)];
  return empty[Math.floor(Math.random()*empty.length)];
}
function playTTT(i){
  if(tttLock||tttB[i]) return;
  tttB[i]='X';
  beep(500,0.04,'square',0.03);
  renderTTT();
  let r=winnerTTT(tttB);
  if(r) return endDuel(r);
  tttLock=true;
  setTimeout(()=>{
    const m=botMove(tttB);
    if(m!=null) tttB[m]='O';
    beep(260,0.05,'square',0.03);
    renderTTT();
    tttLock=false;
    r=winnerTTT(tttB);
    if(r) endDuel(r);
  },350);
}
function endDuel(r){
  tttLock=true;
  if(r.line) for(const i of r.line) elBoard.children[i].classList.add('hl');
  let prize=0;
  if(r.w==='X'){
    prize=duelPrize; S.ttt.wins++;
    elTttMsg.textContent='IA derrotada. cofre aberto: +'+fmt(prize)+' bits.';
    toast('DUELO VENCIDO','a IA de defesa caiu — +'+fmt(prize)+' bits saqueados do cofre','gold');
    sndGold();
  } else if(r.w==='draw'){
    prize=Math.floor(duelPrize*0.25); S.ttt.draws++;
    elTttMsg.textContent='empate. a IA libera 25% por respeito: +'+fmt(prize)+' bits.';
    toast('EMPATE TÉCNICO','a IA cedeu 25% do cofre: +'+fmt(prize)+' bits','');
    sndBuy();
  } else {
    S.ttt.losses++;
    elTttMsg.textContent='você perdeu pra um algoritmo de 1983. o cofre continua trancado.';
    log('a IA de defesa riu de você em binário','warn');
    beep(110,0.25,'sawtooth',0.05);
  }
  if(prize){ S.bits+=prize; S.total+=prize; log('duelo: +'+fmt(prize)+' bits','warn'); }
  elTttC.textContent='[fechar]';
  checkAch();
}
function closeDuel(forfeit){
  if(forfeit){ S.ttt.losses++; log('você fugiu do duelo. a IA anotou.','warn'); }
  elTTT.classList.remove('open');
  duelOpen=false; tttB=null;
  nextDuel=Date.now()+(180+Math.random()*240)*1000;
}
elTttA.addEventListener('click',startDuel);
elTttC.addEventListener('click',()=>{
  const inGame = tttB && !winnerTTT(tttB);
  closeDuel(inGame);
});

/* ---- main tick ---- */
function tick(){
  const now=Date.now();
  const dt=(now-lastTick)/1000;
  lastTick=now;
  const gain=bps*buffMult()*dt;
  S.bits+=gain; S.total+=gain;
  if(eventOn){
    if(now-eventStart>=EVENT_HARD_MS) endEvento(true);
    else{
      const rem=1-(now-lastCmdAt)/cmdWindow();
      if(rem<=0) endEvento();
      else updateEventoTimer(rem);
    }
  }
  if(now>=nextEvento && !eventOn && !evtModalOpen && !duelOpen) offerEvento();
  if(now>=nextPacket && !packetEl) spawnPacket();
  if(now>=nextAds && adsOpen===0 && !eventOn && !duelOpen && !evtModalOpen) spawnAdBurst();
  if(now>=nextDuel && !duelOpen && !eventOn && !evtModalOpen) openDuel();
  updateCounters();
  updateAfford();
  updateRank(false);
  updateFmtBtn();
  unlockNextGens();
}
