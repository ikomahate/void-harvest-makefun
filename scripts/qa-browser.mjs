// Real-browser QA and unedited captures. Automation reads the simulation but drives only
// the same key/pointer/button handlers a human uses. No staged worlds or altered outcomes.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { connect,sleep } from './browser.mjs';
import { pilot } from '../tests/simulation.mjs';
const b=await connect(),report={};
try{
  await b.send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await b.send('Page.navigate',{url:'http://127.0.0.1:8080/?seed=19'});await sleep(900);
  assert.equal(await b.evaluate('document.body.dataset.screen'),'title');await b.shot('screenshots/1-start.jpg');
  await b.click('#launch');assert.equal(await b.evaluate('document.body.dataset.screen'),'tutorial');
  await b.click('#manual-launch');await sleep(250);
  await b.key('Escape');assert.equal(await b.evaluate('document.body.dataset.screen'),'paused');
  const time1=await b.evaluate('(async()=>(await import("./src/main.js")).world.state.elapsed)()');await sleep(450);
  assert.equal(await b.evaluate('(async()=>(await import("./src/main.js")).world.state.elapsed)()'),time1);report.pauseFreezesTime=true;
  await b.click('#resume');await b.click('#sound');assert.equal(await b.evaluate('document.querySelector("#sound").textContent'),'SOUND OFF');await b.click('#sound');report.soundControls=true;
  await b.evaluate(`(async()=>{
    const {world}=await import('./src/main.js');
    const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const pilot=${pilot.toString()};
    const held=new Set();
    window.__stopPilot=()=>{clearInterval(window.__pilotTimer);for(const code of held)window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.clear();document.querySelector('#game').dispatchEvent(new PointerEvent('pointerup',{button:0,bubbles:true}));};
    window.__pilotTimer=setInterval(()=>{
      if(document.body.dataset.screen!=='play'){
        for(const code of held)window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.clear();return;
      }
      const i=pilot(world.state),wanted=new Set(['KeyE']);
      if(i.x<0)wanted.add('KeyA');if(i.x>0)wanted.add('KeyD');if(i.y<0)wanted.add('KeyW');if(i.y>0)wanted.add('KeyS');if(i.boost)wanted.add('ShiftLeft');if(i.pulse)wanted.add('Space');
      for(const code of held)if(!wanted.has(code)){window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.delete(code);}
      for(const code of wanted)if(!held.has(code)){window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));held.add(code);}
      const scale=Math.min(innerWidth/1440,innerHeight/900),left=(innerWidth-1440*scale)/2,top=(innerHeight-900*scale)/2;
      const canvas=document.querySelector('#game');canvas.dispatchEvent(new PointerEvent('pointermove',{clientX:left+i.pointer.x*scale,clientY:top+i.pointer.y*scale,bubbles:true}));
      canvas.dispatchEvent(new PointerEvent(i.fire?'pointerdown':'pointerup',{button:0,bubbles:true,clientX:left+i.pointer.x*scale,clientY:top+i.pointer.y*scale}));
    },45);
  })()`);
  await b.evaluate(`(()=>{window.__frameSamples=[];let previous=performance.now();function sample(t){window.__frameSamples.push(t-previous);previous=t;if(window.__frameSamples.length<240)requestAnimationFrame(sample);}requestAnimationFrame(sample);})()`);
  let combat=false,shop=false,start=Date.now();
  while(Date.now()-start<125000){
    await sleep(400);
    const state=await b.evaluate('(async()=>{const s=(await import("./src/main.js")).world.state;return{elapsed:s.elapsed,harvested:s.harvested,credits:s.credits,kills:s.kills,wave:s.wave,outcome:s.outcome,hull:s.player.hull,enemies:s.enemies.length,visibleEnemies:s.enemies.filter(e=>Math.abs(e.x-s.player.x)<660&&Math.abs(e.y-s.player.y)<390).length}})()');
    if(!combat&&state.elapsed>37.5&&state.wave>=2&&(state.visibleEnemies>=2||state.elapsed>41)){await b.shot('screenshots/2-play.jpg');combat=true;report.combatCapture=state;}
    if(!shop&&state.elapsed>48){
      await b.key('KeyU');await b.key('KeyU',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'shop');
      const charge=await b.evaluate('(async()=>(await import("./src/main.js")).world.state.harvested)()');await b.click('[data-upgrade="mining"]');await b.click('[data-upgrade="cannon"]');await b.click('[data-upgrade="shield"]');
      const after=await b.evaluate('(async()=>{const s=(await import("./src/main.js")).world.state;return{harvested:s.harvested,credits:s.credits,upgrades:s.upgrades}})()');assert.equal(after.harvested,charge);report.upgrades=after;
      await b.shot('screenshots/3-refit.jpg');await b.click('#close-shop');shop=true;
    }
    if(state.outcome){report.victory=state;break;}
  }
  await b.evaluate('window.__stopPilot()');
  assert.equal(report.victory?.outcome,'victory');assert.equal(await b.evaluate('document.body.dataset.screen'),'result');await b.shot('screenshots/4-end.jpg');
  await b.click('#restart');assert.equal(await b.evaluate('document.body.dataset.screen'),'play');
  await sleep(350);const reset=await b.evaluate('(async()=>{const s=(await import("./src/main.js")).world.state;return{hull:s.player.hull,harvested:s.harvested,wave:s.wave}})()');assert.equal(reset.hull,100);assert.equal(reset.harvested,0);assert.equal(reset.wave,0);report.restart=true;
  const limit=Date.now()+65000;
  while(Date.now()<limit){await sleep(400);if(await b.evaluate('document.body.dataset.screen')==='result')break;}
  report.defeat=await b.evaluate('(async()=>{const s=(await import("./src/main.js")).world.state;return{outcome:s.outcome,reason:s.reason,hull:s.player.hull,elapsed:s.elapsed}})()');assert.equal(report.defeat.outcome,'defeat');await b.shot('artifacts/defeat.jpg');
  report.frameTiming=await b.evaluate('(()=>{const samples=window.__frameSamples.slice(2).sort((a,b)=>a-b);return{frames:samples.length,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)]}})()');
  await b.click('#return-title');assert.equal(await b.evaluate('document.body.dataset.screen'),'title');
  // Check a smaller desktop viewport and the title -> manual -> flight loop again.
  await b.send('Emulation.setDeviceMetricsOverride',{width:1024,height:768,deviceScaleFactor:1,mobile:false});
  await b.key('Enter');await b.key('Enter',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'tutorial');
  await b.key('Enter');await b.key('Enter',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'play');report.keyboardLaunch=true;
  await b.evaluate('window.dispatchEvent(new Event("blur"))');assert.equal(await b.evaluate('document.body.dataset.screen'),'paused');report.focusLossPauses=true;
  await b.shot('artifacts/small-desktop.jpg');report.smallDesktop=true;
  report.exceptions=b.events.filter(e=>e.method==='Runtime.exceptionThrown');
  report.remoteRequests=b.events.filter(e=>e.method==='Network.requestWillBeSent'&&!/^http:\/\/127\.0\.0\.1:8080\//.test(e.params.request.url)&&!e.params.request.url.startsWith('data:')).map(e=>e.params.request.url);
  assert.equal(report.exceptions.length,0);assert.equal(report.remoteRequests.length,0);
  await writeFile('artifacts/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){await b.shot('artifacts/qa-failure.jpg');console.error(e);process.exitCode=1;}finally{await b.evaluate('window.__stopPilot?.()').catch(()=>{});b.close();}
