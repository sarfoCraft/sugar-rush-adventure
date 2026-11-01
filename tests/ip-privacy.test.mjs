import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ipForStorage, playerIpMetadata, revealedPlayerIp } from '../backend/ip-privacy.js';

const backend = readFileSync(new URL('../backend/server.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../admin-tools.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const admins = new Set(['admin-uid', 'second-admin']);

test('never saves an administrator IP, and ordinary user IPs retain tracking', () => {
  assert.equal(ipForStorage('admin-uid', '192.0.2.21', admins), null);
  assert.equal(ipForStorage('second-admin', '2001:db8::1', admins), null);
  assert.equal(ipForStorage('player-uid', '192.0.2.22', admins), '192.0.2.22');
});

test('admin IP cannot be revealed even if older database row still has an IP', () => {
  const row = { uid: 'admin-uid', last_ip: '192.0.2.21' };
  assert.deepEqual(revealedPlayerIp(row, admins), { isAdmin: true, ip: null });
  assert.deepEqual(playerIpMetadata(row, admins), { isAdmin: true, ipAvailable: false });
});

test('regular players default to presence only, then may reveal exact IP', () => {
  const row = { uid: 'player-uid', last_ip: '2001:db8::42' };
  assert.deepEqual(playerIpMetadata(row, admins), { isAdmin: false, ipAvailable: true });
  assert.deepEqual(revealedPlayerIp(row, admins), { isAdmin: false, ip: '2001:db8::42' });
  assert.deepEqual(playerIpMetadata({ uid: 'player2', last_ip: null }, admins), { isAdmin: false, ipAvailable: false });
  assert.deepEqual(revealedPlayerIp({ uid: 'player2', last_ip: null }, admins), { isAdmin: false, ip: null });
});

test('bulk player API does not return lastIp and reveal route is admin-only', () => {
  const bulk = backend.slice(backend.indexOf('app.get("/api/admin/players",'), backend.indexOf('app.get("/api/admin/players/:uid/ip",'));
  const reveal = backend.slice(backend.indexOf('app.get("/api/admin/players/:uid/ip",'), backend.indexOf('app.post("/api/admin/players/:uid/ban",'));
  assert.ok(bulk.includes('...playerIpMetadata(row, ADMIN_UIDS)'));
  assert.ok(!bulk.includes('lastIp:'));
  assert.ok(bulk.includes('uid <> ALL($3::text[])'), 'IP search must not leak admin IP matches');
  assert.match(reveal, /requireAdmin/);
  assert.match(reveal, /revealedPlayerIp\(result\.rows\[0\], ADMIN_UIDS\)/);
  assert.match(reveal, /no-store/);
  assert.match(backend, /UPDATE players SET last_ip = NULL WHERE uid = ANY\(\$1::text\[\]\)/);
});

test('eye toggle is per user and defaults hidden; admin always hidden', () => {
  const cell = ui.slice(ui.indexOf('function playerIpCell('), ui.indexOf('async function loadPlayers()'));
  assert.match(cell, /Hidden \(Admin\)/);
  assert.match(cell, /data-player-ip-uid/);
  assert.match(cell, /aria-pressed=\\"false\\"|aria-pressed="false"/);
  assert.match(cell, /\/api\/admin\/players\/\$\{encodeURIComponent\(button\.dataset\.playerIpUid\)\}\/ip/);
  assert.match(cell, /value\.textContent = "••••••••"/);
  assert.match(cell, /value\.textContent = typeof data\.ip/);
  assert.ok(!ui.includes('escapeHtml(p.lastIp'));
  assert.match(html, /admin-tools\.js\?v=\d+/);
});

test('real eye toggle requests one player IP and hides it again without another request', async () => {
  const vm = await import('node:vm');
  const slice = ui.slice(ui.indexOf('const eyeOpen ='), ui.indexOf('async function loadPlayers()'));
  const fetched = [];
  const value = { textContent: '••••••••' };
  const cell = { querySelector: () => value };
  const attrs = { 'aria-pressed': 'false' };
  const button = {
    dataset: { playerIpUid: 'abc123' },
    disabled: false,
    isConnected: true,
    innerHTML: '',
    closest: () => cell,
    getAttribute: name => attrs[name],
    setAttribute: (name, val) => { attrs[name] = val; }
  };
  const ctx = {
    escapeHtml: x => String(x),
    api: async url => { fetched.push(url); return { isAdmin: false, ip: '192.0.2.44' }; },
    setStatus: () => { throw new Error('Should not show an error'); }
  };
  vm.createContext(ctx);
  vm.runInContext(slice, ctx);
  const htmlCell = vm.runInContext('playerIpCell({ uid: "abc123", isAdmin: false, ipAvailable: true })', ctx);
  assert.ok(!htmlCell.includes('192.0.2.44'), 'no IP in initial HTML');
  assert.match(htmlCell, /Show/);
  await ctx.handlePlayerIpToggle(button);
  assert.equal(value.textContent, '192.0.2.44');
  assert.equal(attrs['aria-pressed'], 'true');
  assert.deepEqual(fetched, ['/api/admin/players/abc123/ip']);
  await ctx.handlePlayerIpToggle(button);
  assert.equal(value.textContent, '••••••••');
  assert.equal(attrs['aria-pressed'], 'false');
  assert.deepEqual(fetched, ['/api/admin/players/abc123/ip']);
  const adminCell = vm.runInContext('playerIpCell({ uid: "admin", isAdmin: true, ipAvailable: true })', ctx);
  assert.match(adminCell, /Hidden \(Admin\)/);
  assert.doesNotMatch(adminCell, /data-player-ip-uid/);
});
