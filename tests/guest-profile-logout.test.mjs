import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function section(start, end) {
  const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
  assert.ok(a>=0 && b>a, `Missing section: ${start}`);
  return html.slice(a,b);
}
test('guest mode never calls Firebase anonymous sign-in', () => {
  const guest=section('async function continueAsGuest()', 'async function signOutAccount()');
  assert.doesNotMatch(guest,/signInAnonymously/);
  assert.match(guest,/showApp\("guest"\)/);
  assert.match(guest,/await auth\.signOut\(\)/);
});
test('top-right email navigates to profile and never initiates sign-out', () => {
  const top=section('function openAccountProfile()', 'function handleProfileAuthAction()');
  assert.match(top,/setActiveView\("profile"\)/);
  assert.doesNotMatch(top,/signOut/);
  assert.match(html,/\$\("accountBtn"\)\.addEventListener\("click", openAccountProfile\)/);
});
test('profile and admin both offer an explicit sign out', () => {
  assert.match(html,/id="adminSignOutBtn"/);
  assert.match(html,/\$\("adminSignOutBtn"\)\.addEventListener\("click", signOutAccount\)/);
  assert.match(html,/\$\("profileAuthBtn"\)\.addEventListener\("click", handleProfileAuthAction\)/);
});
test('sign-out invalidates admin mode and Firebase authentication', () => {
  const logout=section('async function signOutAccount()', 'function openAccountProfile()');
  assert.match(logout,/await auth\.signOut\(\)/);
  assert.match(logout,/isAdminMode = false/);
  assert.match(logout,/showAuth\(false\)/);
});
