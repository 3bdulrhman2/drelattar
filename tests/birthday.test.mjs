// Run: node --experimental-strip-types tests/birthday.test.mjs
import assert from 'node:assert/strict';
import { cairoDateString, isBirthdayToday, isPublicHomePath } from '../src/lib/birthday.ts';

const d = (iso) => new Date(iso);
// Cairo is UTC+2 in November 2026 (no DST).
assert.equal(cairoDateString(d('2026-11-26T08:00:00Z')), '2026-11-26');
assert.equal(isBirthdayToday(d('2026-11-25T21:59:59Z')), false, '23:59:59 Cairo on Nov 25');
assert.equal(isBirthdayToday(d('2026-11-25T22:00:00Z')), true, '00:00 Cairo on Nov 26');
assert.equal(isBirthdayToday(d('2026-11-26T21:59:59Z')), true, '23:59:59 Cairo on Nov 26');
assert.equal(isBirthdayToday(d('2026-11-26T22:00:00Z')), false, '00:00 Cairo on Nov 27');
assert.equal(isBirthdayToday(d('2026-11-27T10:00:00Z')), false);
assert.equal(isBirthdayToday(d('2027-11-26T10:00:00Z')), false, 'disabled after 2026');
assert.equal(isBirthdayToday(d('2026-06-01T10:00:00Z')), false);
assert.equal(isPublicHomePath('/', ''), true);
for (const p of ['/admin', '/secretary', '/card', '/pay', '/booking', '/book']) assert.equal(isPublicHomePath(p, ''), false, p);
assert.equal(isPublicHomePath('/', '#admin'), false);
console.log('birthday date logic: all assertions passed');
