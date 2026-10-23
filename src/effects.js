// Two bounded layers keep atmospheric light behind the pet and sparks in front.
window.createTokenutEffects = function (back, front) {
  const bg = back.getContext('2d'), fg = front.getContext('2d');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#ffe6a3','#fff1b5','#ffaaa8','#ffd56b','#d5f5ff','#81eaff','#ffcaff'];
  const counts = [0,3,8,36,52,72,104];
  const motes = Array.from({length:104}, (_,i)=>({phase:i*2.39996, radius:46+(i*17%32), speed:.3+(i%7)*.07, size:.7+(i%4)*.35}));
  let stage=0, reduced=false, handle=0, last=0;
  function clear() { bg.clearRect(0,0,280,264); fg.clearRect(0,0,280,264); }
  function ring(context, rx, ry, tilt, color, alpha, turn=0) {
    context.save(); context.translate(140,93); context.rotate(tilt);
    context.strokeStyle=color; context.globalAlpha=alpha; context.lineWidth=1;
    context.beginPath(); context.ellipse(0,0,rx,ry,0,turn,turn+Math.PI*1.65); context.stroke(); context.restore();
  }
  function paint(time, still=false) {
    clear(); const t=time/1000;
    if(stage>=3) {
      const glow=bg.createRadialGradient(140,94,25,140,94,85);
      glow.addColorStop(0,'transparent'); glow.addColorStop(.55,colors[stage]+'55'); glow.addColorStop(1,'transparent');
      bg.fillStyle=glow; bg.fillRect(50,4,180,174);
      if(stage===3) {
        ring(bg,70,65,-.15,'#f8c246',.45,t*.2);
        ring(bg,62,18,0,'#ffe7a2',.55,-t*.3);
      } else if(stage===4) {
        for(let i=0;i<8;i++) {
          const a=i*Math.PI/4+t*.08, x=140+Math.cos(a)*70, y=93+Math.sin(a)*62;
          bg.strokeStyle=i%2?'#d5c8ff':'#a5eaff'; bg.globalAlpha=.45; bg.beginPath();
          bg.moveTo(x,y-5); bg.lineTo(x+3,y); bg.lineTo(x,y+5); bg.lineTo(x-3,y); bg.closePath(); bg.stroke();
        }
        bg.globalAlpha=1;
      } else {
        for(let i=0;i<(stage===6?4:3);i++) {
          const color=stage===6?`hsl(${i*90+t*24} 95% 72%)`:['#71e5ff','#ad99ff','#bcfaff'][i];
          ring(bg,76,25+i*5,i*Math.PI/3,color,.5,t*(i%2?-.45:.35));
        }
      }
    }
    if(still) return;
    const count=counts[stage];
    for(let i=0;i<count;i++) {
      const p=motes[i], a=p.phase+t*p.speed*(stage>=5?1:.25);
      let x,y;
      if(stage<4) { x=140+Math.sin(p.phase)*p.radius; y=159-((t*(10+stage*2)+i*23)%140); }
      else { x=140+Math.cos(a)*p.radius; y=93+Math.sin(a)*(p.radius*.85); }
      const color=stage===6?`hsl(${i*29+t*35} 100% 76%)`:colors[stage];
      fg.globalAlpha=.35+.5*(.5+.5*Math.sin(t*1.8+p.phase)); fg.fillStyle=color; fg.strokeStyle=color;
      if(stage>=5) {
        fg.lineWidth=1; fg.beginPath(); fg.moveTo(x,y); fg.lineTo(x+Math.sin(a)*5,y-Math.cos(a)*4); fg.stroke();
      }
      fg.beginPath(); fg.arc(x,y,p.size,0,Math.PI*2); fg.fill();
      if(stage>=4 && i%4===0) {
        const r=p.size*3; fg.lineWidth=.8; fg.beginPath(); fg.moveTo(x-r,y); fg.lineTo(x+r,y); fg.moveTo(x,y-r); fg.lineTo(x,y+r); fg.stroke();
      }
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
