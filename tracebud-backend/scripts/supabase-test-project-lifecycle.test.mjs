#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIVE_STATUSES,
  INACTIVE_STATUSES,
  isActiveStatus,
  isInactiveStatus,
} from './supabase-test-project-lifecycle.mjs';

test('active statuses include healthy and unhealthy active states', () => {
  assert.equal(isActiveStatus('ACTIVE_HEALTHY'), true);
  assert.equal(isActiveStatus('ACTIVE_UNHEALTHY'), true);
  assert.equal(isActiveStatus('INACTIVE'), false);
});

test('inactive statuses include paused projects only', () => {
  assert.equal(isInactiveStatus('INACTIVE'), true);
  assert.equal(isInactiveStatus('ACTIVE_HEALTHY'), false);
  assert.deepEqual([...INACTIVE_STATUSES], ['INACTIVE']);
  assert.ok(ACTIVE_STATUSES.has('ACTIVE_HEALTHY'));
});
