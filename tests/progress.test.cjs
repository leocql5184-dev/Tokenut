const {test}=require('node:test');const assert=require('node:assert/strict');
const {thresholds,stageFor,progressFor,dailyTokens,localDay}=require('../src/progress.cjs');
test('seven exact stage thresholds',()=>{thresholds.forEach((n,i)=>{assert.equal(stageFor(n),i);if(i)assert.equal(stageFor(n-1),i-1);});});
test('progress represents the exact fraction of the daily goal',()=>{for(const [tokens,expected] of [[0,0],[1000000,.01],[10000000,.1],[25000000,.25],[50000000,.5],[75000000,.75],[90000000,.9],[100000000,1],[120000000,1]])assert.equal(progressFor(tokens),expected);});
test('progress stays monotonic and bounded including overshoot',()=>{let last=0;for(let n=0;n<=120000000;n+=10000){const p=progressFor(n);assert(p>=last&&p<=1);last=p;}assert.equal(progressFor(-1),0);assert.equal(progressFor(NaN),0);});
test('server totals replace snapshots; missing is unknown rather than zero',()=>{assert.equal(dailyTokens({dailyUsageBuckets:[{startDate:'2026-10-23',tokens:0}]},'2026-10-23'),0);assert.equal(dailyTokens({dailyUsageBuckets:[]},'2026-10-23'),null);assert.equal(dailyTokens({},'2026-10-23'),null);assert.equal(dailyTokens({dailyUsageBuckets:[{startDate:'2026-10-22',tokens:999}]},'2026-10-23'),null);});
test('day uses local calendar at midnight',()=>{assert.equal(localDay(new Date(2026,9,23,0,0,0)),'2026-10-23');assert.equal(localDay(new Date(2026,9,22,23,59,59)),'2026-10-22');});
