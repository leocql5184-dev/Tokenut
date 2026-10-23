const names=['初始形态','微光觉醒','愤怒模式','纯金形态','钻石形态','科技充能','最终形态'];
const files=['01-000m-initial','02-001m-awakening','04-030m-anger','05-060m-gold','05-060m-diamond','06-090m-charging','07-100m-ultimate'];
const palette=[['#e6b944','#ffe6a3'],['#eac44c','#fff1b5'],['#e85657','#ffaaa8'],['#e2b32d','#fff2b5'],['#a7d4f0','#f2f8ff'],['#64d9eb','#d2beff'],['#99d6ff','#f3c5ff']];
const $=id=>document.getElementById(id);let current=null,oldStage=-1;
files.forEach(file=>{const img=new Image();img.src=`../assets/character/stages-v1/${file}.png`;});
[.2,.4,.6,.8].forEach(p=>{const tick=document.createElement('i');tick.style.left=`${p*100}%`;$('ticks').append(tick);});
function render(s){
 current=s;document.body.dataset.stage=s.stage;document.body.classList.toggle('preview',s.preview);document.body.classList.toggle('reduced',s.reducedMotion);
 document.documentElement.style.setProperty('--accent',palette[s.stage][0]);document.documentElement.style.setProperty('--secondary',palette[s.stage][1]);document.documentElement.style.setProperty('--fill',`${s.fill*100}%`);
 document.documentElement.style.setProperty('--charge',s.fill);if(oldStage!==s.stage){$('pet').src=`../assets/character/stages-v1/${files[s.stage]}.png`;$('pet').alt=names[s.stage];document.body.classList.remove('evolving');requestAnimationFrame(()=>document.body.classList.add('evolving'));oldStage=s.stage;}
 $('stage').textContent=names[s.stage];$('mode').textContent=s.preview?'预览':'';
 $('amount').textContent=s.tokens===null?'—':s.tokens.toLocaleString('zh-CN');
 $('progress').setAttribute('aria-valuetext',s.tokens===null?'用量未知':`已消耗 ${s.tokens} tokens，充能进度 ${Math.round(s.fill*100)}%`);
 if(s.tokens===null)$('progress').removeAttribute('aria-valuenow');else $('progress').setAttribute('aria-valuenow',Math.min(100000000,s.tokens));
 $('status').textContent=s.preview?'预览 · 不计入用量':'';
 $('status').title=[s.lastError,s.updatedAt?`上次同步 ${new Date(s.updatedAt).toLocaleTimeString()}`:'',`日期 ${s.day} · 北京时间 · 本机 Codex 会话记录`].filter(Boolean).join('\n');
 $('instrument').title=s.tokens===null?'等待本机记录':`今日 ${s.tokens.toLocaleString()} tokens / 100,000,000；含缓存输入，不重复叠加推理 token`;
 $('sync').disabled=s.status==='正在同步';
}
$('menu').onclick=()=>window.tokenut.menu();$('sync').onclick=()=>window.tokenut.sync();
document.addEventListener('keydown',e=>{if(e.key==='Escape'||(e.shiftKey&&e.key==='F10'))window.tokenut.menu();});
let interactive=true;document.addEventListener('mousemove',e=>{const next=!!e.target.closest('#character,#instrument');if(next!==interactive){interactive=next;window.tokenut.interactive(next);}});
window.tokenut.subscribe(render);window.tokenut.state().then(render);
const canvas=$('particles'),ctx=canvas.getContext('2d');const particles=Array.from({length:42},()=>({x:76+Math.random()*128,y:12+Math.random()*125,r:.6+Math.random()*1.3,s:.2+Math.random()*.35,p:Math.random()*Math.PI*2}));
let last=0;function frame(time){requestAnimationFrame(frame);if(time-last<32)return;const dt=Math.min(2,(time-last)/32);last=time;ctx.clearRect(0,0,280,264);if(!current||current.reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const count=[0,3,8,12,18,28,42][current.stage];particles.slice(0,count).forEach((p,i)=>{p.y-=p.s*dt;if(p.y<18)p.y=140;ctx.globalAlpha=.3+.45*(Math.sin(time/900+p.p)+1)/2;ctx.fillStyle=current.stage===6?`hsl(${(i*31+time/40)%360} 95% 76%)`:palette[current.stage][1];ctx.beginPath();ctx.arc(p.x+Math.sin(time/1300+p.p)*5,p.y,p.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;}requestAnimationFrame(frame);



const character=$('character');character.tabIndex=0;character.setAttribute('role','button');character.setAttribute('aria-label','打开用量记录；按住拖动移动角色');character.title='点击查看用量记录 · 按住拖动';
let drag=null;
character.onpointerdown=e=>{if(e.button!==0)return;drag={x:e.screenX,y:e.screenY,startX:e.screenX,startY:e.screenY,moved:false};character.setPointerCapture(e.pointerId);};
character.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.screenX-drag.startX,e.screenY-drag.startY)>5)drag.moved=true;if(drag.moved){window.tokenut.drag({x:e.screenX-drag.x,y:e.screenY-drag.y});drag.x=e.screenX;drag.y=e.screenY;}};
character.onpointerup=()=>{if(drag&&!drag.moved)window.tokenut.openClient();drag=null;};character.onpointercancel=()=>{drag=null;};character.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.tokenut.openClient();}};
