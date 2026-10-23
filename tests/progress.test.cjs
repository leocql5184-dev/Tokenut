const {test}=require('node:test');const assert=require('node:assert/strict');
const {thresholds,fills,stageFor,progressFor,dailyTokens,localDay}=require('../src/progress.cjs');
test('seven exact thresholds and nonlinear anchors',()=>{thresholds.forEach((n,i)=>{assert.equal(stageFor(n),i);assert.equal(progressFor(n),fills[i]);if(i)assert.equal(stageFor(n-1),i-1);});});
test('progress stays monotonic and bounded including overshoot',()=>{let last=0;for(let n=0;n<=120000000;n+=10000){const p=progressFor(n);assert(p>=last&&p<=1);last=p;}assert.equal(progressFor(-1),0);assert.equal(progressFor(NaN),0);});
test('server totals replace snapshots; missing is unknown rather than zero',()=>{assert.equal(dailyTokens({dailyUsageBuckets:[{startDate:'2026-10-23',tokens:0}]},'2026-10-23'),0);assert.equal(dailyTokens({dailyUsageBuckets:[]},'2026-10-23'),null);assert.equal(dailyTokens({},'2026-10-23'),null);assert.equal(dailyTokens({dailyUsageBuckets:[{startDate:'2026-10-22',tokens:999}]},'2026-10-23'),null);});
test('day uses local calendar at midnight',()=>{assert.equal(localDay(new Date(2026,9,23,0,0,0)),'2026-10-23');assert.equal(localDay(new Date(2026,9,22,23,59,59)),'2026-10-22');});
