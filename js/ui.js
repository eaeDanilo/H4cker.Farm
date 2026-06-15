'use strict';
const $=q=>document.querySelector(q);
const elBits=$('#bits'), elBps=$('#bps'), elTerm=$('#terminal'),
      elTermLines=$('#term-lines'), elFloat=$('#float-layer'),
      elLog=$('#log-list'), elShop=$('#shop-list'), elOwned=$('#owned-upg'),
      elToasts=$('#toasts'), elRankName=$('#rank-name'),
      elRankFill=$('#rank-fill'), elRankNext=$('#rank-next');

function termLine(txt,raw){
  const li=document.createElement('div');
  li.textContent=raw?txt:LOCAIS[S.loc].prompt+' '+txt;
  if(raw) li.style.color='#5fae84';
  elTermLines.appendChild(li);
  while(elTermLines.children.length>14) elTermLines.firstChild.remove();
}

function spawnFloat(x,y,txt,crit,mini){
  const s=document.createElement('span');
  s.className='float-num'+(crit?' crit':'')+(mini?' mini':'');
  s.textContent=txt;
  s.style.left=Math.max(30,Math.min(x,elTerm.clientWidth-30))+'px';
  s.style.top=Math.max(30,y)+'px';
  elFloat.appendChild(s);
  setTimeout(()=>s.remove(),1300);
}

function toast(titulo,txt,cls){
  const d=document.createElement('div');
  d.className='toast'+(cls?' '+cls:'');
  d.innerHTML='<b></b><span></span>';
  d.querySelector('b').textContent=titulo;
  d.querySelector('span').textContent=txt;
  elToasts.appendChild(d);
  setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(),450); },4000);
}

function log(txt,cls){
  const li=document.createElement('li');
  li.textContent=txt;
  if(cls) li.className=cls;
  elLog.appendChild(li);
  while(elLog.children.length>9) elLog.firstChild.remove();
}

function applyLoc(){
  const L=LOCAIS[S.loc];
  for(let i=1;i<LOCAIS.length;i++) document.body.classList.toggle('loc-'+i,S.loc===i);
  $('#room-title').textContent='// '+L.nome;
  $('#prompt-host').textContent=L.prompt;
  $('#st-loc').textContent=L.nome;
  $('#r-wall').setAttribute('fill',L.wall);
  $('#r-floor').setAttribute('fill',L.floor);
  $('#r-grid').setAttribute('stroke',L.grid);
}

/* ---- shop ---- */
function renderShop(){
  elShop.innerHTML=''; elOwned.innerHTML='';
  $('#qty-row').style.display=curTab==='hw'?'flex':'none';
  if(curTab==='hw'){
    for(const gen of GENS){
      if(!S.seen.includes(gen.id)) continue;
      const b=document.createElement('button');
      b.className='shop-item'; b.dataset.gen=gen.id;
      b.innerHTML=
        '<span class="tag"></span>'+
        '<span class="s-info"><b></b><small></small><span class="s-prod"></span></span>'+
        '<span class="s-right"><span class="s-cost"></span><span class="s-owned"></span></span>';
      b.querySelector('.tag').textContent=gen.tag;
      b.querySelector('b').textContent=gen.nome;
      b.querySelector('small').textContent=gen.desc;
      b.addEventListener('click',()=>buyGen(gen));
      elShop.appendChild(b);
    }
  } else if(curTab==='upg'){
    const nxt=LOCAIS[S.loc+1];
    if(nxt && nxt.req(S)){
      const b=document.createElement('button');
      b.className='shop-item upg move'; b.dataset.move='1';
      b.innerHTML=
        '<span class="tag">🚚</span>'+
        '<span class="s-info"><b></b><small></small></span>'+
        '<span class="s-right"><span class="s-cost"></span></span>';
      b.querySelector('b').textContent='MUDANÇA: '+nxt.nome;
      b.querySelector('small').textContent=nxt.desc;
      b.querySelector('.s-cost').textContent=fmt(nxt.custo);
      b.addEventListener('click',buyLoc);
      elShop.appendChild(b);
    }
    for(const u of UPG){
      if((u.loc||0)!==S.loc) continue;
      if(S.upg.includes(u.id)) continue;
      if(!u.req(S)) continue;
      const b=document.createElement('button');
      b.className='shop-item upg'; b.dataset.upg=u.id;
      b.innerHTML=
        '<span class="tag">UPG</span>'+
        '<span class="s-info"><b></b><small></small></span>'+
        '<span class="s-right"><span class="s-cost"></span></span>';
      b.querySelector('b').textContent=u.nome;
      b.querySelector('small').textContent=u.desc;
      b.querySelector('.s-cost').textContent=fmt(u.custo);
      b.addEventListener('click',()=>buyUpg(u));
      elShop.appendChild(b);
    }
    if(!elShop.children.length){
      elShop.innerHTML='<div style="color:#5fae84;font-size:12px;padding:10px">nenhum upgrade disponível agora. continue clicando e comprando hardware.</div>';
    }
    for(const u of UPG){
      if(!S.upg.includes(u.id)) continue;
      const sp=document.createElement('span');
      sp.textContent='✓ '+u.nome;
      elOwned.appendChild(sp);
    }
  } else {
    for(const a of ACH){
      const d=document.createElement('div');
      const has=S.ach.includes(a.id);
      d.className='ach-cell'+(has?'':' locked');
      d.innerHTML='<b></b><small></small>';
      d.querySelector('b').textContent=has?'★ '+a.nome:'??? bloqueada';
      d.querySelector('small').textContent=a.desc;
      elShop.appendChild(d);
    }
  }
  updateAfford();
}

function updateAfford(){
  if(curTab==='hw'){
    elShop.querySelectorAll('.shop-item').forEach(b=>{
      const gen=GENS.find(x=>x.id===b.dataset.gen);
      if(!gen) return;
      let k = curQty==='max' ? Math.max(1,maxBuy(gen)) : curQty;
      const cost=costOf(gen,k);
      const can=S.bits>=cost && (curQty!=='max'||maxBuy(gen)>=1);
      b.classList.toggle('ok',can);
      b.querySelector('.s-cost').textContent=(curQty==='max'?k+'× ':'')+fmt(cost);
      b.querySelector('.s-owned').textContent='possui '+g(gen.id);
      b.querySelector('.s-prod').textContent=fmtRate(gen.prod)+' bits/s cada';
    });
  } else if(curTab==='upg'){
    elShop.querySelectorAll('.shop-item').forEach(b=>{
      if(b.dataset.move){
        const nxt=LOCAIS[S.loc+1];
        b.classList.toggle('ok',!!nxt&&S.bits>=nxt.custo);
        return;
      }
      const u=UPG.find(x=>x.id===b.dataset.upg);
      if(!u) return;
      b.classList.toggle('ok',S.bits>=u.custo);
    });
  }
}

/* ---- shop purchases ---- */
function buyGen(gen){
  let k = curQty==='max' ? maxBuy(gen) : curQty;
  if(k<1) return;
  const cost=costOf(gen,k);
  if(S.bits<cost) return;
  S.bits-=cost;
  S.gens[gen.id]=g(gen.id)+k;
  recalc(); sndBuy();
  log('comprou '+k+'× '+gen.nome+' por '+fmt(cost)+' bits');
  unlockNextGens();
  checkAch(); updateRoom(); renderShop();
}
function buyUpg(u){
  if(S.bits<u.custo || S.upg.includes(u.id)) return;
  S.bits-=u.custo;
  S.upg.push(u.id);
  recalc(); sndBuy();
  toast('UPGRADE INSTALADO',u.nome+' — '+u.desc,'');
  log('upgrade instalado: '+u.nome,'warn');
  checkAch(); updateRoom(); renderShop();
}
function buyLoc(){
  const nxt=LOCAIS[S.loc+1];
  if(!nxt||S.bits<nxt.custo) return;
  S.bits-=nxt.custo;
  S.loc++;
  recalc(); applyLoc();
  toast('🚚 MUDANÇA: '+nxt.nome.toUpperCase(),nxt.flavor+' toda produção ×'+nxt.mult+'.','rank');
  log('você se mudou: '+nxt.nome,'evt');
  termLine(nxt.flavor,true);
  sndRank();
  document.body.classList.remove('glitching'); void document.body.offsetWidth;
  document.body.classList.add('glitching');
  checkAch(); updateRoom(); renderShop();
}

document.querySelectorAll('#tabs button').forEach(b=>{
  b.addEventListener('click',()=>{
    curTab=b.dataset.tab;
    document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('active',x===b));
    renderShop();
  });
});
document.querySelectorAll('#qty-row button').forEach(b=>{
  b.addEventListener('click',()=>{
    curQty=b.dataset.q==='max'?'max':parseInt(b.dataset.q);
    document.querySelectorAll('#qty-row button').forEach(x=>x.classList.toggle('active',x===b));
    updateAfford();
  });
});

/* ---- room ---- */
const ROOM_RULES = [
  ['#r-desk',      ()=>true],
  ['#r-chair',     ()=>true],
  ['#r-monitor',   ()=>true],
  ['#r-kbd',       ()=>S.clicks>=1],
  ['#r-code',      ()=>g('script')>=1],
  ['#r-tower',     ()=>g('cpu')>=1],
  ['#r-rig',       ()=>g('gpu')>=1],
  ['#r-ssd',       ()=>g('ssd')>=1],
  ['#r-server',    ()=>g('srv')>=1],
  ['#r-rack',      ()=>g('rack')>=1],
  ['#r-map',       ()=>g('bot')>=1],
  ['#r-bigscreen', ()=>g('dtc')>=1],
  ['#r-quantum',   ()=>g('qtm')>=1],
  ['#r-monitor2',  ()=>S.upg.includes('monitor')],
  ['#r-poster1',   ()=>S.upg.length>=3],
  ['#r-poster2',   ()=>S.upg.length>=8],
  ['#r-cans',      ()=>S.clicks>=150],
  ['#r-cat',       ()=>S.ach.length>=10],
];
function updateRoom(){
  for(const [sel,cond] of ROOM_RULES){
    const el=document.querySelector(sel);
    if(el) el.classList.toggle('on',!!cond());
  }
}

/* ---- rank ---- */
function rankOf(total){
  let i=0;
  for(let k=0;k<RANKS.length;k++) if(total>=RANKS[k][0]) i=k;
  return i;
}
function updateRank(initial){
  const i=rankOf(S.total);
  if(i!==rankIdx || initial){
    if(!initial && i>rankIdx){
      toast('RANK NOVO: '+RANKS[i][1].toUpperCase(),'sua reputação na rede aumentou','rank');
      log('promovido a '+RANKS[i][1],'evt');
      sndRank();
      document.body.classList.remove('glitching'); void document.body.offsetWidth;
      document.body.classList.add('glitching');
    }
    rankIdx=i;
    elRankName.textContent=RANKS[i][1];
  }
  if(i<RANKS.length-1){
    const cur=RANKS[i][0], next=RANKS[i+1][0];
    elRankFill.style.width=Math.min(100,(S.total-cur)/(next-cur)*100)+'%';
    elRankNext.textContent='próximo rank: '+fmt(next)+' bits totais';
  } else {
    elRankFill.style.width='100%';
    elRankNext.textContent='rank máximo alcançado';
  }
}

/* ---- missions ---- */
const elMsName=$('#ms-name'), elMsDesc=$('#ms-desc'),
      elMsFill=$('#ms-fill'), elMsProg=$('#ms-prog');
function renderMission(){
  const m=curMission();
  if(!m){
    elMsName.textContent='todas as missões concluídas';
    elMsDesc.textContent='a rede inteira conhece seu nick. descanse, lenda.';
    elMsFill.style.width='100%';
    elMsProg.textContent=MISSOES.length+'/'+MISSOES.length;
    return;
  }
  elMsName.textContent='['+(S.missionIdx+1)+'/'+MISSOES.length+'] '+m.nome;
  elMsDesc.textContent=m.desc;
}

/* ---- counters ---- */
function updateCounters(){
  elBits.innerHTML='';
  elBits.appendChild(document.createTextNode(fmt(S.bits)+' '));
  const sm=document.createElement('small'); sm.textContent='bits';
  elBits.appendChild(sm);
  const bM=buffMult();
  const bTxt=bM>1?' [×'+buff.mult+' '+Math.ceil((buff.until-Date.now())/1000)+'s]':'';
  elBps.textContent=fmtRate(bps*bM)+' bits/s'+bTxt+' · '+fmtRate(clickPow)+'/clique';
  $('#st-total').textContent=fmt(S.total);
  $('#st-clicks').textContent=S.clicks.toLocaleString('pt-BR');
  $('#st-ach').textContent=S.ach.length+'/'+ACH.length;
  $('#st-click-pow').textContent=fmt(clickPow*clickBuffMult());
  $('#st-ttt').textContent=S.ttt.wins+'V/'+S.ttt.losses+'D';
  document.title=fmt(S.bits)+' bits — h4ck.farm';
  if(typeof updatePrestigeBtn==='function') updatePrestigeBtn();
}

/* ---- achievements ---- */
function checkAch(){
  for(const a of ACH){
    if(S.ach.includes(a.id)) continue;
    if(a.cond(S)){
      S.ach.push(a.id);
      toast('★ CONQUISTA',a.nome+' — '+a.desc,'gold');
      log('conquista desbloqueada: '+a.nome,'warn');
      sndAch();
      if(curTab==='ach') renderShop();
      updateRoom();
    }
  }
}

/* ---- unlock next generators ---- */
function unlockNextGens(){
  for(let i=0;i<GENS.length;i++){
    const gen=GENS[i];
    if(S.seen.includes(gen.id)) continue;
    const prev=GENS[i-1];
    if((prev&&g(prev.id)>=1)||S.total>=gen.base*0.4){
      S.seen.push(gen.id);
      log('novo hardware no mercado negro: '+gen.nome,'evt');
      if(curTab==='hw') renderShop();
    }
  }
}
