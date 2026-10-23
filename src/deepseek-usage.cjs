const fs=require('node:fs/promises');
const path=require('node:path');
const zlib=require('node:zlib');
const {promisify}=require('node:util');
const {dayOf}=require('./local-usage.cjs');
const decompress=promisify(zlib.zstdDecompress);
const cache=new Map();

// Standard Zstandard frame boundaries; wait for a complete append/checksum.
// Do not use one-shot decompression on a concatenation: Node returns only its first frame.
function frameEnd(bytes,start) {
 let p=start;
 if(bytes.length-p<5)return null;
 if(bytes.readUInt32LE(p)!==0xfd2fb528)throw Error('无效的 Zstandard 日志');
 const flags=bytes[p+4];p+=5;
 if(flags&24)throw Error('无效的 Zstandard 帧头');
 const single=!!(flags&32), dict=flags&3, size=flags>>>6;
 p+=(single?0:1)+(dict===3?4:dict)+(size?2**size:single?1:0);
 if(p>bytes.length)return null;
 for(;;){
  if(p+3>bytes.length)return null;
  const block=bytes.readUIntLE(p,3);p+=3;
  const type=(block>>>1)&3;
  if(type===3)throw Error('无效的 Zstandard 数据块');
  p+=type===1?1:block>>>3;
  if(p>bytes.length)return null;
  if(block&1)break;
 }
 if(flags&4)p+=4;
 return p<=bytes.length?p:null;
}
function tokenCount(usage) {
 if(!usage)return null;
 const valid=n=>Number.isSafeInteger(n)&&n>=0;
 if(valid(usage.totalTokens))return usage.totalTokens;
 if(!valid(usage.inputTokens)||!valid(usage.outputTokens))return null;
 const values=[usage.inputTokens,usage.outputTokens,usage.cacheReadTokens??0,usage.cacheWriteTokens??0];
 if(!values.every(valid))return null;
 const sum=values.reduce((a,b)=>a+b,0);
 return valid(sum)?sum:null; // Reasoning is already part of output.
}
function foldRecords(records) {
 const header=records[0];
 if(header?.type!=='session'||![3,4].includes(header.version)||typeof header.id!=='string')throw Error('仅支持 Harness v3/v4 会话日志');
 let cut=0;
 if(header.isSeeded){
  cut=records.findLastIndex(e=>e.type==='session/end-seed'&&e.data?.inherited===true);
  if(cut<1)throw Error('分支会话缺少继承边界，暂不计入');
 }
 const days={};let last=null,previousSeq=-1;
 for(const e of records.slice(1)){
  if(!Number.isSafeInteger(e.seq)||e.seq!==previousSeq+1)throw Error('会话事件序号不连续');
  previousSeq=e.seq;
 }
 for(const e of records.slice(cut+1)){
  const d=e.data||{};
  if(e.type==='llm/retry-started'&&last?.turn===d.turn&&last.step===d.step){last=null;continue;}
  if(!['assistant/message','assistant/attempt'].includes(e.type))continue;
  const streamUsage=d.stream?.findLast(r=>r.type==='chunk'&&r.chunk?.type==='usage')?.chunk.usage;
  const usage=e.type==='assistant/message'&&d.usage!==undefined?d.usage:streamUsage;
  const tokens=tokenCount(usage);
  if(tokens===null)continue;
  if(!Number.isFinite(e.time)||!Number.isFinite(new Date(e.time).getTime()))throw Error('用量时间无效');
  if(!Number.isSafeInteger(d.turn)||!Number.isSafeInteger(d.step))throw Error('用量步骤无效');
  const day=dayOf(e.time);
  if(last?.turn===d.turn&&last.step===d.step)days[last.day]-=last.tokens;
  days[day]=(days[day]||0)+tokens;
  last={turn:d.turn,step:d.step,day,tokens};
 }
 return {id:header.id,days};
}
async function readFile(file) {
 const bytes=await fs.readFile(file);let text='',pending=false;
 if(file.endsWith('.zstd')){
  let offset=0;
  while(offset<bytes.length){const end=frameEnd(bytes,offset);if(end===null){pending=true;break;}
   text+=(await decompress(bytes.subarray(offset,end),{maxOutputLength:64*1024*1024})).toString('utf8');offset=end;
  }
 }else text=bytes.toString('utf8');
 const lastNewline=text.lastIndexOf('\n');
 pending ||= lastNewline!==text.length-1;
 const records=text.slice(0,lastNewline+1).split('\n').filter(Boolean).map(line=>JSON.parse(line));
 return {...foldRecords(records),pending};
}
async function readDeepSeekUsage(root) {
 const candidates=[];
 async function walk(dir){const entries=await fs.readdir(dir,{withFileTypes:true});let selected=null;
  for(const e of entries){const file=path.join(dir,e.name);if(e.isDirectory())await walk(file);
   else if(e.isFile()){const m=/^session(?:\.v(\d+))?\.jsonl(?:\.zstd)?$/.exec(e.name);if(m){const version=Number(m[1]||0);if(!selected||version>selected.version)selected={file,version};}}
  }if(selected)candidates.push(selected);
 }
 await walk(root);const sessions=new Map(),warnings=[];
 for(const {file,version} of candidates){try{
  if(![3,4].includes(version))throw Error(`不支持的日志版本 v${version}`);
  const stat=await fs.stat(file);let item=cache.get(file);
  if(!item||item.size!==stat.size||item.mtime!==stat.mtimeMs){item={...await readFile(file),size:stat.size,mtime:stat.mtimeMs};cache.set(file,item);}
  const old=sessions.get(item.id);if(!old||item.mtime>old.mtime)sessions.set(item.id,item);
 }catch(error){warnings.push(`${path.basename(path.dirname(file))}: ${error.message}`);}}
 const days={},ledger={};for(const item of sessions.values()){ledger[item.id]={days:item.days};for(const [day,n]of Object.entries(item.days))days[day]=(days[day]||0)+n;}
 return {days,ledger,sessions:sessions.size,warnings,pending:[...sessions.values()].some(s=>s.pending)};
}
module.exports={readDeepSeekUsage,foldRecords,tokenCount,frameEnd};
