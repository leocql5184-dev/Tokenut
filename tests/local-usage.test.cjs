const {test}=require('node:test');const assert=require('node:assert/strict');const {delta,dayOf}=require('../src/local-usage.cjs');
test('local cumulative usage counts only increments and ignores repeats',()=>{assert.equal(delta(100,150,50),50);assert.equal(delta(150,150,50),0);assert.equal(delta(null,99999,50),50);assert.equal(delta(99999,30,30),30);});
test('Beijing midnight splits UTC events correctly',()=>{assert.equal(dayOf('2026-10-22T15:59:59Z'),'2026-10-22');assert.equal(dayOf('2026-10-22T16:00:00Z'),'2026-10-23');});
