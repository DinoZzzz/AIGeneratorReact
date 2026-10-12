import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDateTime, isAuthorizedRunRequest } from '../src/runtimeHelpers.js';

describe('manual dispatch authorization', () => {
  it('denies HTTP dispatch when no token is configured', () => {
    assert.equal(isAuthorizedRunRequest({ headers: {} }, ''), false);
    assert.equal(isAuthorizedRunRequest({ headers: { 'x-run-token': 'anything' } }, ''), false);
  });

  it('requires the exact configured token', () => {
    assert.equal(isAuthorizedRunRequest({ headers: {} }, 'secret'), false);
    assert.equal(isAuthorizedRunRequest({ headers: { 'x-run-token': ['secret'] } }, 'secret'), false);
    assert.equal(isAuthorizedRunRequest({ headers: { 'x-run-token': 'bad' } }, 'secret'), false);
    assert.equal(isAuthorizedRunRequest({ headers: { 'x-run-token': 'secreT' } }, 'secret'), false);
    assert.equal(isAuthorizedRunRequest({ headers: { 'x-run-token': 'secret' } }, 'secret'), true);
  });
});

describe('Croatian reminder time', () => {
  it('uses Zagreb standard and summer time regardless of server timezone', () => {
    assert.match(formatDateTime('2026-01-12T12:30:00Z'), /13:30/);
    assert.match(formatDateTime('2026-07-12T12:30:00Z'), /14:30/);
  });
});
