import { writeFile } from 'node:fs/promises';
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function connect(){
  const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
  const tab=tabs.find(t=>t.type==='page');
  if(!tab)throw new Error('No browser tab');
  const socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  let id=0;const pending=new Map(),events=[];
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}}else events.push(m);};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  const click=async selector=>{const rect=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});};
  const key=async(code,down=true)=>{await send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',code,key:({Escape:'Escape',Enter:'Enter',Space:' ',ShiftLeft:'Shift'}[code]||code.replace('Key','').toLowerCase()),windowsVirtualKeyCode:({Escape:27,Enter:13,Space:32,ShiftLeft:16}[code]||code.replace('Key','').charCodeAt(0))});await sleep(65);};
  const shot=async path=>{const r=await send('Page.captureScreenshot',{format:'jpeg',quality:88,fromSurface:true});await writeFile(path,Buffer.from(r.data,'base64'));};
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  return{send,evaluate,click,key,shot,events,close:()=>socket.close()};
}
if(process.argv[2]==='preview'){
  const b=await connect();await b.send('Page.navigate',{url:'http://127.0.0.1:8080/?seed=19'});await sleep(1200);console.log(await b.evaluate('document.body.dataset.screen'));await b.shot('artifacts/preview.jpg');console.log(b.events.filter(e=>e.method==='Runtime.exceptionThrown'));b.close();
}
