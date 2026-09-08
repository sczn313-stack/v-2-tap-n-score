import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile("target_execution_runtime.js", "utf8");
const window = {
  crypto: {
    getRandomValues(bytes) {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = (index * 29 + 17) & 0xff;
      return bytes;
    },
  },
};
const document = { readyState: "loading", addEventListener() {} };
vm.runInNewContext(source, { window, document, Uint8Array, Uint32Array, ArrayBuffer, DataView, Math, Date, Object, String, Number, Array, RegExp, URLSearchParams });

const runtime = window.SCZN3TargetExecutionRuntime;
assert.ok(runtime, "shared target execution runtime exported");
const id = runtime.runtimeId();
assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

for (const bytes of [Buffer.alloc(0), Buffer.from("abc"), Buffer.from(Array.from({ length: 4097 }, (_, index) => index & 0xff))]) {
  const expected = createHash("sha256").update(bytes).digest("hex");
  const actual = await runtime.sha256Hex(new Uint8Array(bytes));
  assert.equal(actual, expected, `LAN-safe SHA-256 mismatch for ${bytes.length} bytes`);
}

assert.match(source, /privateLan[\s\S]*authorityOrigin = local \? "http:\/\/127\.0\.0\.1:8098" : \(privateLan \? ""/);
assert.equal((source.match(/\.randomUUID\(\)/g) || []).length, 1, "only the guarded runtimeId native path may call randomUUID");
assert.match(source, /await sha256Hex\(bytes\)/);

const reviewServer = await readFile("production/m16a2_tstt_review_server.mjs", "utf8");
assert.match(reviewServer, /\["\/target-experience\.html", "target-experience\.html"\]/);
assert.match(reviewServer, /\["\/target-experience\.css", "target-experience\.css"\]/);
assert.match(reviewServer, /pathname\.startsWith\("\/api\/"\)[\s\S]*proxyAuthority/);

const vault = await readFile("records.html", "utf8");
assert.match(vault, /PREPARED_DEMO_MODE \|\| RECORDS_PRIVATE_LAN \? window\.location\.origin/);

console.log("PASS LAN target runtime: UUID and SHA-256 fallbacks work without secure-context APIs; private-LAN authority is same-origin; curated review host serves the shared road");
