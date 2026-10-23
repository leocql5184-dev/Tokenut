const $=id=>document.getElementById(id);let data=null,months=0;
const fmt=n=>n.toLocaleString('zh-CN');const compact=n=>n>=1e8?`${+(n/1e8).toFixed(1)}亿`:n>=1e4?`${+(n/1e4).toFixed(1)}万`:fmt(n);
function render(value){data=value;renderSources(value.sources||[]);const end=new Date(value.day+'T00:00:00Z'),start=new Date(end);if(months===0)start.setUTCDate(start.getUTCDate()-6);else {const date=start.getUTCDate();start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()-months);const last=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();start.setUTCDate(Math.min(date,last));}const startKey=start.toISOString().slice(0,10);
 const records=Object.entries(value.days).filter(([d,e])=>d>=startKey&&d<=value.day&&e.source==='local').sort(([a],[b])=>a.localeCompare(b));
 $('today').textContent=value.days[value.day]?.source==='local'?fmt(value.days[value.day].tokens):'—';$('total').textContent=records.length?fmt(records.reduce((a,[,e])=>a+e.tokens,0)):'—';$('rangeLabel').textContent=`${startKey} — ${value.day}`;
 $('connection').textContent=value.lastError?'部分来源异常 · 保留已存记录':'每5秒更新 · 已选来源合计';$('breakdown').textContent=(value.sources||[]).filter(s=>s.enabled).map(s=>`${s.name}：${fmt(value.days[value.day]?.bySource?.[s.id]||0)}`).join(' · ');$('connection').title=value.lastError||'';$('count').textContent=`${records.length} 天`;
 $('rows').replaceChildren(...records.slice().reverse().map(([date,e])=>{const tr=document.createElement('tr');[date,fmt(e.tokens),date===value.day?'更新中':'已归档'].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td);});return tr;}));
 const svg=$('chart'),ns='http://www.w3.org/2000/svg';svg.replaceChildren();const add=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);return e;};
 const max=Math.max(1000,...records.map(([,e])=>e.tokens))*1.12;const x=d=>60+(Date.parse(d+'T00:00:00Z')-start.getTime())/(end-start)*820;const y=n=>255-n/max*225;
 for(let i=0;i<5;i++){const n=max*i/4,yy=y(n);add('line',{x1:60,x2:880,y1:yy,y2:yy,stroke:'#e7ece4','stroke-dasharray':'4 5'});add('text',{x:48,y:yy+4,'text-anchor':'end'},compact(n));}
 [0,.5,1].forEach((f,i)=>{const d=new Date(+start+(end-start)*f).toISOString().slice(0,10);add('text',{x:60+820*f,y:286,'text-anchor':i===0?'start':i===2?'end':'middle'},d);});
 let commands='',prev=null;for(const[d,e]of records){const contiguous=prev&&Date.parse(d)-Date.parse(prev)===86400000;commands+=`${contiguous?'L':'M'}${x(d)},${y(e.tokens)} `;prev=d;}add('path',{d:commands,fill:'none',stroke:'#329469','stroke-width':2.5,'stroke-linejoin':'round'});
 records.forEach(([d,e])=>{const c=add('circle',{cx:x(d),cy:y(e.tokens),r:records.length>100?2:3.5,fill:d===value.day?'#da9e31':'#329469',tabindex:0,'aria-label':`${d} ${fmt(e.tokens)} tokens`});const show=()=>{$('tooltip').hidden=false;$('tooltip').textContent=`${d}${d===value.day?' · 更新中':''}\n${fmt(e.tokens)} tokens`;};c.onpointerenter=show;c.onfocus=show;c.onpointerleave=()=>{$('tooltip').hidden=true;};c.onblur=c.onpointerleave;});$('empty').hidden=!!records.length;
}
document.querySelectorAll('[data-months]').forEach(b=>b.onclick=()=>{months=Number(b.dataset.months);document.querySelectorAll('[data-months]').forEach(x=>x.setAttribute('aria-pressed',x===b));if(data)render(data);});
$('refresh').onclick=()=>window.tokenut.sync();window.tokenut.history().then(render);window.tokenut.onHistory(render);

function renderSources(sources){
 const container=$('sources');
 for(const source of sources){
  let row=document.getElementById(`source-${source.id}`);
  if(!row){row=document.createElement('div');row.id=`source-${source.id}`;row.className='source-row';
   const label=document.createElement('label'),toggle=document.createElement('input');toggle.type='checkbox';toggle.onchange=()=>window.tokenut.setSource(source.id,toggle.checked);label.append(toggle,document.createTextNode(source.name));
   const message=document.createElement('p');message.className='source-message';const path=document.createElement('p');path.className='source-path';
   const actions=document.createElement('div');actions.className='connect-actions';
   for(const [text,fn]of [['自动检测',()=>window.tokenut.autoSource(source.id)],['选择记录文件夹',()=>window.tokenut.chooseSource(source.id)]]){const button=document.createElement('button');button.textContent=text;button.onclick=fn;actions.append(button);}
   row.append(label,message,path,actions);container.append(row);
  }
  row.querySelector('input').checked=source.enabled;
  row.querySelector('.source-message').textContent=source.enabled?source.message:'未启用，不计入总数';
  row.querySelector('.source-message').title=source.detail||'';
  row.querySelector('.source-path').textContent=source.path;
  row.querySelectorAll('button').forEach(button=>button.disabled=!source.enabled);
 }
}
