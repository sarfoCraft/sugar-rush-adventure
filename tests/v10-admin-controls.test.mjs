import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const server=readFileSync(new URL('../backend/server.js', import.meta.url),'utf8');
const ui=readFileSync(new URL('../admin-tools.js', import.meta.url),'utf8');
const game=readFileSync(new URL('../index.html', import.meta.url),'utf8');

test('safe bulk endpoint requires admin and performs one transactional update',()=>{
 assert.match(server,/app\.post\("\/api\/admin\/levels\/bulk-update", requireAdmin/);
 const code=server.slice(server.indexOf('// Update selected (or all) active levels atomically.'),server.indexOf('app.post("/api/admin/levels/:id/clone"'));
 for (const v of ['BEGIN','COMMIT','ROLLBACK','UPDATE game_levels','difficulty_override','time_limit','jelly_goal','active=TRUE','RETURNING id']) assert.ok(code.includes(v),v);
 assert.match(code,/count > 2000/);
 assert.match(code,/scope === "all"/);
});

test('single-level editing accepts difficulty overrides and auto reset',()=>{
 const code=server.slice(server.indexOf('const DIFFICULTY_OVERRIDES'),server.indexOf('app.get("/api/admin/levels"'));
 const exports=runInNewContext(`${code};globalThis.read=readDifficultyOverride;globalThis.allowed=DIFFICULTY_OVERRIDES;`);
 // vm evaluated in a sandbox; retrieve exports via a context object instead
 const scope={};runInNewContext(`${code};globalThis.read=readDifficultyOverride;`,scope);
 assert.equal(scope.read({difficulty:'Hard'}),'Hard');
 assert.equal(scope.read({difficulty:'auto'}),null);
 assert.equal(scope.read({},'Expert'),'Expert');
 assert.throws(()=>scope.read({difficulty:'admin'}),/Invalid difficulty/);
});

test('approved payments are archived, not deleted or re-credited',()=>{
 const code=server.slice(server.indexOf('app.post("/api/admin/coin-orders/archive-approved"'),server.indexOf('app.post("/api/admin/coin-orders/:id/:action"'));
 assert.match(code,/requireAdmin/);
 assert.match(code,/UPDATE coin_orders SET admin_archived_at=NOW\(\) WHERE status='approved'/);
 assert.doesNotMatch(code,/DELETE FROM|UPDATE players SET coins/);
 assert.match(server,/SELECT \* FROM coin_orders WHERE admin_archived_at IS NULL/);
 assert.match(server,/\/api\/coin-orders\/mine/);
});

test('admin player data includes account kind and completion stats, not bulk IP',()=>{
 const code=server.slice(server.indexOf('app.get("/api/admin/players"'),server.indexOf('app.get("/api/admin/players/:uid/ip"'));
 for(const part of ['accountType:','completedCount:','bestScore:','totalStars:','progressPercent:']) assert.ok(code.includes(part),part);
 assert.match(code,/playerIpMetadata\(row, ADMIN_UIDS\)/);
 assert.doesNotMatch(code,/lastIp: row\.last_ip/);
});

test('responsive dashboard allows checkbox selection and bulk difficulty and mission edits',()=>{
 for(const text of ['smaChangeAll','smaApplyBulk','data-select-level','smaBulkDifficulty','smaBulkMission','sma-level-check','applyBulkUpdate']) assert.ok(ui.includes(text),text);
 assert.match(ui,/@media\(max-width:650px\)/);
 assert.match(ui, /tbody td:before\{content:attr\(data-label\)/);
 assert.match(ui,/\/api\/admin\/levels\/bulk-update/);
});

test('guest and registered player names, profile progress and payment clear UI',()=>{
 for(const id of ['homeIdentityBadge','profileIdentityBadge','profileProgressPercent','homeCompletedProgress','clearApprovedPaymentsBtn']) assert.ok(game.includes(`id="${id}"`),id);
 assert.match(game,/Object\.values\(save\.completedLevels\|\|\{\}\)\.filter\(Boolean\)/);
 assert.match(game,/backendRequest\("\/api\/admin\/coin-orders\/archive-approved"/);
 assert.match(game,/admin-tools\.js\?v=10/);
});
