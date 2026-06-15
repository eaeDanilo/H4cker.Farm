'use strict';
const SAVE_KEY = 'h4ckfarm_save_v1';

let S = defaultState();
function defaultState(){
  return {
    bits:0, total:0, clicks:0, goldClicks:0, adsClosed:0, loc:0,
    gens:{}, upg:[], ach:[], seen:['script'],
    missionIdx:0, bestCombo:0, ttt:{wins:0,losses:0,draws:0},
    muted:false, started:Date.now(), saved:Date.now(),
    prestige:0, exploits:0,
  };
}
function g(id){ return S.gens[id]||0; }

let bps=0, clickPow=1, critChance=0.05;
let lastTick=Date.now(), nextPacket=Date.now()+30000, packetEl=null;
let nextDuel=Date.now()+120000, duelOpen=false, tttB=null, tttLock=false, duelPrize=0;
let nextEvento=Date.now()+45000, eventOn=false, evtModalOpen=false;
let nextAds=Date.now()+90000, adsOpen=0, adsPending=0, adsBits=0, cascadeIdx=0;
let buff={mult:1,until:0};
let curTab='hw', curQty=1;
let rankIdx=0;

/* prestige */
function prestigeMultiplier(){ return 1 + ((S.exploits||0) * 0.1); }
function exploitsForPrestige(){ return Math.max(1, Math.floor(Math.sqrt(S.total / 1e9))); }

function recalc(){
  let allM=1, clickM=1, clickPct=0;
  critChance=0.05;
  const genM={};
  for(const u of UPG){
    if(!S.upg.includes(u.id)) continue;
    if(u.tipo==='allMult')   allM*=u.val;
    else if(u.tipo==='clickMult') clickM*=u.val;
    else if(u.tipo==='clickPct')  clickPct+=u.val;
    else if(u.tipo==='crit')      critChance=Math.max(critChance,u.val);
    else if(u.tipo==='genMult')   genM[u.gen]=(genM[u.gen]||1)*u.val;
  }
  const pm = prestigeMultiplier();
  allM *= LOCAIS[S.loc].mult * pm;
  bps=0;
  for(const gen of GENS){
    bps += g(gen.id)*gen.prod*(genM[gen.id]||1);
  }
  bps *= allM;
  clickPow = 1*clickM*pm + bps*clickPct;
}

function costOf(gen,k){
  let owned=g(gen.id), total=0;
  for(let i=0;i<k;i++) total+=gen.base*Math.pow(1.15,owned+i);
  return total;
}
function maxBuy(gen){
  let owned=g(gen.id), money=S.bits, n=0;
  while(n<500){
    const c=gen.base*Math.pow(1.15,owned+n);
    if(money<c) break;
    money-=c; n++;
  }
  return n;
}
function fmt(n){
  if(!isFinite(n)) return '∞';
  if(n<1000) return Math.floor(n).toString();
  const u=['K','M','B','T','Qa','Qi','Sx'];
  let i=-1;
  while(n>=1000 && i<u.length-1){ n/=1000; i++; }
  return (n<10?n.toFixed(2):n<100?n.toFixed(1):Math.floor(n).toString())+u[i];
}
function fmtRate(n){
  if(n>0 && n<10 && n%1!==0) return n.toFixed(1);
  return fmt(n);
}

function applyBuff(mult,secs){ buff={mult,until:Date.now()+secs*1000}; }
function buffMult(){ return Date.now()<buff.until?buff.mult:1; }

const FMT_MULT=5, FMT_SECS=12, FMT_CD=90;
let clickBuffUntil=0, fmtReadyAt=0;
function clickBuffMult(){ return Date.now()<clickBuffUntil?FMT_MULT:1; }

function curMission(){ return MISSOES[S.missionIdx]||null; }
