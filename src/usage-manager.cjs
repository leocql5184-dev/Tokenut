const path=require('node:path');
const os=require('node:os');
const {readLocalUsage}=require('./local-usage.cjs');
const {readDeepSeekUsage}=require('./deepseek-usage.cjs');
const {reconcile}=require('./history.cjs');
const {harnessDays}=require('./usage-sources.cjs');

// Each integration owns its discovery and accounting; UI uses stable source IDs.
const registry=[
 {id:'codex',name:'Codex',defaultRoot:()=>path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'sessions'),read:readLocalUsage},
 {id:'deepseek',name:'DeepSeek Harness',defaultRoot:()=>path.join(process.env.DSH_HOME||path.join(os.homedir(),'.dsh'),'sessions'),read:readDeepSeekUsage}
];
function initializeSources(saved) {
 if(saved.usageSources)return;
 saved.usageSources={};
 for(const source of registry){const root=source.id==='codex'&&saved.sourceRoot?saved.sourceRoot:source.defaultRoot();
  const histories={};
  if(source.id==='codex'){
   for(const [oldRoot,days]of Object.entries(saved.sourceHistories||{}))histories[oldRoot]={days};
   if(saved.days)histories[root]={days:saved.days};
  }
  saved.usageSources[source.id]={enabled:source.id==='codex'&&!!(saved.onboarded||saved.sourceRoot||Object.keys(saved.days||{}).length),root,histories};
 }
}
function sourceViews(saved,states={}) {
 initializeSources(saved);
 return registry.map(source=>({id:source.id,name:source.name,enabled:!!saved.usageSources[source.id]?.enabled,path:saved.usageSources[source.id]?.root||source.defaultRoot(),state:'waiting',message:'等待读取记录',...states[source.id]}));
}
function configureSource(saved,id,change) {
 initializeSources(saved);if(!registry.some(s=>s.id===id))throw Error('未知用量来源');
 const source=saved.usageSources[id];
 if(typeof change.enabled==='boolean')source.enabled=change.enabled;
 if(typeof change.root==='string')source.root=path.resolve(change.root);
}
async function syncSources(saved,today,readers={}) {
 initializeSources(saved);const states={};
 await Promise.all(registry.map(async source=>{
  const config=saved.usageSources[source.id];
  if(!config.enabled){states[source.id]={state:'disabled',message:'未启用，不计入总数'};return;}
  const root=config.root;config.histories||={};const history=config.histories[root]||={days:{}};
  try{
   const result=await (readers[source.id]||source.read)(root);
   if(source.id==='deepseek'){
    history.ledger={...history.ledger,...result.ledger};
    const days=harnessDays(history.ledger);
    if(result.sessions)days[today]??=0;
    history.days=Object.fromEntries(Object.entries(days).map(([date,tokens])=>[date,{tokens,source:'local',updatedAt:Date.now(),closed:date<today}]));
   }else if(result.sessions)history.days=reconcile(history.days,result.days,today);
   const warnings=result.warnings||[];
   states[source.id]={state:warnings.length?'partial':result.sessions?'connected':'waiting',message:warnings.length?`${warnings.length} 个会话暂时无法读取，已保留上次记录`:result.sessions?`已连接 · ${result.sessions} 个会话${result.pending?' · 等待末尾记录写入':''}`:'目录已连接，暂未发现会话；使用该工具后会自动更新',detail:warnings.join('\n')};
  }catch(error){states[source.id]={state:error.code==='ENOENT'?'missing':'error',message:error.code==='ENOENT'?'尚未找到记录目录；先使用该工具，或选择记录文件夹':'读取失败，暂时保留该来源已保存记录',detail:error.message};}
 }));
 const combined={};
 for(const source of registry){const config=saved.usageSources[source.id];if(!config.enabled)continue;
  for(const [date,record]of Object.entries(config.histories?.[config.root]?.days||{})){
   if(record.source!=='local')continue;
   const entry=combined[date]||={tokens:0,bySource:{},source:'local',updatedAt:Date.now(),closed:date<today};
   entry.tokens+=record.tokens;entry.bySource[source.id]=record.tokens;
  }
 }
 saved.days=combined;
 return {sources:sourceViews(saved,states),days:combined};
}
module.exports={registry,initializeSources,sourceViews,configureSource,syncSources};
