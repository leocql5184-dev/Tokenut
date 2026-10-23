// Two bounded layers keep atmospheric light behind the pet and sparks in front.
window.createTokenutEffects = function (back, front) {
  const bg = back.getContext('2d'), fg = front.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#ffe6a3','#fff1b5','#ffaaa8','#ffd56b','#d5f5ff','#81eaff','#ffcaff'];
  const counts = [0,3,32,36,32,48,88];
  const motes = Array.from({length:104}, (_,i)=>({phase:i*2.39996, radius:46+(i*17%32), speed:.3+(i%7)*.07, size:.7+(i%4)*.35}));
  let stage=0, reduced=false, handle=0, last=0;
  function clear() { bg.clearRect(0,0,280,264); fg.clearRect(0,0,280,264); }
  function polygon(points, color, alpha) {
    bg.globalAlpha=alpha; bg.fillStyle=color; bg.beginPath();
    points.forEach(([x,y],i)=>i?bg.lineTo(x,y):bg.moveTo(x,y)); bg.closePath(); bg.fill(); bg.globalAlpha=1;
  }
  function atmosphere(t) {
    if(stage===2) {
      // Uneven tongues of flame rise and flare out from the sides, never a halo.
      for(let i=0;i<13;i++) {
        const x=65+i*12.5, base=155-Math.abs(x-140)*.18;
        const h=30+(i*19%45)+Math.sin(t*2.8+i)*9;
        const lean=(x-140)*.2+Math.sin(t*2+i)*7;
        const g=bg.createLinearGradient(x,base,x+lean,base-h);
        g.addColorStop(0,'#e6381620');g.addColorStop(.55,'#ff591b99');g.addColorStop(1,'#ffd14b08');
        bg.fillStyle=g;bg.beginPath();bg.moveTo(x-11,base);
        bg.bezierCurveTo(x-15,base-h*.4,x+lean+12,base-h*.55,x+lean,base-h);
        bg.bezierCurveTo(x+lean-3,base-h*.48,x+18,base-h*.38,x+11,base);bg.fill();
      }
    } else if(stage===3) {
      // Tall, angular gold shafts form a crown silhouette.
      for(let i=0;i<9;i++) {
        const x=62+i*19.5, top=18+(i*23%50)+Math.sin(t*.8+i)*5;
        const g=bg.createLinearGradient(x,163,x,top);g.addColorStop(0,'#d3921205');g.addColorStop(.65,'#ffc74666');g.addColorStop(1,'#fff0ad00');
        polygon([[x-8,161],[x-3,top+15],[x,top],[x+4,top+17],[x+8,161]],g,.8);
        bg.strokeStyle='#ffe59a';bg.globalAlpha=.45;bg.beginPath();bg.moveTo(x,top+15);bg.lineTo(x,top+40);bg.stroke();bg.globalAlpha=1;
      }
    } else if(stage===4) {
      // Asymmetric crystalline shards: faceted planes, no enclosing circle.
      const shards=[[67,139,-.4,30],[78,88,-.6,23],[96,36,-.2,17],[194,49,.45,27],[214,103,.6,34],[200,151,.35,23]];
      shards.forEach(([x,y,angle,h],i)=>{
        bg.save();bg.translate(x,y);bg.rotate(angle);
        polygon([[-6,12],[-8,-h*.35],[0,-h],[8,-h*.3],[5,12]],i%2?'#c4b7ff':'#9fe6ff',.23);
        polygon([[0,12],[0,-h],[8,-h*.3]],'#ecfbff',.5);
        bg.strokeStyle='#daffff';bg.globalAlpha=.7;bg.beginPath();bg.moveTo(-6,12);bg.lineTo(0,-h);bg.lineTo(8,-h*.3);bg.stroke();bg.restore();
      });
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
    clear(); const t=time/1000; atmosphere(t);
    if(still) return;
    for(let i=0;i<counts[stage];i++) {
      const p=motes[i], life=(t*p.speed*.5+i*.137)%1;
      let x,y,color=colors[stage];
      if(stage===6) {const r=30+life*60;x=140+Math.cos(p.phase)*r;y=91+Math.sin(p.phase)*r*.78;color=`hsl(${i*29+t*25} 100% 76%)`;}
      else if(stage===5) {x=140+(i%2?1:-1)*(48+(i%5)*7);y=22+life*138;}
      else if(stage===4) {x=140+Math.sin(p.phase)*p.radius;y=88+Math.cos(p.phase*1.3)*60;}
      else {x=140+Math.sin(p.phase)*p.radius+(stage===2?Math.sin(t*2+p.phase)*life*13:0);y=158-life*140;if(stage===2)color=i%3?'#ff973d':'#ffdb77';}
      fg.globalAlpha=stage===4?.2+.65*Math.pow(.5+.5*Math.sin(t*2+p.phase),4):Math.sin(life*Math.PI)*.8;
      fg.fillStyle=color;fg.strokeStyle=color;fg.lineWidth=.8;
      if(stage===3) {fg.save();fg.translate(x,y);fg.rotate(p.phase+t*.4);fg.fillRect(-1,-2,2,4);fg.restore();}
      else if(stage===4) {const r=p.size*3;fg.beginPath();fg.moveTo(x-r,y);fg.lineTo(x+r,y);fg.moveTo(x,y-r);fg.lineTo(x,y+r);fg.stroke();}
      else if(stage>=5) {fg.beginPath();fg.moveTo(x,y);fg.lineTo(x-(stage===6?Math.cos(p.phase)*9:0),y-(stage===6?Math.sin(p.phase)*7:5));fg.stroke();}
      else {fg.beginPath();fg.arc(x,y,p.size,0,Math.PI*2);fg.fill();}
    }
    fg.globalAlpha=1;
  }
  function frame(time) {
    handle=0;
    if(document.hidden || reduced || motion.matches) return;
    if(time-last>=33) { paint(time); last=time; }
    handle=requestAnimationFrame(frame);
  }
  function refresh() {
    cancelAnimationFrame(handle); handle=0;
    if(document.hidden) { clear(); return; }
    if(reduced || motion.matches) paint(0,true);
    else { paint(performance.now()); handle=requestAnimationFrame(frame); }
  }
  motion.addEventListener('change',refresh); document.addEventListener('visibilitychange',refresh);
  return {update(nextStage, nextReduced) { stage=nextStage; reduced=nextReduced; refresh(); }};
};
