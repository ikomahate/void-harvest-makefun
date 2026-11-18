import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect,sleep} from './browser.mjs';
const b=await connect(),report={};
try{
  await b.send('Emulation.setDeviceMetricsOverride',{width:1024,height:768,deviceScaleFactor:1,mobile:false});
  await b.send('Page.navigate',{url:'http://127.0.0.1:8080/?seed=19'});await sleep(600);
  assert.equal(await b.evaluate('document.activeElement.id'),'launch');
  await b.key('Enter');await b.key('Enter',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'tutorial');
  await b.key('Enter');await b.key('Enter',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'play');report.keyboardLaunch=true;
  await b.key('Escape');await b.key('Escape',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'paused');
  await b.key('Space');await b.key('Space',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'play');report.keyboardResume=true;
  await b.key('KeyD');await b.key('ShiftLeft');await sleep(300);await b.key('KeyD',false);await b.key('ShiftLeft',false);
  const state=await b.evaluate('(async()=>{const p=(await import("./src/main.js")).world.state.player;return{x:p.x,energy:p.energy}})()');assert(state.x>1050);assert(state.energy<100);report.boostAndMovement=state;
  await b.key('Space');await b.key('Space',false);const cooldown=await b.evaluate('(async()=>(await import("./src/main.js")).world.state.player.pulseCooldown)()');assert(cooldown>9);report.pulse=true;
  await b.key('KeyU');await b.key('KeyU',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'shop');
  await b.key('Enter');await b.key('Enter',false);assert.equal(await b.evaluate('document.body.dataset.screen'),'play');report.keyboardRefitClose=true;
  await b.evaluate('window.dispatchEvent(new Event("blur"))');assert.equal(await b.evaluate('document.body.dataset.screen'),'paused');report.focusLossPauses=true;
  await b.shot('artifacts/small-desktop.jpg');report.smallDesktop=true;
  await b.click('#resume');
  report.frameTiming=await b.evaluate('new Promise(resolve=>{const times=[];let previous;function tick(t){if(previous!==undefined)times.push(t-previous);previous=t;if(times.length<240)requestAnimationFrame(tick);else{times.sort((a,b)=>a-b);resolve({frames:times.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.floor(times.length*.95)]});}}requestAnimationFrame(tick);})');
  await b.key('Escape');await b.key('Escape',false);
  report.exceptions=b.events.filter(e=>e.method==='Runtime.exceptionThrown');assert.equal(report.exceptions.length,0);
  await writeFile('artifacts/input-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{b.close();}
