import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAll } from '../js/data/validate.js';

test('obsah je bez chyb', () => {
  assert.deepEqual(validateAll(), []);
});
