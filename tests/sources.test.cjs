const {test}=require('node:test');const assert=require('node:assert/strict');
const {initializeSources,configureSource,syncSources}=require('../src/usage-manager.cjs');
const day='2026-10-23';
const codex=async()=>({days:{[day]:100},sessions:1});
const deepseek=async()=>({days:{[day]:40},sessions:1,ledger:{a:{days:{[day]:40}}},warnings:[]});
test('new users opt in, each source works alone or together, disabling retains source history',async()=>{
 const saved={};initializeSources(saved);let r=await syncSources(saved,day,{codex,deepseek});assert.deepEqual(r.days,{});
 configureSource(saved,'deepseek',{enabled:true});r=await syncSources(saved,day,{codex,deepseek});assert.equal(r.days[day].tokens,40);
 configureSource(saved,'codex',{enabled:true});r=await syncSources(saved,day,{codex,deepseek});assert.equal(r.days[day].tokens,140);
 configureSource(saved,'deepseek',{enabled:false});r=await syncSources(saved,day,{codex,deepseek});assert.equal(r.days[day].tokens,100);
 configureSource(saved,'deepseek',{enabled:true});r=await syncSources(saved,day,{codex,deepseek:async()=>{throw Error('offline');}});assert.equal(r.days[day].tokens,140);assert.equal(r.sources[1].state,'error');
});
test('legacy Codex history migrates once without adding it twice',async()=>{
 const saved={onboarded:true,days:{[day]:{source:'local',tokens:100}}};initializeSources(saved);
 configureSource(saved,'deepseek',{enabled:true});await syncSources(saved,day,{codex,deepseek});
 initializeSources(saved);const r=await syncSources(saved,day,{codex,deepseek});assert.equal(r.days[day].tokens,140);
});
test('Harness corrections replace its ledger and missing sessions remain archived; roots remain isolated',async()=>{
 const saved={};configureSource(saved,'deepseek',{enabled:true});await syncSources(saved,day,{deepseek});
 let r=await syncSources(saved,day,{deepseek:async()=>({sessions:1,ledger:{a:{days:{[day]:20}}},warnings:[]})});assert.equal(r.days[day].tokens,20);
 r=await syncSources(saved,day,{deepseek:async()=>({sessions:0,ledger:{},warnings:[]})});assert.equal(r.days[day].tokens,20);
 const old=saved.usageSources.deepseek.root;configureSource(saved,'deepseek',{root:'different-records'});
 r=await syncSources(saved,day,{deepseek:async()=>({sessions:0,ledger:{},warnings:[]})});assert.deepEqual(r.days,{});
 configureSource(saved,'deepseek',{root:old});r=await syncSources(saved,day,{deepseek:async()=>({sessions:0,ledger:{},warnings:[]})});assert.equal(r.days[day].tokens,20);
});
