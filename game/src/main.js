// Application lifecycle. The starter's seeded simulation and fixed-step loop are retained.
import { STEP, RUN_SECONDS, CHARGE_REQUIRED, GATE_ALIGNMENT_SECONDS, UPGRADES, BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { createWorld, distance } from './world.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const seed=Number.parseInt(params.get('seed')||'',10);
export const world=createWorld(createRandom(Number.isFinite(seed)?seed:Math.floor(Math.random()*4294967296)));
const renderer=createRenderer($('game')),input=createInput($('game'),renderer.toLogical),audio=createAudio();
const ui=$('interface');
let screen='title',manualReturn='title',last=performance.now(),accumulator=0,uiTimer=0,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let records={best:0,escapes:0,runs:0};
try { const saved=JSON.parse(localStorage.getItem(BEST_KEY));if(saved && Number.isFinite(saved.best)) records={best:saved.best,escapes:saved.escapes||0,runs:saved.runs||0}; } catch { /* Storage is optional. */ }
function fitInterface(){const scale=Math.min(innerWidth/1440,innerHeight/900);ui.style.transform=`scale(${scale})`;ui.style.left=`${(innerWidth-1440*scale)/2}px`;ui.style.top=`${(innerHeight-900*scale)/2}px`;}
fitInterface();window.addEventListener('resize',fitInterface);
function announce(message){$('status').textContent=message;}
function setScreen(next){
  screen=next;document.body.dataset.screen=next;input.clear();accumulator=0;
  for(const [id,name] of [['title-screen','title'],['tutorial-screen','tutorial'],['pause-screen','paused'],['shop-screen','shop'],['result-screen','result']])$(id).classList.toggle('hidden',name!==next);
  $('title-annotation').classList.toggle('hidden',next!=='title');
  $('hud').classList.toggle('hidden',next==='title'||next==='tutorial');
  $('pause-button').classList.toggle('hidden',next!=='play');
  $('footer-right').textContent=next==='title'?'SOLO EXPEDITION  ·  OFFLINE READY  ●':'KESTREL / FLIGHT SYSTEMS ONLINE  ·  M TO MUTE';
  if(next==='title') $('title-record').textContent=records.runs?`BEST FLIGHT ${records.best.toLocaleString()} / ${records.escapes} SUCCESSFUL EXTRACTIONS`:'NO FLIGHT RECORDS / WRITE YOUR OWN';
  announce({title:'Void Harvest. Launch expedition or open the flight manual.',tutorial:'Flight manual. Collect 60 crystals and hold E at Gate 07 to escape.',play:'Flight active.',paused:'Flight paused.',shop:'Refit bay. Flight paused.',result:world.state.reason}[next]);
  const focus={title:'launch',tutorial:'manual-launch',paused:'resume',shop:'close-shop',result:'restart'}[next];
  if(focus)$(focus).focus({preventScroll:true});else document.activeElement?.blur();
}
function start(){audio.init();world.reset();setScreen('play');updateHud();}
function manual(){manualReturn=screen;$('manual-launch').innerHTML=screen==='title'?'I’M READY. LAUNCH. <span>↗</span>':'RESUME FLIGHT <span>↗</span>';setScreen('tutorial');}
function launch(){audio.init();manual();}
function end(){
  const s=world.state;records.runs++;if(s.outcome==='victory')records.escapes++;
  const isBest=s.score>records.best;records.best=Math.max(records.best,s.score);
  try{localStorage.setItem(BEST_KEY,JSON.stringify(records));}catch{/* Continue without persistence. */}
  const win=s.outcome==='victory';$('result-screen').querySelector('.result').classList.toggle('defeat',!win);
  $('result-title').textContent=win?'You made it out.':'The void keeps its own.';
  $('result-eyebrow').textContent=win?'EXPEDITION REPORT / EXTRACTION CONFIRMED':'EXPEDITION REPORT / SIGNAL LOST';
  $('result-symbol').textContent=win?'↗':'×';$('result-message').textContent=s.reason;
  $('result-score').textContent=s.score.toLocaleString();$('result-crystals').textContent=s.harvested;$('result-kills').textContent=s.kills;$('result-time').textContent=formatTime(s.elapsed);
  $('result-record').textContent=`${isBest?'NEW PERSONAL RECORD / ':''}BEST FLIGHT ${records.best.toLocaleString()} · ${records.escapes} EXTRACTIONS`;
  setScreen('result');
}
function formatTime(t){const n=Math.max(0,Math.floor(t));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function updateHud(){
  const s=world.state,p=s.player,charge=Math.min(1,s.harvested/CHARGE_REQUIRED);
  $('hull-number').textContent=`${Math.ceil(p.hull)}%`;$('hull-bar').style.width=`${p.hull}%`;$('hull-bar').style.background=p.hull<30?'#ff647b':'#d8e9df';
  $('shield-number').textContent=Math.ceil(p.shield);$('shield-bar').style.width=`${p.shield/p.maxShield*100}%`;
  $('boost-number').textContent=Math.ceil(p.energy);$('boost-bar').style.width=`${p.energy}%`;
  $('timer').innerHTML=`${formatTime(s.remaining)}<span>.${String(Math.floor((s.remaining%1)*100)).padStart(2,'0')}</span>`;
  $('timer').style.color=s.remaining<45?'#ff7487':'#f3d3bc';$('collapse-bar').style.width=`${s.remaining/RUN_SECONDS*100}%`;
  $('wave').innerHTML=`WAVE ${String(s.wave).padStart(2,'0')} <span>${s.enemies.length?`${s.enemies.length} HOSTILES`:`CONTACT IN ${Math.ceil(s.nextWave-s.elapsed)}s`}</span>`;
  $('charge').textContent=String(s.harvested).padStart(2,'0');$('charge-bar').style.width=`${charge*100}%`;$('credits').textContent=s.credits;
  $('core-state').textContent=charge>=1?'GATE ONLINE':'UNCHARGED';$('core-state').classList.toggle('orange',charge<1);$('core-state').style.color=charge>=1?'#8cf9ed':'';
  $('objective-progress').textContent=charge>=1?'↗':`${Math.floor(charge*100)}%`;
  const near=distance(p,s.portal)<s.portal.r+25,aligned=s.elapsed>=GATE_ALIGNMENT_SECONDS,alignTime=formatTime(GATE_ALIGNMENT_SECONDS-s.elapsed);
  $('core-state').textContent=charge>=1?(aligned?'GATE ONLINE':'CORE READY'):'UNCHARGED';
  $('objective-eyebrow').textContent=charge>=1?(aligned?'EXTRACTION WINDOW OPEN':'SECONDARY DIRECTIVE / SURVIVE'):'PRIMARY DIRECTIVE';
  document.querySelector('.mission-index').textContent=charge>=1?(aligned?'03':'02'):'01';
  $('objective').textContent=charge>=1?(aligned?(near?'Hold E to stabilize the jump':'Reach Gate 07. Leave the sector alive.'):`Survive the swarm. Gate aligns in ${alignTime}`):'Harvest 60 crystals to charge the jump gate';
  $('objective-detail').textContent=charge>=1?(aligned?(near?`JUMP SYNC ${Math.min(100,Math.floor(s.extract/1.8*100))}% · Keep holding E until extraction completes.`:'Follow the cyan marker. Gate location is shown on your radar.'):'Keep harvesting and refit with U. Extra crystals increase your score.'):`Gate alignment in ${alignTime}. Spending salvage never reduces portal charge.`;
  $('pulse-status').textContent=p.pulseCooldown>0?`${Math.ceil(p.pulseCooldown)}s`:'READY';
  let hint=s.hintTime>0?s.hint:'';
  if(near)hint=charge>=1?(aligned?'GATE 07 IN RANGE · HOLD E TO EXTRACT':`GATE ALIGNING · ${alignTime} TO JUMP WINDOW`):`GATE LOCKED · ${CHARGE_REQUIRED-s.harvested} more crystals required`;
  else if(s.elapsed<18 && s.harvested===0 && s.hintTime===0)hint='Glowing cyan seams mark deposits. Hold E within mining range.';
  else if(s.credits>=14 && s.elapsed<65 && s.hintTime===0)hint='SALVAGE AVAILABLE · Press U to fabricate an upgrade';
  $('flight-hint').classList.toggle('hidden',!hint);$('hint-text').textContent=hint;
}
const icons=['⌁','◇','⬡','↗'];
function updateShop(){
  $('shop-credits').innerHTML=`${world.state.credits} <small>CR</small>`;
  $('upgrade-cards').innerHTML=UPGRADES.map((item,i)=>{
    const tier=world.state.upgrades[item.id],cost=item.cost+tier*12,max=tier>=item.max;
    return `<article class="upgrade-card"><span class="module-number">0${i+1} / MODULE</span><div class="module-icon">${icons[i]}</div><small>${item.type}</small><h3>${item.name}</h3><div class="tier-pips">${[1,2,3].map(n=>`<i class="${n<=tier?'on':''}"></i>`).join('')}</div><p>${item.detail}</p><button class="buy-button" data-upgrade="${item.id}" ${max||world.state.credits<cost?'disabled':''}><span>${max?'MAX TIER':`[${i+1}] FABRICATE`}</span><b>${max?'III':`${cost} CR`}</b></button></article>`;
  }).join('');
}
function openShop(){setScreen('shop');$('shop-feedback').textContent='Select a module to fabricate.';updateShop();}
function purchase(id){if(world.buy(id)){audio.effect('upgrade');updateShop();updateHud();$('shop-feedback').textContent=`${UPGRADES.find(u=>u.id===id).name} fabricated. Tier ${world.state.upgrades[id]} online.`;}else{$('shop-feedback').textContent='More salvage required, or module is at maximum tier.';}}
$('launch').onclick=launch;$('how-to').onclick=manual;
$('manual-launch').onclick=()=>manualReturn==='title'?start():setScreen('play');$('manual-back').onclick=()=>setScreen(manualReturn);
$('pause-button').onclick=()=>setScreen('paused');$('resume').onclick=()=>setScreen('play');$('refit').onclick=openShop;$('pause-refit').onclick=openShop;$('close-shop').onclick=()=>setScreen('play');
$('upgrade-cards').onclick=e=>{const b=e.target.closest('[data-upgrade]');if(b)purchase(b.dataset.upgrade);};
$('restart').onclick=start;$('return-title').onclick=()=>setScreen('title');$('brand').onclick=e=>{e.preventDefault();if(screen==='play')setScreen('paused');else if(screen==='title')manual();};
$('abandon').onclick=()=>setScreen('title');
function mute(){$('sound').textContent=audio.toggle()?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',String(!audio.enabled));}
$('sound').onclick=mute;$('music').onclick=()=>{$('music').textContent=audio.toggleMusic()?'MUSIC ON':'MUSIC OFF';};
$('effects').textContent=reduced?'MOTION REDUCED':'MOTION FULL';$('effects').onclick=()=>{reduced=!reduced;$('effects').textContent=reduced?'MOTION REDUCED':'MOTION FULL';};
function actions(){
  for(const key of input.takeActions()){
    if(key==='KeyM'){mute();continue;}
    if(key==='Escape'||key==='KeyP'){
      if(screen==='play')setScreen('paused');else if(screen==='paused'||screen==='shop')setScreen('play');else if(screen==='tutorial')setScreen(manualReturn);
    }else if(key==='KeyU'){
      if(screen==='play'||screen==='paused')openShop();else if(screen==='shop')setScreen('play');
    }else if(key==='KeyH'&&screen==='play')manual();
    else if(key==='Enter'){
      if(screen==='title')launch();else if(screen==='tutorial')manualReturn==='title'?start():setScreen('play');else if(screen==='result')start();else if(screen==='paused')setScreen('play');
    }else if(screen==='shop'&&/^Digit[1-4]$/.test(key))purchase(UPGRADES[Number(key.at(-1))-1].id);
  }
}
function pauseOnBlur(){if(screen==='play')setScreen('paused');}
window.addEventListener('blur',pauseOnBlur);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOnBlur();});
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.1);last=now;actions();
  if(screen==='play'){
    accumulator+=dt;
    while(accumulator>=STEP && screen==='play'){
      const events=world.step(STEP,input.sample());for(const e of events)audio.effect(e.type);
      accumulator-=STEP;if(world.state.outcome)end();
    }
    uiTimer-=dt;if(uiTimer<=0){updateHud();uiTimer=.08;}
  }else accumulator=0;
  if(screen==='play'||screen==='title')audio.update(dt,world.state.elapsed/RUN_SECONDS);
  renderer.draw(world.state,screen,reduced?0:now/1000,input.pointer,reduced);
}
setScreen('title');requestAnimationFrame(frame);
