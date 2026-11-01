import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freeWindow, weekendWindow, dailyStreakNext, utcDate, FREE_CLAIM_LIMIT, FREE_REWARD, DAILY_REWARDS, EVENT_REWARD} from '../backend/reward-policy.js';

test('3-hour free claims reset precisely at UTC window boundary',()=>{
 const a=freeWindow('2026-11-01T02:59:59.999Z');
 const b=freeWindow('2026-11-01T03:00:00.000Z');
 assert.equal(a.id+1,b.id);assert.equal(a.end.toISOString(),'2026-11-01T03:00:00.000Z');
 assert.equal(b.start.toISOString(),'2026-11-01T03:00:00.000Z');
 assert.equal(b.end.toISOString(),'2026-11-01T06:00:00.000Z');
});
test('reward values match agreed free and daily amounts',()=>{
 assert.equal(FREE_CLAIM_LIMIT,5);assert.equal(FREE_REWARD,2500);
 assert.deepEqual(DAILY_REWARDS,[500,1000,1500,2000,3000,4000,10000]);
 assert.equal(EVENT_REWARD,5000);
});
test('weekend event has stable Saturday UTC key through Sunday',()=>{
 const sat=weekendWindow('2026-10-31T00:00:00Z');
 const sun=weekendWindow('2026-11-01T23:59:59Z');
 assert.equal(sat.active,true);assert.equal(sun.active,true);
 assert.equal(sat.key,sun.key);assert.equal(sun.key,'2026-10-31');
 assert.equal(sun.end.toISOString(),'2026-11-02T00:00:00.000Z');
 assert.equal(weekendWindow('2026-11-02T00:00:00Z').active,false);
});
test('streak advances after consecutive UTC day and resets after missed day',()=>{
 assert.equal(dailyStreakNext(null,0,'2026-11-01T10:00:00Z'),1);
 assert.equal(dailyStreakNext('2026-10-31',6,'2026-11-01T10:00:00Z'),7);
 assert.equal(dailyStreakNext('2026-10-30',6,'2026-11-01T10:00:00Z'),1);
 assert.equal(dailyStreakNext('2026-11-01',6,'2026-11-01T10:00:00Z'),6);
 assert.equal(utcDate('2026-11-01T00:03:00Z'),'2026-11-01');
});
test('server declares transaction-locked claim and one-time reward ledger',()=>{
 const code=readFileSync(new URL('../backend/server.js',import.meta.url),'utf8');
 for(const fragment of ['CREATE TABLE IF NOT EXISTS reward_claims','PRIMARY KEY (uid, reward_key)','SELECT * FROM players WHERE uid = $1 FOR UPDATE','app.post("/api/player/rewards/claim"','await client.query(\'COMMIT\')','level_first_completions'])assert.ok(code.includes(fragment),fragment);
});
test('AI completion requires server-recorded paid active session',()=>{
 const code=readFileSync(new URL('../backend/server.js',import.meta.url),'utf8');
 for(const fragment of ['ai_pending_level','ai_pending_until','ai_pending_level=NULL','finishLevelForPlayer(req.user.uid, req.body || {}, true)'])assert.ok(code.includes(fragment),fragment);
});
test('frontend integrates auth-backed claims rather than directly minting cloud coins',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const bonus=readFileSync(new URL('../bonus-features.js',import.meta.url),'utf8');
 assert.ok(html.includes('"/api/player/rewards/claim"'));
 assert.ok(bonus.includes('api.claimCloudReward(kind)'));
 assert.ok(bonus.includes('needsLogin()'));
 assert.ok(html.includes('Sync coins & progress from cloud'));
});
