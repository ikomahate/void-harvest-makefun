// Procedural art renderer. Cached nebula/planet layers keep per-frame work bounded.
import { FIELD, SECTOR, CHARGE_REQUIRED, GATE_ALIGNMENT_SECONDS } from './config.js';
import { createRandom } from './random.js';
const TAU=Math.PI*2;
export function createRenderer(canvas) {
  const c=canvas.getContext('2d',{alpha:false});
  const view={scale:1,x:0,y:0};
  const random=createRandom(73019);
  const stars=Array.from({length:400},()=>({x:random()*1800,y:random()*1200,r:random()*1.5+.25,z:random()*.6+.15,a:random()*.65+.2}));
  const nebula=document.createElement('canvas');nebula.width=1440;nebula.height=900;
  const n=nebula.getContext('2d');n.fillStyle='#050d15';n.fillRect(0,0,1440,900);
  function cloud(x,y,r,color){const g=n.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');n.fillStyle=g;n.fillRect(x-r,y-r,r*2,r*2);}
  cloud(1090,230,650,'#28302f');cloud(800,680,620,'#12313a');cloud(170,840,480,'#142a35');cloud(1320,70,360,'#4b302422');
  for(let i=0;i<140;i++){cloud(500+random()*1000,random()*900,30+random()*160,`rgba(74,110,117,${random()*.025})`);}
  const planet=document.createElement('canvas');planet.width=760;planet.height=760;
  const p=planet.getContext('2d');
  const halo=p.createRadialGradient(380,380,285,380,380,370);halo.addColorStop(0,'#ff985433');halo.addColorStop(.4,'#ff975c14');halo.addColorStop(1,'transparent');p.fillStyle=halo;p.fillRect(0,0,760,760);
  p.save();p.beginPath();p.arc(380,380,290,0,TAU);p.clip();
  const surface=p.createRadialGradient(540,180,5,290,460,420);surface.addColorStop(0,'#9c7960');surface.addColorStop(.28,'#5f5446');surface.addColorStop(.65,'#272d2d');surface.addColorStop(1,'#0a151e');p.fillStyle=surface;p.fillRect(0,0,760,760);
  for(let i=0;i<3200;i++) {
    const x=90+random()*580,y=90+random()*580,r=2+random()*15;
    p.fillStyle=random()>.5?`rgba(10,18,23,${random()*.2})`:`rgba(178,142,105,${random()*.13})`;
    p.beginPath();p.ellipse(x,y,r,r*.4,random()*3,0,TAU);p.fill();
  }
  // Branching molten fissures, authored as paths over a seeded rocky surface.
  const cracks=[[[505,100],[470,197],[523,242],[472,308],[495,360],[428,422],[450,495],[394,591]],[[472,308],[390,290],[360,340],[275,350],[220,432]],[[495,360],[565,393],[584,481],[655,520]],[[450,495],[370,480],[335,536]],[[523,242],[602,223],[641,261]]];
  for(const path of cracks){p.beginPath();path.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.strokeStyle='#f78e53';p.lineWidth=3;p.shadowColor='#ff762e';p.shadowBlur=18;p.stroke();p.lineWidth=1;p.strokeStyle='#ffe5b0';p.stroke();}
  p.shadowBlur=0;
  const shade=p.createLinearGradient(130,500,650,180);shade.addColorStop(0,'#040e18ed');shade.addColorStop(.55,'#040e1860');shade.addColorStop(1,'#040e1800');p.fillStyle=shade;p.fillRect(0,0,760,760);p.restore();
  p.beginPath();p.arc(380,380,291,3.9,6.8);p.strokeStyle='#e7b38b55';p.lineWidth=2;p.shadowColor='#ffb476';p.shadowBlur=14;p.stroke();
  const menuRocks=Array.from({length:25},()=>({x:620+random()*900,y:random()*900,r:5+random()*34,angle:random()*TAU,points:Array.from({length:9},(_,i)=>({a:i/9*TAU,r:.6+random()*.4})),hp:1,maxHp:1,flash:0}));
  function resize(){const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio);view.scale=Math.min(canvas.width/1440,canvas.height/900);view.x=(canvas.width-1440*view.scale)/2;view.y=(canvas.height-900*view.scale)/2;}
  function line(points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function circle(x,y,r,color,width=1){c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function text(str,x,y,size=12,color='#81959c',align='left'){c.font=`${size}px "Cascadia Code", Consolas, monospace`;c.fillStyle=color;c.textAlign=align;c.fillText(str,x,y);}
  function light(x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
  function background(s,t,menu){
    c.drawImage(nebula,0,0);
    const px=menu?t*5:s.player.x*.11,py=menu?t*1.5:s.player.y*.11;
    for(const star of stars){const x=((star.x-px*star.z)%1500+1500)%1500-30,y=((star.y-py*star.z)%960+960)%960-30;c.globalAlpha=star.a*(.8+Math.sin(t*.7+star.x)*.2);c.fillStyle=star.r>1.3?'#b7d9d9':'#91a7b4';c.fillRect(x,y,star.r,star.r);}
    c.globalAlpha=1;
    if(menu){c.save();c.translate(1170,235);c.rotate(-.12);c.drawImage(planet,-360,-360,720,720);c.restore();}
    else {c.globalAlpha=.48;c.drawImage(planet,1040-s.player.x*.08,-180-s.player.y*.04,590,590);c.globalAlpha=1;}
    // Orbital dust streaks give the sector an oblique, cinematic structure.
    c.save();c.translate(1080,370);c.rotate(-.37);
    for(let i=0;i<35;i++){c.globalAlpha=.025+(i%4)*.008;line([[-760,i*13],[800,i*13]],'#b4c5bd',i%5===0?2:.5);}c.restore();c.globalAlpha=1;
  }
  function rock(a,t){
    c.save();c.translate(a.x,a.y);c.rotate(a.angle);
    const g=c.createLinearGradient(-a.r,-a.r,a.r,a.r);g.addColorStop(0,a.flash>0?'#6a9694':'#39444a');g.addColorStop(.42,'#202e35');g.addColorStop(1,'#101b25');
    c.beginPath();a.points.forEach((q,i)=>{const x=Math.cos(q.a)*q.r*a.r,y=Math.sin(q.a)*q.r*a.r;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#61727888';c.lineWidth=1.2;c.stroke();
    // Faceted planes and cyan seams identify mineable material.
    for(let i=0;i<a.points.length;i+=2){const q=a.points[i],q2=a.points[(i+1)%a.points.length];line([[Math.cos(q.a)*q.r*a.r,Math.sin(q.a)*q.r*a.r],[-a.r*.12,a.r*.15],[Math.cos(q2.a)*q2.r*a.r,Math.sin(q2.a)*q2.r*a.r]],'#738a8c23');}
    c.rotate(.3);c.shadowColor='#65ffdc';c.shadowBlur=13;
    for(let i=0;i<3;i++){
      const x=(i-1)*a.r*.26,y=(i%2)*a.r*.2;
      c.beginPath();c.moveTo(x,y-a.r*.46);c.lineTo(x+a.r*.12,y-a.r*.12);c.lineTo(x+a.r*.06,y+a.r*.27);c.lineTo(x-a.r*.12,y+a.r*.08);c.closePath();c.fillStyle=i===1?'#80e9cf':'#47b9a7';c.fill();line([[x,y-a.r*.4],[x,y+a.r*.18]],'#d3fff3',1);
    }
    c.shadowBlur=0;c.restore();
    if(a.hp<a.maxHp){c.fillStyle='#102f35';c.fillRect(a.x-25,a.y-a.r-12,50,3);c.fillStyle='#8cf9ed';c.fillRect(a.x-25,a.y-a.r-12,50*a.hp/a.maxHp,3);}
  }
  function ship(x,y,angle,t,scale=1,boost=false){
    c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);
    light(-30,0,65,boost?'#ff98542a':'#8cf9ed24');
    c.shadowBlur=18;c.shadowColor=boost?'#ff975e':'#8cf9ed';
    c.beginPath();c.moveTo(-19,-7);c.lineTo(-43-Math.sin(t*41)*9-(boost?22:0),0);c.lineTo(-19,7);c.fillStyle=boost?'#ffae72':'#85f3ea';c.fill();c.shadowBlur=0;
    // Three-dimensional silhouette: swept nacelles, graphite body, luminous cockpit.
    c.beginPath();c.moveTo(30,0);c.lineTo(-23,-22);c.lineTo(-15,-4);c.lineTo(-27,0);c.lineTo(-15,4);c.lineTo(-23,22);c.closePath();c.fillStyle='#152c38';c.fill();c.strokeStyle='#a6bac3';c.lineWidth=1.2;c.stroke();
    c.beginPath();c.moveTo(30,0);c.lineTo(-15,-4);c.lineTo(-7,-13);c.closePath();c.fillStyle='#9cbdc4';c.fill();
    c.beginPath();c.moveTo(30,0);c.lineTo(-15,4);c.lineTo(-7,13);c.closePath();c.fillStyle='#385968';c.fill();
    line([[-20,-19],[-8,-11],[9,-4]],'#e7fcf7',1.6);line([[-20,19],[-8,11],[9,4]],'#688b98',1.6);
    c.shadowColor='#8cf9ed';c.shadowBlur=12;c.fillStyle='#a1fff0';c.beginPath();c.moveTo(15,0);c.lineTo(-3,-4);c.lineTo(-7,0);c.lineTo(-3,4);c.closePath();c.fill();c.shadowBlur=0;
    c.fillStyle='#ff975e';c.fillRect(-17,-17,5,2);c.fillRect(-17,15,5,2);c.restore();
  }
  function portal(x,y,r,t,online=true,extract=0){
    c.save();c.translate(x,y);
    light(0,0,r*2.2,online?'#54d9c521':'#ff975e12');
    c.save();c.scale(1,.78);c.rotate(-.25);
    const g=c.createRadialGradient(0,0,5,0,0,r);g.addColorStop(0,'#020b1299');g.addColorStop(.68,'#05161dcc');g.addColorStop(.88,online?'#194b50bb':'#4a322ccc');g.addColorStop(1,'#06131a00');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
    for(let i=0;i<9;i++){
      const rr=r*(.73+i*.032);c.beginPath();c.ellipse(0,0,rr,rr,0,t*.13+i*.18,t*.13+i*.18+TAU*.78);c.strokeStyle=online?`rgba(140,249,237,${.12+i*.065})`:`rgba(236,158,117,${.1+i*.04})`;c.lineWidth=i===7?3:1;c.shadowColor=online?'#8cf9ed':'#ff975e';c.shadowBlur=i>6?16:0;c.stroke();
    }
    c.shadowBlur=0;c.rotate(-t*.09);c.setLineDash([4,16]);circle(0,0,r*1.17,online?'#8cf9ed66':'#ff975e44');c.setLineDash([]);
    for(let i=0;i<8;i++){c.rotate(TAU/8);c.fillStyle='#162a31';c.strokeStyle='#9bada788';c.beginPath();c.moveTo(r*.99,-8);c.lineTo(r*1.13,-15);c.lineTo(r*1.2,0);c.lineTo(r*1.13,15);c.lineTo(r*.99,8);c.closePath();c.fill();c.stroke();c.fillStyle=online?'#8cf9ed':'#ff975e';c.fillRect(r*1.08,-3,r*.06,6);}
    c.restore();
    if(extract>0){c.beginPath();c.arc(0,0,r*1.3,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,extract/1.8));c.strokeStyle='#c8fff3';c.lineWidth=5;c.stroke();}
    c.restore();
  }
  function enemy(e,t){
    c.save();c.translate(e.x,e.y);c.rotate(e.angle);
    const color=e.flash>0?'#fff7e9':e.type==='sentinel'?'#e9b0ff':e.type==='brute'?'#ff975e':'#ff647b';
    light(0,0,55,color+'16');c.fillStyle='#231f2d';c.strokeStyle=color;c.lineWidth=1.4;
    c.beginPath();
    if(e.type==='brute'){c.moveTo(31,0);c.lineTo(15,-25);c.lineTo(-20,-24);c.lineTo(-29,0);c.lineTo(-20,24);c.lineTo(15,25);}
    else if(e.type==='sentinel'){c.moveTo(20,0);c.lineTo(0,-22);c.lineTo(-20,0);c.lineTo(0,22);}
    else {c.moveTo(24,0);c.lineTo(-19,-16);c.lineTo(-8,0);c.lineTo(-19,16);}
    c.closePath();c.fill();c.stroke();c.fillStyle=color;c.shadowColor=color;c.shadowBlur=13;c.fillRect(-4,-4,8,8);c.shadowBlur=0;
    if(e.type==='brute'){line([[-12,-16],[11,-16]],color,3);line([[-12,16],[11,16]],color,3);}c.restore();
    if(e.hp<e.maxHp){c.fillStyle='#ff647b';c.fillRect(e.x-20,e.y-e.r-9,40*e.hp/e.maxHp,2);}
  }
  function radar(s,t){
    const x=1253,y=694,r=86;
    c.save();c.translate(x,y);c.fillStyle='#07141bd9';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();circle(0,0,r,'#56787b66');circle(0,0,r*.66,'#8cf9ed15');circle(0,0,r*.33,'#8cf9ed15');line([[-r,0],[r,0]],'#8cf9ed15');line([[0,-r],[0,r]],'#8cf9ed15');
    c.save();c.rotate(t*.6);const grad=c.createConicGradient(0,0,0);grad.addColorStop(0,'#8cf9ed00');grad.addColorStop(.85,'#8cf9ed00');grad.addColorStop(1,'#8cf9ed15');c.fillStyle=grad;c.beginPath();c.moveTo(0,0);c.arc(0,0,r-1,0,TAU);c.fill();c.restore();
    const map=(o)=>({x:(o.x/SECTOR.width-.5)*144,y:(o.y/SECTOR.height-.5)*144});
    for(const a of s.asteroids){const q=map(a);c.fillStyle='#8cf9ed65';c.fillRect(q.x-1,q.y-1,2,2);}
    for(const e of s.enemies){const q=map(e);c.fillStyle='#ff647b';c.fillRect(q.x-2,q.y-2,4,4);}
    const gate=map(s.portal);circle(gate.x,gate.y,5,s.harvested>=CHARGE_REQUIRED?'#8cf9ed':'#ff975e',1.5);
    const q=map(s.player);c.save();c.translate(q.x,q.y);c.rotate(s.player.angle);c.beginPath();c.moveTo(5,0);c.lineTo(-4,-3);c.lineTo(-4,3);c.closePath();c.fillStyle='#ffffff';c.fill();c.restore();c.restore();text('SECTOR RADAR',x,y+r+24,10,'#879ea5','center');
  }
  function draw(s,screen,t,pointer,reduced=false){
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#040a10';c.fillRect(0,0,canvas.width,canvas.height);
    c.setTransform(view.scale,0,0,view.scale,view.x,view.y);
    const menu=screen==='title'||screen==='tutorial';background(s,t,menu);
    if(menu){
      // The title is a live rendered sector tableau, not a static promotional image.
      c.save();for(const a of menuRocks){c.save();c.translate(0,Math.sin(t*.2+a.x)*5);rock(a,t);c.restore();}c.restore();
      portal(1090,495,205,t,true);
      c.save();c.globalAlpha=.45;line([[880,635],[805,690],[730,732]],'#8cf9ed',1);c.restore();
      ship(909+Math.sin(t*.3)*5,618+Math.sin(t*.6)*8,-.5,t,2.25,true);
      text('GATE 07 / LAST KNOWN EXIT',1090,745,11,'#90b4b7','center');line([[1090,715],[1090,730]],'#90b4b7');
      const fade=c.createLinearGradient(0,0,1000,0);fade.addColorStop(0,'#060e15dd');fade.addColorStop(.57,'#060e1599');fade.addColorStop(1,'#060e1500');c.fillStyle=fade;c.fillRect(0,0,1440,900);
    }else{
      const p=s.player,cam={x:p.x-720,y:p.y-450};
      c.save();if(!reduced&&s.shake>0)c.translate(Math.sin(t*91)*s.shake,Math.cos(t*79)*s.shake*.7);c.translate(-cam.x,-cam.y);
      c.strokeStyle='#8cf9ed08';c.lineWidth=.5;
      for(let x=Math.floor(cam.x/180)*180;x<cam.x+1440;x+=180)line([[x,cam.y],[x,cam.y+900]],'#8cf9ed08',.5);
      for(let y=Math.floor(cam.y/180)*180;y<cam.y+900;y+=180)line([[cam.x,y],[cam.x+1440,y]],'#8cf9ed08',.5);
      c.strokeStyle='#ff975e77';c.lineWidth=2;c.strokeRect(0,0,SECTOR.width,SECTOR.height);
      const gateReady=s.harvested>=CHARGE_REQUIRED&&s.elapsed>=GATE_ALIGNMENT_SECONDS;
      portal(s.portal.x,s.portal.y,s.portal.r,t,gateReady,s.extract);
      text(gateReady?'HOLD E TO JUMP':s.elapsed<GATE_ALIGNMENT_SECONDS?`ALIGNING / ${Math.ceil(GATE_ALIGNMENT_SECONDS-s.elapsed)}s`:'GATE 07 / CHARGE REQUIRED',s.portal.x,s.portal.y+155,12,gateReady?'#8cf9ed':'#ffb68d','center');
      // Wrecked mining infrastructure adds landmarks without blocking movement.
      c.save();c.translate(1750,1170);c.rotate(-.4);c.strokeStyle='#54616d55';c.fillStyle='#16202a';c.fillRect(-160,-28,320,56);c.strokeRect(-160,-28,320,56);for(let i=-140;i<160;i+=40){c.strokeRect(i,-38,22,76);}line([[-210,0],[210,0]],'#7d8f9744',2);c.restore();text('KHEPRI / MINING ARRAY',1610,1255,10,'#657880');
      for(const h of s.hazards){light(h.x,h.y,h.r,'#ff526c18');circle(h.x,h.y,h.r,'#ff526c66');circle(h.x,h.y,h.r*(1-h.timer/2.2),'#ff526c',2);line([[h.x-12,h.y],[h.x+12,h.y]],'#ff526c');line([[h.x,h.y-12],[h.x,h.y+12]],'#ff526c');text('IMPACT',h.x,h.y-h.r-10,10,'#ff8d98','center');}
      for(const a of s.asteroids)if(Math.abs(a.x-p.x)<800&&Math.abs(a.y-p.y)<550)rock(a,t);
      for(const q of s.pickups){c.save();c.translate(q.x,q.y);c.rotate(q.angle);c.shadowColor='#8cf9ed';c.shadowBlur=12;c.fillStyle='#a0ffe2';c.fillRect(-4,-4,8,8);c.shadowBlur=0;c.restore();}
      if(s.beam){const end=s.beam;c.shadowBlur=16;c.shadowColor='#8cf9ed';line([[p.x,p.y],[end.x,end.y]],'#8cf9ed55',10);line([[p.x,p.y],[end.x,end.y]],'#adfff0',2);c.shadowBlur=0;light(end.x,end.y,65,'#8cf9ed33');}
      for(const b of s.bullets){const color=b.hostile?'#ff758c':'#b0fff2';c.shadowBlur=10;c.shadowColor=color;line([[b.x-b.vx*.014,b.y-b.vy*.014],[b.x,b.y]],color,b.hostile?4:2.5);c.shadowBlur=0;}
      for(const e of s.enemies)if(Math.abs(e.x-p.x)<800&&Math.abs(e.y-p.y)<550)enemy(e,t);
      for(const r of s.rings){c.globalAlpha=r.life;circle(r.x,r.y,r.r,r.color,2);}c.globalAlpha=1;
      if(reduced || p.invuln<=0 || Math.floor(t*20)%2===0)ship(p.x,p.y,p.angle,t,1,p.boosting);
      if(p.shield>0){c.globalAlpha=p.invuln>0?.65:.14;circle(p.x,p.y,37,'#8cf9ed',p.invuln>0?2:1);c.globalAlpha=1;}
      for(const q of s.particles){c.globalAlpha=Math.min(1,q.life/q.maxLife);c.fillStyle=q.color;c.fillRect(q.x,q.y,q.size,q.size);}c.globalAlpha=1;
      for(const l of s.labels){c.globalAlpha=Math.min(1,l.life);text(l.text,l.x,l.y,11,l.color,'center');}c.globalAlpha=1;c.restore();
      // Gate navigation marker clamps to the safe viewport and never hides behind the HUD.
      const dx=s.portal.x-p.x,dy=s.portal.y-p.y,d=Math.hypot(dx,dy);
      if(d>270){const factor=Math.min(530/Math.max(1,Math.abs(dx)),270/Math.max(1,Math.abs(dy)),1),x=720+dx*factor,y=450+dy*factor;const color=s.harvested>=CHARGE_REQUIRED?'#8cf9ed':'#ffb68d';c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));line([[-8,-8],[3,0],[-8,8]],color,2);c.restore();text(`GATE 07 · ${Math.round(d)}m`,x,y+27,10,color,'center');}
      radar(s,t);
      if(pointer?.active && screen==='play'){
        const x=pointer.x,y=pointer.y;c.strokeStyle='#bbd7d4aa';c.lineWidth=1;c.beginPath();c.arc(x,y,10,0,TAU);c.stroke();line([[x-17,y],[x-12,y]],'#bbd7d4aa');line([[x+12,y],[x+17,y]],'#bbd7d4aa');line([[x,y-17],[x,y-12]],'#bbd7d4aa');line([[x,y+12],[x,y+17]],'#bbd7d4aa');
      }
      if(s.damageFlash>0){c.strokeStyle=`rgba(255,82,108,${s.damageFlash*.5})`;c.lineWidth=18;c.strokeRect(0,0,1440,900);}
      if(s.remaining<45){c.fillStyle=`rgba(255,70,60,${.025+Math.sin(t*3)*.014})`;c.fillRect(0,0,1440,900);}
    }
    // Fine viewfinder marks and a soft vignette unify the interface and world.
    const vignette=c.createRadialGradient(720,420,260,720,420,900);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#02070e99');c.fillStyle=vignette;c.fillRect(0,0,1440,900);
    for(const [x,y,sx,sy] of [[28,28,1,1],[1412,28,-1,1],[28,872,1,-1],[1412,872,-1,-1]])line([[x,y+16*sy],[x,y],[x+16*sx,y]],'#859c9f55');
  }
  resize();window.addEventListener('resize',resize);
  return {draw,toLogical(x,y){const ratio=Math.min(devicePixelRatio||1,2);return{x:(x*ratio-view.x)/view.scale,y:(y*ratio-view.y)/view.scale};}};
}
