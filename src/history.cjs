function reconcile(records, incoming, today, now=Date.now()) {
 const out={...records};
 for(const [date,tokens] of Object.entries(incoming)) {
  const old=out[date];
  // A missing/deleted log must not lower an already archived daily total.
  out[date]={tokens:Math.max(old?.source==='local'?old.tokens:0,tokens),source:'local',updatedAt:now,closed:date<today};
 }
 for(const [date,entry] of Object.entries(out)) if(entry.source==='local'&&date<today) out[date]={...entry,closed:true};
 out[today] ||= {tokens:0,source:'local',updatedAt:now,closed:false};
 return out;
}
module.exports={reconcile};
