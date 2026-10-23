const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const z=require('node:zlib');
const {readDeepSeekUsage,foldRecords,tokenCount}=require('../src/deepseek-usage.cjs');
const header=(id='a',extra={})=>({type:'session',version:4,id,isSeeded:false,...extra});
const usage=n=>({inputTokens:n,outputTokens:10,cacheReadTokens:20,cacheWriteTokens:3,reasoningTokens:5});
const event=(seq,type,data,time='2026-10-23T01:00:00Z')=>({seq,type,data,time:Date.parse(time)});
const message=(seq,n,step=1,time)=>event(seq,'assistant/message',{turn:1,step,usage:usage(n)},time);
const encode=rows=>z.zstdCompressSync(rows.map(r=>JSON.stringify(r)+'\n').join(''),{params:{[z.constants.ZSTD_c_checksumFlag]:1}});
test('Harness sums disjoint cache counters, uses exact total and never adds reasoning twice',()=>{
 assert.equal(tokenCount(usage(100)),133);assert.equal(tokenCount({...usage(100),totalTokens:140}),140);
 assert.equal(tokenCount({inputTokens:-1,outputTokens:3}),null);
});
test('final usage replaces the same attempt, retries add, midnight separates days',()=>{
 const r=foldRecords([header(),message(0,100),message(1,90),event(2,'llm/retry-started',{turn:1,step:1}),message(3,50),message(4,10,2,'2026-10-23T16:00:00Z')]);
 assert.deepEqual(r.days,{'2026-10-23':206,'2026-10-24':43});
});
test('embedded stream last usage and final authority do not double count; forks omit inherited prefix',()=>{
 const stream=[{type:'chunk',chunk:{type:'usage',usage:usage(200)}},{type:'chunk',chunk:{type:'usage',usage:usage(20)}}];
 const r=foldRecords([header('fork',{isSeeded:true}),message(0,900),event(1,'session/end-seed',{inherited:true}),event(2,'assistant/attempt',{turn:2,step:1,stream}),event(3,'assistant/message',{turn:2,step:1,stream,usage:usage(10)})]);
 assert.deepEqual(r.days,{'2026-10-23':43});
 assert.throws(()=>foldRecords([header('fork',{isSeeded:true}),message(0,900)]),/继承/);
});
test('concatenated frames, generations, truncated append, duplicate sessions, and corruption',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'tokenut-dsh-'));
 try{
  const dir=path.join(root,'project','a');await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'session.v3.jsonl.zstd'),encode([header('a',{version:3}),message(0,999)]));
  const file=path.join(dir,'session.v4.jsonl.zstd');const base=Buffer.concat([encode([header()]),encode([message(0,100)])]);
  const tail=encode([message(1,10,2)]);await fs.writeFile(file,Buffer.concat([base,tail.subarray(0,tail.length-3)]));
  let r=await readDeepSeekUsage(root);assert.equal(r.days['2026-10-23'],133);assert.equal(r.pending,true);
  await fs.writeFile(file,Buffer.concat([base,tail]));r=await readDeepSeekUsage(root);assert.equal(r.days['2026-10-23'],176);
  const copy=path.join(root,'copy');await fs.mkdir(copy);await fs.copyFile(file,path.join(copy,'session.v4.jsonl.zstd'));
  r=await readDeepSeekUsage(root);assert.equal(r.sessions,1);assert.equal(r.days['2026-10-23'],176);
  const bad=path.join(root,'bad');await fs.mkdir(bad);await fs.writeFile(path.join(bad,'session.v4.jsonl.zstd'),Buffer.from('not zstd'));
  r=await readDeepSeekUsage(root);assert.equal(r.days['2026-10-23'],176);assert.equal(r.warnings.length,1);
  await fs.writeFile(path.join(dir,'session.v5.jsonl.zstd'),encode([header('a',{version:5})]));
  r=await readDeepSeekUsage(root);assert.equal(r.warnings.length,2);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('raw JSONL ignores unfinished last line and rejects missing event sequences',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'tokenut-dsh-raw-'));
 try{await fs.writeFile(path.join(root,'session.v3.jsonl'),[header('raw',{version:3}),message(0,5)].map(JSON.stringify).join('\n')+'\n{"partial":');const r=await readDeepSeekUsage(root);assert.equal(r.days['2026-10-23'],38);assert.equal(r.pending,true);assert.throws(()=>foldRecords([header(),message(2,5)]),/序号/);}finally{await fs.rm(root,{recursive:true,force:true});}
});
