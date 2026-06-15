'use strict';
let AC=null;
function audio(){ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); return AC; }
function beep(freq,dur=0.06,type='square',gain=0.035,delay=0){
  if(S.muted) return;
  try{
    const ctx=audio(), t=ctx.currentTime+delay;
    const o=ctx.createOscillator(), gn=ctx.createGain();
    o.type=type; o.frequency.value=freq;
    gn.gain.setValueAtTime(gain,t);
    gn.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(gn).connect(ctx.destination);
    o.start(t); o.stop(t+dur+0.02);
  }catch(e){}
}
const sndClick =()=>beep(180+Math.random()*60,0.04);
const sndCrit  =()=>{beep(440,0.08,'sawtooth',0.05);beep(880,0.1,'square',0.04,0.06)};
const sndBuy   =()=>{beep(330,0.06);beep(495,0.08,'square',0.04,0.07)};
const sndAch   =()=>{beep(523,0.09,'triangle',0.05);beep(659,0.09,'triangle',0.05,0.09);beep(784,0.14,'triangle',0.05,0.18)};
const sndGold  =()=>{beep(700,0.07,'sine',0.06);beep(1050,0.07,'sine',0.06,0.08);beep(1400,0.14,'sine',0.06,0.16)};
const sndRank  =()=>{beep(110,0.2,'sawtooth',0.06);beep(220,0.2,'sawtooth',0.05,0.15);beep(440,0.3,'sawtooth',0.05,0.3)};
const sndDuel  =()=>{beep(220,0.12,'sawtooth',0.05);beep(165,0.14,'sawtooth',0.05,0.12)};
const sndPrestige=()=>{
  beep(55,0.4,'sawtooth',0.08);
  beep(110,0.3,'sawtooth',0.06,0.3);
  beep(220,0.2,'square',0.05,0.6);
};
