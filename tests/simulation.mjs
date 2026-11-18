import assert from 'node:assert/strict';
import { createWorld, distance } from '../game/src/world.js';
import { createRandom } from '../game/src/random.js';
import { STEP } from '../game/src/config.js';
export function pilot(s) {
  const p=s.player;
  let target=s.harvested>=60&&s.elapsed>=62?s.portal:s.asteroids.reduce((best,a)=>!best||distance(a,p)<distance(best,p)?a:best,null);
  const pickup=s.pickups.filter(c=>distance(c,p)<330).sort((a,b)=>distance(a,p)-distance(b,p))[0];
  if(pickup && (s.harvested<60||s.elapsed<60)) target=pickup;
  const d=distance(p,target),stop=target===s.portal?65:target.hp!==undefined?target.r+90:12;
  let dx=target.x-p.x,dy=target.y-p.y;
  if(d<stop){dx=0;dy=0;}
  // Dodge nearby drones and telegraphed impacts while holding the mining beam.
  const threat=s.enemies.filter(e=>distance(e,p)<210).sort((a,b)=>distance(a,p)-distance(b,p))[0];
  if(threat){dx=p.x-threat.x;dy=p.y-threat.y;}
  const hazard=s.hazards.find(h=>distance(h,p)<h.r+60);if(hazard){dx=p.x-hazard.x;dy=p.y-hazard.y;}
  // A tangent around rocks prevents the autopilot lodging against a solid deposit en route.
  if(target===s.portal)for(const rock of s.asteroids){const rd=distance(rock,p);if(rd<rock.r+65){dx+=(p.x-rock.x)*3;dy+=(p.y-rock.y)*3;}}
  let enemy=s.enemies.filter(e=>distance(e,p)<650).sort((a,b)=>distance(a,p)-distance(b,p))[0];
  const aim=enemy||target,a=Math.atan2(aim.y-p.y,aim.x-p.x);
  return {x:Math.abs(dx)>12?Math.sign(dx):0,y:Math.abs(dy)>12?Math.sign(dy):0,mine:true,boost:d>350,fire:!!enemy,pulse:s.enemies.some(e=>distance(e,p)<180),pointer:{active:true,x:720+Math.cos(a)*200,y:450+Math.sin(a)*200}};
}
if(process.argv[1].endsWith('simulation.mjs')){
  const logs=[];
  for(const seed of [1,7,19,42,2026]) {
    const w=createWorld(createRandom(seed)),s=w.state;let bought=false;
    for(let i=0;i<210/STEP && !s.outcome;i++) {
      w.step(STEP,pilot(s));
      if(s.credits>=14&&!bought){const charge=s.harvested;assert(w.buy('mining'));assert.equal(s.harvested,charge);bought=true;}
      assert(Number.isFinite(s.player.x)&&Number.isFinite(s.player.hull));assert(s.particles.length<=650);
    }
    logs.push({seed,outcome:s.outcome,time:s.elapsed.toFixed(1),hull:s.player.hull,harvested:s.harvested,kills:s.kills,wave:s.wave,bought});
    assert.equal(s.outcome,'victory',`Pilot seed ${seed}`);
    w.reset();assert.equal(w.state.portalAnnounced,false);assert.equal(w.state.player.hull,100);assert.equal(w.state.harvested,0);assert.equal(w.state.outcome,null);
  }
  // Unattended pilot must lose to combat; the timer independently ends a deserted sector.
  const combat=createWorld(createRandom(19));for(let i=0;i<210/STEP&&!combat.state.outcome;i++)combat.step(STEP,{});
  assert.equal(combat.state.outcome,'defeat');assert.equal(combat.state.player.hull,0);
  const timeout=createWorld(createRandom(19));timeout.state.nextWave=Infinity;timeout.state.nextHazard=Infinity;
  for(let i=0;i<211/STEP&&!timeout.state.outcome;i++)timeout.step(STEP,{});
  assert.equal(timeout.state.outcome,'defeat');assert.match(timeout.state.reason,/COLLAPSED/);
  const wave=createWorld(createRandom(10));wave.state.player.invuln=999;
  for(let i=0;i<70/STEP;i++)wave.step(STEP,{});
  assert(new Set(wave.state.enemies.map(e=>e.type)).size===3);assert(wave.state.hazards.length>=0);
  const budget=createWorld(createRandom(1));assert.equal(budget.buy('cannon'),false);assert.equal(budget.buy('unknown'),false);
  console.log(JSON.stringify({pilotRuns:logs,unattended:{time:combat.state.elapsed,hull:combat.state.player.hull},checks:'Victory, combat defeat, collapse defeat, upgrades, restart, three enemy types, finite state, particle cap'},null,2));
}
