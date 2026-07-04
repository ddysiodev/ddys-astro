import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('astro integration structure check passes', () => {
  const output = execFileSync(process.execPath, ['tools/check.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  const result = JSON.parse(output);
  assert.equal(result.ok, true);
  assert.equal(result.clientMethods, 27);
  assert.ok(result.files >= 70);
});
