import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('function showAdminDiagnostic(');
const end = html.indexOf('async function syncPaymentRequestViews()', start);
assert(start !== -1 && end > start, 'Admin access code exists');
const source = html.slice(start, end);

async function check(statusResponse, adminOrders = { orders: [] }) {
  const statusEl = { textContent: '', hidden: true };
  let message = '', view = '', payments = 0, requests = [];
  const ctx = {
    $: () => statusEl,
    backendConfigured: () => true,
    firebaseConfigured: () => true,
    currentUser: { uid:'verified-uid', isAnonymous:false },
    backendRequest: async (path) => {
      requests.push(path);
      if (path === '/api/auth/status') return statusResponse;
      if (path === '/api/admin/coin-orders') return adminOrders;
      throw new Error('Unexpected route');
    },
    setStatus: text => { message = text; },
    setActiveView: text => { view = text; },
    renderAdminPayments: async () => { payments++; },
    isAdminMode: false
  };
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  await vm.runInContext('openAdminAccess()', ctx);
  return { statusEl, message, view, payments, requests, isAdminMode: ctx.isAdminMode };
}

test('admin with verified server permission sees dashboard', async () => {
  const out = await check({ version:'cloud-rewards-v7', isAdmin:true, configuredAdminCount:1 });
  assert.equal(out.view,'admin');
  assert.equal(out.isAdminMode,true);
  assert.equal(out.payments,1);
  assert.deepEqual(out.requests,['/api/auth/status','/api/admin/coin-orders']);
});

test('admin list empty gives useful persistent message and never calls protected route', async () => {
  const out = await check({ version:'cloud-rewards-v7', isAdmin:false, configuredAdminCount:0 });
  assert.match(out.statusEl.textContent,/ZERO admin UIDs/);
  assert.equal(out.statusEl.hidden,false);
  assert.equal(out.isAdminMode,false);
  assert.deepEqual(out.requests,['/api/auth/status']);
});

test('UID mismatch reports live allowlist count without exposing other UIDs', async () => {
  const out = await check({ version:'cloud-rewards-v7', isAdmin:false, configuredAdminCount:2, uidSuffix:'ABCDEF' });
  assert.match(out.message,/2 admin UID\(s\)/);
  assert.match(out.statusEl.textContent,/ABCDEF/);
  assert.equal(out.view,'');
  assert.deepEqual(out.requests,['/api/auth/status']);
});

test('outdated server is detected and blocked', async () => {
  const out = await check({ isAdmin:true, configuredAdminCount:1 });
  assert.match(out.statusEl.textContent,/Old API version/);
  assert.equal(out.isAdminMode,false);
  assert.deepEqual(out.requests,['/api/auth/status']);
});
