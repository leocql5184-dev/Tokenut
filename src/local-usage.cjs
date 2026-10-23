const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const readline=require('node:readline');
const cache=new Map();
function dayOf(value){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
function delta(prev,total,last){if(!Number.isFinite(total)||total<0)return 0;if(prev===null)return Math.max(0,Number(last)||0);return total>=prev?total-prev:Math.max(0,Number(last)||0);}
async function parse(file){let prev=null,id=file,start=null;const days={};
 const lines=readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity});
 for await(const line of lines){let e;try{e=JSON.parse(line);}catch{continue;}
 if(e.type==='session_meta'){id=e.payload?.id||id;start=e.payload?.timestamp||e.timestamp;}
 if(e.type!=='event_msg'||e.payload?.type!=='token_count')continue;
 const info=e.payload.info,total=info?.total_token_usage?.total_tokens;if(!Number.isFinite(total))continue;
 const n=delta(prev,total,info?.last_token_usage?.total_tokens);prev=total;
 if(!e.timestamp||!Number.isFinite(Date.parse(e.timestamp))||(start&&Date.parse(e.timestamp)<Date.parse(start)))continue;
 const day=dayOf(e.timestamp);days[day]=(days[day]||0)+n;
 }return {id,days};}
async function readLocalUsage(root=path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'sessions')){
 const files=[];async function walk(dir){for(const e of await fs.promises.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.name.endsWith('.jsonl'))files.push(p);}}
 await walk(root);const sessions=new Map();
 for(const file of files){const stat=await fs.promises.stat(file);let value=cache.get(file);if(!value||value.size!==stat.size||value.mtime!==stat.mtimeMs){value={...await parse(file),size:stat.size,mtime:stat.mtimeMs};cache.set(file,value);}const old=sessions.get(value.id);if(!old||value.mtime>old.mtime)sessions.set(value.id,value);}
 const days={};for(const s of sessions.values())for(const [d,n]of Object.entries(s.days))days[d]=(days[d]||0)+n;
 return {days,sessions:sessions.size};
}
module.exports={readLocalUsage,dayOf,delta};
