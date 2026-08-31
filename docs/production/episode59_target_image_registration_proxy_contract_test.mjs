import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [toml, redirects] = await Promise.all([
  readFile(new URL("../netlify.toml", import.meta.url), "utf8"),
  readFile(new URL("../_redirects", import.meta.url), "utf8")
]);
const route = "/api/authority/target-image-registration";
const destination = "https://sczn3-authority.onrender.com/api/authority/target-image-registration";

assert.match(toml, new RegExp(`from = "${route}"[\\s\\S]*to = "${destination}"[\\s\\S]*status = 200[\\s\\S]*force = true`));
assert.ok(redirects.split(/\r?\n/).includes(`${route} ${destination} 200!`));
assert.equal((toml.match(new RegExp(route, "g")) || []).length, 2, "one source route and one destination route are declared");
assert.equal((redirects.match(new RegExp(route, "g")) || []).length, 2, "one source route and one destination route are declared");

console.log("PASS Episode 59 Netlify Target Image Registration proxy contract");
