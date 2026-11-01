import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAdminUids } from '../backend/admin-auth.js';

test('single Firebase UID matches only itself', () => {
  const admins = parseAdminUids('  abcDEF0123 \n');
  assert.equal(admins.size, 1);
  assert(admins.has('abcDEF0123'));
  assert(!admins.has('other'));
});
test('supports multiple UIDs delimited by commas or newlines', () => {
  assert.deepEqual([...parseAdminUids('uidOne,uidTwo\nuidThree')], ['uidOne','uidTwo','uidThree']);
});
test('supports JSON string array, quotes, invisible characters', () => {
  assert.deepEqual([...parseAdminUids('["u1", "u2"]')], ['u1','u2']);
  assert(parseAdminUids(' "real\u200BUID" ').has('realUID'));
});
test('empty values and emails never grant admin access', () => {
  assert.equal(parseAdminUids('').size, 0);
  assert.equal(parseAdminUids(undefined).size, 0);
  assert.equal(parseAdminUids('person@example.com').size, 0);
});
test('no broadened authorization: case sensitive and exact', () => {
  const admins = parseAdminUids('UidABC');
  assert(admins.has('UidABC'));
  assert(!admins.has('uidabc'));
  assert(!admins.has('UidABCextra'));
});
