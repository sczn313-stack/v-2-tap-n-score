import fs from 'node:fs';
import assert from 'node:assert/strict';

const rows = fs.readFileSync(new URL('./BAKER_COMPARABLE_MARKET_STUDY.csv', import.meta.url), 'utf8')
  .trim().split('\n').slice(1).map((line) => line.split(','));

assert.equal(rows.length, 12, 'complete P-OS printer set');

for (const row of rows) {
  const pack = Number(row[2]);
  const quantity = Number(row[3]);
  const current = Number(row[4]);
  const proposed = Number(row[5]);
  const increase = Number(row[6].replace('%', ''));
  const sczn3 = Number(row[7].replace('%', ''));
  const printer = Number(row[8].replace('%', ''));
  assert.ok(Math.abs(pack / quantity - current) < 0.00006, `${row[0]} per-target normalization`);
  assert.ok(Math.abs(current + 0.5 - proposed) < 0.00006, `${row[0]} proposed retail`);
  assert.ok(Math.abs(50 / current - increase) < 0.03, `${row[0]} increase percent`);
  assert.ok(Math.abs(25 / current - sczn3) < 0.03, `${row[0]} SCZN3 share percent`);
  assert.equal(sczn3, printer, `${row[0]} equal split`);
}

console.log('PASS Baker-comparable market study: 12 printers, normalization and fee formulas');
