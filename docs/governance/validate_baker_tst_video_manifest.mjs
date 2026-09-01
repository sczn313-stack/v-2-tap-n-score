import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rows = fs.readFileSync(new URL('./BAKER_TST_DIGITAL_VIDEO_ASSET_MANIFEST.csv', import.meta.url), 'utf8')
  .trim().split('\n').slice(1).map((line) => line.split(','));

assert.equal(rows.length, 22, 'all approved narration steps are represented');
const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function wavDuration(file) {
  const buffer = fs.readFileSync(file);
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', `${file} is RIFF`);
  assert.equal(buffer.toString('ascii', 8, 12), 'WAVE', `${file} is WAVE`);
  let offset = 12;
  let byteRate = 0;
  let dataBytes = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === 'fmt ') byteRate = buffer.readUInt32LE(offset + 16);
    if (id === 'data') dataBytes = size;
    offset += 8 + size + (size % 2);
  }
  assert.ok(byteRate > 0 && dataBytes > 0, `${file} has audio data`);
  return dataBytes / byteRate;
}

for (const row of rows) {
  const file = path.join(docsRoot, 'assets/audio/episode59', row[2]);
  assert.ok(fs.existsSync(file), `${row[2]} exists`);
  assert.ok(Math.abs(wavDuration(file) - Number(row[3])) < 0.000002, `${row[2]} duration matches`);
}
const audioSeconds = rows.reduce((sum, row) => sum + Number(row[3]), 0);
const holdSeconds = rows.reduce((sum, row) => sum + Number(row[4]) / 1000, 0);
const settleSeconds = rows.reduce((sum, row) => sum + Number(row[5]) / 1000, 0);
const actionSeconds = rows.reduce((sum, row) => sum + Number(row[6]) / 1000, 0);
const nominalSeconds = audioSeconds + holdSeconds + settleSeconds + actionSeconds;

assert.ok(Math.abs(audioSeconds - 90.838232) < 0.000001, 'audio duration inventory');
assert.ok(Math.abs(nominalSeconds - 134.168232) < 0.000001, 'nominal logical duration');
console.log(`PASS Baker TST video manifest: 22 assets, ${audioSeconds.toFixed(6)}s audio, ${nominalSeconds.toFixed(6)}s nominal run`);
