const GOAL = 100000000;
const thresholds = [0, 1000000, 10000000, 30000000, 60000000, 90000000, GOAL];
function stageFor(value) { const n = Math.max(0, Number(value) || 0); let i = 0; while (i < 6 && n >= thresholds[i+1]) i++; return i; }
function progressFor(value) {
  const n = Math.max(0, Math.min(GOAL, Number(value) || 0));
  return n / GOAL;
}
function localDay(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function dailyTokens(result, day) {
  if (!Array.isArray(result?.dailyUsageBuckets)) return null;
  const bucket = result.dailyUsageBuckets.find(b => b.startDate === day);
  return bucket && Number.isFinite(bucket.tokens) && bucket.tokens >= 0 ? bucket.tokens : null;
}
module.exports = {GOAL, thresholds, stageFor, progressFor, localDay, dailyTokens};
