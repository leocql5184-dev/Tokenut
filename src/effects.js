// Two bounded layers keep atmospheric light behind the pet and sparks in front.
window.createTokenutEffects = function (back, front) {
  let bg = back.getContext('2d'), fg = front.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#ffe6a3','#fff1b5','#ffaaa8','#ffd56b','#d5f5ff','#81eaff','#ffcaff'];
  const counts = [0,3,14,44,22,48,88];
  const motes = Array.from({length:104}, (_,i)=>({phase:i*2.39996, radius:46+(i*17%32), speed:.3+(i%7)*.07, size:.7+(i%4)*.35}));
  let stage=0, reduced=false, handle=0, last=0;
  function clear() { bg.clearRect(0,0,280,264); fg.clearRect(0,0,280,264); }
  function polygon(points, color, alpha) {
    bg.globalAlpha=alpha; bg.fillStyle=color; bg.beginPath();
    points.forEach(([x,y],i)=>i?bg.lineTo(x,y):bg.moveTo(x,y)); bg.closePath(); bg.fill(); bg.globalAlpha=1;
  }
  const pet=document.getElementById('pet');
  let edge=[], surface=[], heatMask=null;
  function samplePet() {
    if(!pet.complete || !pet.naturalWidth) return;
    const mask=document.createElement('canvas'); mask.width=142; mask.height=142;
    const c=mask.getContext('2d',{willReadFrequently:true});
    const scale=Math.min(142/pet.naturalWidth,142/pet.naturalHeight);
    const w=pet.naturalWidth*scale,h=pet.naturalHeight*scale;
    c.drawImage(pet,(142-w)/2,(142-h)/2,w,h);
    const data=c.getImageData(0,0,142,142).data; edge=[];surface=[];
    heatMask=document.createElement('canvas');heatMask.width=142;heatMask.height=142;
    const heat=heatMask.getContext('2d');heat.drawImage(mask,0,0);heat.globalCompositeOperation='source-in';
    heat.fillStyle='#ff4d1f';heat.fillRect(0,0,142,142);
    for(let y=10;y<133;y+=4) {
      let first=-1,last=-1;
      for(let x=3;x<139;x++) if(data[(y*142+x)*4+3]>210) {
        if(first<0)first=x;last=x;
        if(x%7===0)surface.push({x:69+x,y:22+y});
      }
      if(first>=0){edge.push({x:69+first,y:22+y,side:-1});edge.push({x:69+last,y:22+y,side:1});}
    }
  }
  pet.addEventListener('load',()=>{samplePet();refresh();});samplePet();
  function sparkle(context,x,y,r,color,alpha) {
    context.save();context.globalAlpha=alpha;context.fillStyle=color;
    context.beginPath();context.moveTo(x,y-r);context.quadraticCurveTo(x+.45,y-.45,x+r*.65,y);
    context.quadraticCurveTo(x+.45,y+.45,x,y+r);context.quadraticCurveTo(x-.45,y+.45,x-r*.65,y);
    context.quadraticCurveTo(x-.45,y-.45,x,y-r);context.fill();context.restore();
  }
  function atmosphere(t) {
    if(stage===2 && edge.length) {
      // Diffuse heat follows the real body silhouette; no flame strips or shapes.
      if(heatMask) {
        bg.save();bg.globalAlpha=.4+Math.sin(t*1.4)*.07;
        bg.filter='blur(6px)';bg.drawImage(heatMask,69,22);bg.restore();
      }
    } else if(stage===3 && edge.length) {
      // Gold stays metallic: tiny warm motes and isolated specular highlights.
      for(let i=0;i<7;i++) {
        const p=edge[(i*11)%edge.length];
        sparkle(bg,p.x+p.side*5,p.y,2.5,'#ffe6a1',.25+.2*Math.sin(t+i)**2);
      }
    } else if(stage===4 && surface.length) {
      // Sparse white-blue scintillation, with no large floating geometry.
      for(let i=0;i<5;i++) {
        const p=edge[(i*17)%edge.length];
        sparkle(bg,p.x+p.side*4,p.y,3.5,i%2?'#e9dfff':'#d2f6ff',.3);
      }
    } else if(stage===5) {
      // Broken angular circuit paths and traveling pulses evoke quantum jumps.
      for(let side of [-1,1]) for(let j=0;j<3;j++) {
        const x=140+side*(55+j*9), y=26+j*14;
        bg.strokeStyle=j%2?'#b4a0ff':'#72eaff';bg.globalAlpha=.55;bg.lineWidth=1;
        bg.beginPath();bg.moveTo(x,y);bg.lineTo(x+side*12,y+18);bg.lineTo(x+side*3,y+32);bg.lineTo(x+side*17,y+52);bg.lineTo(x+side*8,y+76);bg.lineTo(x+side*15,y+102);bg.stroke();
        const pulse=(t*30+j*29)%100;bg.fillStyle='#d9ffff';bg.fillRect(x+side*10-2,y+pulse,4,4);
      }
      bg.globalAlpha=1;
    } else if(stage===6) {
      // Prismatic rupture: sharp rays fan outward at independent lengths.
      for(let i=0;i<19;i++) {
        const a=i*2.39996, inner=36+(i%3)*7, outer=65+(i*13%24)+Math.sin(t*1.5+i)*5;
        const cx=140, cy=91, color=`hsla(${i*47+t*18} 100% 72% / .48)`;
        polygon([[cx+Math.cos(a-.045)*inner,cy+Math.sin(a-.045)*inner*.8],[cx+Math.cos(a)*outer,cy+Math.sin(a)*outer*.8],[cx+Math.cos(a+.045)*inner,cy+Math.sin(a+.045)*inner*.8]],color,1);
      }
    }
  }
  function paint(time, still=false) {
    clear(); const t=time/4000; atmosphere(t);
    if(still) return;
    for(let i=0;i<counts[stage];i++) {
      const p=motes[i], life=(t*p.speed*.5+i*.137)%1;
      let x,y,color=colors[stage];
      if(stage===6) {const r=30+life*60;x=140+Math.cos(p.phase)*r;y=91+Math.sin(p.phase)*r*.78;color=`hsl(${i*29+t*25} 100% 76%)`;}
      else if(stage===5) {x=140+(i%2?1:-1)*(48+(i%5)*7);y=22+life*138;}
      else if(stage===4 && surface.length) {const spot=surface[(i*37)%surface.length];x=spot.x;y=spot.y;color=i%3?'#f4fdff':'#b9e9ff';}
      else if((stage===2 || stage===3) && edge.length) {const spot=edge[(i*13)%edge.length];x=spot.x+spot.side*(3+life*11)+Math.sin(t+p.phase)*2;y=spot.y-life*(stage===2?24:12);color=stage===2?(i%3?'#ff8b42':'#ffce80'):'#ffe6a0';}
      else {x=140+Math.sin(p.phase)*p.radius+(stage===2?Math.sin(t*2+p.phase)*life*13:0);y=158-life*140;if(stage===2)color=i%3?'#ff973d':'#ffdb77';}
      fg.globalAlpha=stage===4?.85*Math.pow(.5+.5*Math.sin(t*1.6+p.phase),12):Math.sin(life*Math.PI)*.65;
      fg.fillStyle=color;fg.strokeStyle=color;fg.lineWidth=.8;
      if(stage===3) {fg.beginPath();fg.arc(x,y,.45+p.size*.32,0,Math.PI*2);fg.fill();if(i%9===0 && surface.length){const spot=surface[(i*19)%surface.length];sparkle(fg,spot.x,spot.y,3.8,'#fff0bd',fg.globalAlpha);}}
      else if(stage===4) {sparkle(fg,x,y,2.5+p.size*1.6,color,fg.globalAlpha);}
      else if(stage>=5) {fg.beginPath();fg.moveTo(x,y);fg.lineTo(x-(stage===6?Math.cos(p.phase)*9:0),y-(stage===6?Math.sin(p.phase)*7:5));fg.stroke();}
      else {fg.beginPath();fg.arc(x,y,stage===2?p.size*.55:p.size,0,Math.PI*2);fg.fill();}
    }
    fg.globalAlpha=1;
  }
  let outgoing=null;
  function paintLayers(time) {
    paint(time);
    if(!outgoing) return;
    if(time-outgoing.start>=20000){outgoing=null;return;}
    const active={bg,fg,stage,edge,surface,heatMask};
    bg=previous[0].getContext('2d');fg=previous[1].getContext('2d');
    stage=outgoing.stage;edge=outgoing.edge;surface=outgoing.surface;heatMask=outgoing.heatMask;
    paint(time);
    ({bg,fg,stage,edge,surface,heatMask}=active);
  }
  function frame(time) {
    handle=0;
    if(document.hidden || reduced || motion.matches) return;
    if(time-last>=33) { paintLayers(time); last=time; }
    handle=requestAnimationFrame(frame);
  }
  function refresh() {
    cancelAnimationFrame(handle); handle=0;
    if(document.hidden) { clear(); return; }
    if(reduced || motion.matches) paint(0,true);
    else { paintLayers(performance.now()); handle=requestAnimationFrame(frame); }
  }
  motion.addEventListener('change',refresh); document.addEventListener('visibilitychange',refresh);
  const previous=[back,front].map(canvas=>{
    const layer=document.createElement('canvas');layer.width=280;layer.height=264;
    layer.className='effects-previous';layer.setAttribute('aria-hidden','true');layer.style.opacity=0;
    canvas.before(layer);return layer;
  });
  let initialized=false;
  return {update(nextStage, nextReduced) {
    if(initialized && nextStage!==stage && !nextReduced && !motion.matches) {
      outgoing={stage,edge,surface,heatMask,start:performance.now()};
      [back,front].forEach((canvas,i)=>{
        const layer=previous[i];layer.getAnimations().forEach(a=>a.cancel());
        const c=layer.getContext('2d');c.clearRect(0,0,280,264);c.drawImage(canvas,0,0);
        layer.animate([{opacity:1},{opacity:0}],{duration:20000,easing:'ease-in-out'});
        canvas.getAnimations().forEach(a=>a.cancel());
        canvas.animate([{opacity:0},{opacity:1}],{duration:20000,easing:'ease-in-out'});
      });
    }
    if(nextReduced || motion.matches) {outgoing=null;[...previous,back,front].forEach(c=>c.getAnimations().forEach(a=>a.cancel()));}
    initialized=true;stage=nextStage; reduced=nextReduced; refresh();
  }};
};
