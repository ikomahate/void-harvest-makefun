// Browser-independent simulation: mining, combat, upgrades, hazards and extraction.
import { SECTOR, RUN_SECONDS, CHARGE_REQUIRED, GATE_ALIGNMENT_SECONDS, UPGRADES } from './config.js';
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const TAU = Math.PI * 2;
export function createWorld(random) {
  const state = {};
  let events = [];
  function emit(type, text = '') { events.push({ type, text }); }
  function asteroid(x,y,r) {
    const points = Array.from({length: 11}, (_,i) => ({ a: i / 11 * TAU, r: .72 + random() * .28 }));
    return { x,y,r, points, angle: random()*TAU, spin: (random()-.5)*.13, hp: r*1.7, maxHp: r*1.7, ore: 8+Math.floor(r/10), flash: 0, dead: false };
  }
  function reset() {
    Object.assign(state, {
      player: { x: 1050, y: 1480, vx: 0, vy: 0, angle: -.7, hull: 100, shield: 60, maxShield: 60, energy: 100, invuln: 0, sinceHit: 10, cooldown: 0, pulseCooldown: 0, thrust: 0, boosting: false },
      portal: { x: 2780, y: 600, r: 115 },
      asteroids: [], enemies: [], bullets: [], pickups: [], particles: [], rings: [], hazards: [], labels: [],
      elapsed: 0, remaining: RUN_SECONDS, wave: 0, nextWave: 12, nextHazard: 48, credits: 0, harvested: 0, kills: 0, score: 0,
      upgrades: { cannon: 0, mining: 0, shield: 0, engine: 0 }, outcome: null, reason: '', extract: 0, beam: null,
      shake: 0, damageFlash: 0, mineSound: 0, collectSound: 0, portalAnnounced: false, gateAnnounced: false, hint: 'Hold E near a crystal asteroid to mine.', hintTime: 8,
    });
    // A readable opening cluster, followed by seeded deposits throughout the sector.
    [[-185,-95,49],[155,-125,59],[285,45,43],[-235,170,64],[85,260,48],[420,-270,72],[-450,-330,56]].forEach(([x,y,r]) => state.asteroids.push(asteroid(1050+x,1480+y,r)));
    for(let i=0;i<57;i++) {
      const a = asteroid(140+random()*(SECTOR.width-280),140+random()*(SECTOR.height-280),30+random()*46);
      if (distance(a,state.player)>380 && distance(a,state.portal)>220 && !state.asteroids.some(b=>distance(a,b)<a.r+b.r+35)) state.asteroids.push(a);
    }
    events = [];
  }
  function particles(x,y,color,count = 16,speed = 120) {
    for(let i=0;i<count && state.particles.length<650;i++) {
      const a = random()*TAU, s = speed*(.2+random());
      state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+random()*.7,maxLife:1,color,size:1+random()*3});
    }
  }
  function label(x,y,amount) {
    // Combine a shower of fragments into one readable resource notification.
    const recent=state.labels.find(l=>l.life>1&&Math.hypot(l.x-x,l.y-y)<95);
    if(recent){recent.amount+=amount;recent.text=`+${recent.amount} CRYSTALS`;recent.life=1.5;}
    else state.labels.push({x,y,amount,text:`+${amount} CRYSTALS`,color:'#8cf9ed',life:1.5});
  }
  function ring(x,y,color,r=10,max=200) { state.rings.push({x,y,color,r,max,life:1}); }
  function drop(x,y,amount) {
    for(let i=0;i<Math.ceil(amount/3);i++) {
      const a=random()*TAU, r=random()*35;
      state.pickups.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,value:Math.min(3,amount-i*3),life:45,angle:random()*TAU});
    }
  }
  function destroyAsteroid(a) {
    if(a.dead) return;
    a.dead=true; drop(a.x,a.y,a.ore); particles(a.x,a.y,'#8cf9ed',35,160); particles(a.x,a.y,'#7b8385',14,90);
    ring(a.x,a.y,'#8cf9ed',a.r,130); state.shake=Math.max(state.shake,3); emit('kill');
  }
  function killEnemy(e) {
    if(e.dead) return;
    e.dead=true; state.kills++; drop(e.x,e.y,e.type==='brute'?8:4); state.score+=e.type==='brute'?300:100;
    particles(e.x,e.y,'#ff975e',26,180); ring(e.x,e.y,'#ff975e',12,95); state.shake=Math.max(state.shake,4); emit('kill');
  }
  function damage(amount) {
    const p=state.player;
    if(p.invuln>0 || state.outcome) return;
    p.sinceHit=0; p.invuln=.7;
    const absorbed=Math.min(p.shield,amount); p.shield-=absorbed; p.hull=Math.max(0,p.hull-(amount-absorbed));
    state.damageFlash=.7; state.shake=8; particles(p.x,p.y,absorbed?'#8cf9ed':'#ff526c',16,150); emit('hit');
    if(p.hull<=0) finish('defeat','HULL BREACH · Your ship was lost to the sector.');
  }
  function finish(outcome,reason) {
    if(state.outcome) return;
    state.outcome=outcome; state.reason=reason;
    if(outcome==='victory') { state.score+=1500+Math.floor(state.remaining)*10+Math.floor(state.player.hull)*5; ring(state.player.x,state.player.y,'#8cf9ed',20,550); }
    emit(outcome==='victory'?'win':'lose');
  }
  function spawnWave() {
    state.wave++; state.nextWave=state.elapsed+25;
    const count=Math.min(3+state.wave,11), p=state.player;
    for(let i=0;i<count && state.enemies.length<32;i++) {
      const a=random()*TAU, r=650+random()*150;
      const type=state.wave>=3 && i%4===0?'brute':state.wave>=2 && i%3===0?'sentinel':'stalker';
      const hp=type==='brute'?145:type==='sentinel'?62:38;
      state.enemies.push({x:clamp(p.x+Math.cos(a)*r,70,SECTOR.width-70),y:clamp(p.y+Math.sin(a)*r,70,SECTOR.height-70),type,hp,maxHp:hp,r:type==='brute'?30:19,angle:a,cooldown:1+random()*2,flash:0,dead:false});
    }
    state.hint=`HOSTILE WAVE ${String(state.wave).padStart(2,'0')} · ${count} signatures inbound`; state.hintTime=4; emit('wave');
  }
  function buy(id) {
    const item=UPGRADES.find(u=>u.id===id);
    if(!item || state.outcome) return false;
    const tier=state.upgrades[id], cost=item.cost+tier*12;
    if(tier>=item.max || state.credits<cost) return false;
    state.credits-=cost; state.upgrades[id]++;
    if(id==='shield') { state.player.maxShield+=25; state.player.shield=state.player.maxShield; state.player.hull=Math.min(100,state.player.hull+20); }
    emit('upgrade'); return true;
  }
  function step(dt,input={}) {
    events=[];
    if(state.outcome) return events;
    const s=state,p=s.player, u=s.upgrades;
    s.elapsed+=dt; s.remaining=Math.max(0,RUN_SECONDS-s.elapsed); s.hintTime=Math.max(0,s.hintTime-dt);
    p.invuln=Math.max(0,p.invuln-dt); p.sinceHit+=dt; p.cooldown-=dt; p.pulseCooldown=Math.max(0,p.pulseCooldown-dt);
    s.mineSound-=dt; s.collectSound-=dt; s.shake*=Math.exp(-10*dt); s.damageFlash=Math.max(0,s.damageFlash-dt*2);
    if(p.sinceHit>5) p.shield=Math.min(p.maxShield,p.shield+(6+u.shield*2)*dt);
    let ix=input.x||0,iy=input.y||0, mag=Math.hypot(ix,iy); if(mag>1){ix/=mag;iy/=mag;}
    p.boosting=!!(input.boost && p.energy>2 && mag>0);
    p.energy=clamp(p.energy+(p.boosting?-34:20+u.engine*5)*dt,0,100);
    const speed=(235+u.engine*35)*(p.boosting?1.85:1), response=1-Math.exp(-8*dt);
    p.vx+=(ix*speed-p.vx)*response; p.vy+=(iy*speed-p.vy)*response; p.thrust=mag;
    p.x=clamp(p.x+p.vx*dt,30,SECTOR.width-30);p.y=clamp(p.y+p.vy*dt,30,SECTOR.height-30);
    if(input.pointer?.active) p.angle=Math.atan2(input.pointer.y-450,input.pointer.x-720);
    else {
      const target=s.enemies.filter(e=>distance(e,p)<550).sort((a,b)=>distance(a,p)-distance(b,p))[0];
      if(target) p.angle=Math.atan2(target.y-p.y,target.x-p.x);
      else if(mag>0) p.angle=Math.atan2(iy,ix);
    }
    if(mag>0 && random()<.65 && s.particles.length<650) {
      s.particles.push({x:p.x-Math.cos(p.angle)*24,y:p.y-Math.sin(p.angle)*24,vx:-p.vx*.25+(random()-.5)*25,vy:-p.vy*.25+(random()-.5)*25,life:.25,maxLife:.25,color:p.boosting?'#ff975e':'#8cf9ed',size:p.boosting?4:2});
    }
    // Pulse gives a tactical escape window: radial damage, projectile clearing, brief immunity.
    if(input.pulse && p.pulseCooldown<=0) {
      p.pulseCooldown=10; p.invuln=.7; ring(p.x,p.y,'#8cf9ed',25,310); s.shake=5; emit('pulse');
      for(const e of s.enemies) if(distance(e,p)<300) { e.hp-=65; const a=Math.atan2(e.y-p.y,e.x-p.x); e.x+=Math.cos(a)*90;e.y+=Math.sin(a)*90; if(e.hp<=0) killEnemy(e); }
      s.bullets=s.bullets.filter(b=>!b.hostile || distance(b,p)>330);
    }
    const portalNear=distance(p,s.portal)<s.portal.r+25;
    s.beam=null;
    if(input.mine && !portalNear) {
      const range=235+u.mining*45;
      const candidates=s.asteroids.filter(a=>!a.dead && distance(a,p)<range+a.r).sort((a,b)=>distance(a,p)-distance(b,p));
      const a=candidates[0];
      if(a) {
        s.beam={x:a.x,y:a.y};a.hp-=(36+u.mining*20)*dt;a.flash=.15;
        if(random()<.6) particles(a.x+(random()-.5)*a.r,a.y+(random()-.5)*a.r,'#8cf9ed',1,75);
        if(s.mineSound<=0) {emit('mine');s.mineSound=.14;}
        if(a.hp<=0) destroyAsteroid(a);
      }
    }
    if(input.fire && p.cooldown<=0) {
      p.cooldown=.23/(1+u.cannon*.3); emit('shot');
      const offsets=u.cannon>=2?[-.055,.055]:[0];
      offsets.forEach(offset=>{const a=p.angle+offset; s.bullets.push({x:p.x+Math.cos(a)*30,y:p.y+Math.sin(a)*30,vx:Math.cos(a)*850,vy:Math.sin(a)*850,life:1.15,hostile:false,damage:19+u.cannon*6});});
    }
    if(s.elapsed>=s.nextWave) spawnWave();
    if(s.elapsed>=s.nextHazard) {
      s.nextHazard=s.elapsed+Math.max(4,11-s.wave*.6);
      s.hazards.push({x:clamp(p.x+p.vx*.65+(random()-.5)*200,80,SECTOR.width-80),y:clamp(p.y+p.vy*.65+(random()-.5)*200,80,SECTOR.height-80),r:100,timer:2.2});
    }
    for(const h of s.hazards) { h.timer-=dt;if(h.timer<=0&&!h.dead){h.dead=true;particles(h.x,h.y,'#ff975e',48,250);ring(h.x,h.y,'#ff526c',15,180);if(distance(p,h)<h.r)damage(45);s.shake=Math.max(s.shake,distance(p,h)<700?6:0);} }
    s.hazards=s.hazards.filter(h=>!h.dead);
    for(const e of s.enemies) {
      if(e.dead)continue;
      const d=distance(e,p), a=Math.atan2(p.y-e.y,p.x-e.x);e.angle=a;e.flash=Math.max(0,e.flash-dt);e.cooldown-=dt;
      const speed=e.type==='brute'?75:e.type==='sentinel'?105:120+s.wave*4;
      const approach=e.type==='sentinel'?(d<280?-.6:d<400?0:1):1;
      e.x+=(Math.cos(a)*approach+(e.type==='sentinel'?Math.cos(a+1.57)*.65:0))*speed*dt;
      e.y+=(Math.sin(a)*approach+(e.type==='sentinel'?Math.sin(a+1.57)*.65:0))*speed*dt;
      if(d<e.r+20){damage(e.type==='brute'?26:12);e.x-=Math.cos(a)*45;e.y-=Math.sin(a)*45;}
      if(e.type!=='stalker' && e.cooldown<=0 && d<700) {
        e.cooldown=e.type==='brute'?2.8:1.85;
        const angles=e.type==='brute'?[-.2,0,.2]:[0];
        angles.forEach(offset=>s.bullets.push({x:e.x,y:e.y,vx:Math.cos(a+offset)*255,vy:Math.sin(a+offset)*255,life:3.5,hostile:true,damage:18}));
      }
    }
    for(const b of s.bullets) {
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.hostile) { if(distance(b,p)<22){damage(b.damage);b.life=0;} }
      else {
        for(const e of s.enemies) if(!e.dead && distance(b,e)<e.r+5) {e.hp-=b.damage;e.flash=.12;b.life=0;particles(b.x,b.y,'#ff975e',3,80);if(e.hp<=0)killEnemy(e);break;}
        if(b.life>0) for(const a of s.asteroids) if(!a.dead && distance(b,a)<a.r*.85) {a.hp-=b.damage*.8;a.flash=.13;b.life=0;particles(b.x,b.y,'#8cf9ed',3,60);if(a.hp<=0)destroyAsteroid(a);break;}
      }
    }
    s.bullets=s.bullets.filter(b=>b.life>0);s.enemies=s.enemies.filter(e=>!e.dead);s.asteroids=s.asteroids.filter(a=>!a.dead);
    for(const a of s.asteroids) {a.angle+=a.spin*dt;a.flash=Math.max(0,a.flash-dt);}
    // Asteroids are solid; gently separate the ship without punishing the mining approach.
    for(const a of s.asteroids) {
      const d=distance(a,p),r=a.r*.78+18;
      if(d<r){const ang=Math.atan2(p.y-a.y,p.x-a.x);p.x=a.x+Math.cos(ang)*r;p.y=a.y+Math.sin(ang)*r;p.vx*=.85;p.vy*=.85;}
    }
    for(const c of s.pickups) {
      c.life-=dt;c.angle+=dt;
      const d=distance(c,p),radius=155+u.engine*35;
      if(d<radius){const a=Math.atan2(p.y-c.y,p.x-c.x),speed=90+(radius-d)*5;c.x+=Math.cos(a)*speed*dt;c.y+=Math.sin(a)*speed*dt;}
      if(d<26){c.life=0;s.credits+=c.value;s.harvested+=c.value;s.score+=c.value*25;label(p.x,p.y-35,c.value);if(s.collectSound<=0){emit('collect');s.collectSound=.1;}}
    }
    s.pickups=s.pickups.filter(c=>c.life>0);
    if(s.harvested>=CHARGE_REQUIRED && !s.portalAnnounced) {s.portalAnnounced=true;s.hint='CORE CHARGED · Keep mining for upgrades while the gate aligns';s.hintTime=7;emit('upgrade');}
    if(s.elapsed>=GATE_ALIGNMENT_SECONDS && !s.gateAnnounced) {s.gateAnnounced=true;s.hint='GATE ALIGNED · Charge your core, reach Gate 07 and hold E to jump';s.hintTime=7;emit('upgrade');}
    if(portalNear && s.harvested>=CHARGE_REQUIRED && s.elapsed>=GATE_ALIGNMENT_SECONDS && input.mine) {
      s.extract+=dt;if(s.extract>=1.8)finish('victory','JUMP COMPLETE · You escaped the collapse.');
    } else s.extract=Math.max(0,s.extract-dt*2);
    if(s.remaining<=0)finish('defeat','SECTOR COLLAPSED · The jump window has closed.');
    for(const q of s.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.97;q.vy*=.97;q.life-=dt;}
    s.particles=s.particles.filter(q=>q.life>0);
    for(const r of s.rings){r.r+=(r.max-r.r)*dt*4;r.life-=dt*1.5;}s.rings=s.rings.filter(r=>r.life>0);
    for(const l of s.labels){l.y-=22*dt;l.life-=dt;}s.labels=s.labels.filter(l=>l.life>0);
    return events;
  }
  reset();
  return {state,reset,step,buy};
}
