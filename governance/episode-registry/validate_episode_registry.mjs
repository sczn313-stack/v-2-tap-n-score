#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.join(here, "EPISODE_REGISTRY.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

const episodes = registry.episodes || [];
const numbers = episodes.map(entry => entry.episodeNumber);
const numberSet = new Set(numbers);
if (numberSet.size !== numbers.length) fail("duplicate episode number");

const maximum = Math.max(...numbers);
for (let expected = 1; expected <= maximum; expected += 1) {
  if (!numberSet.has(expected)) fail(`skipped episode number: ${expected}`);
}
for (let index = 1; index < numbers.length; index += 1) {
  if (numbers[index] !== numbers[index - 1] + 1) {
    fail(`registry order is not continuous at ${numbers[index - 1]} -> ${numbers[index]}`);
  }
}

const active = episodes.filter(entry => entry.status === "active");
if (active.length > 1) fail("parallel active episodes");
const declaredActive = registry.governance.activeEpisode;
if (declaredActive === null && active.length !== 0) fail("active episode exists but governance.activeEpisode is null");
if (declaredActive !== null && (active.length !== 1 || active[0].episodeNumber !== declaredActive)) {
  fail("governance.activeEpisode does not match the active registry entry");
}

const lastClosed = registry.governance.lastClosedEpisode;
const lastClosedEntry = episodes.find(entry => entry.episodeNumber === lastClosed);
if (!lastClosedEntry || !["closed", "locked"].includes(lastClosedEntry.status)) {
  fail("lastClosedEpisode is not authoritatively closed");
}
if (declaredActive !== null && declaredActive !== lastClosed + 1) {
  fail("active episode must immediately follow the last closed episode");
}
const expectedNext = declaredActive === null ? lastClosed + 1 : declaredActive + 1;
if (registry.governance.nextEpisodeNumber !== expectedNext) {
  fail("nextEpisodeNumber does not follow the active/last-closed sequence");
}

for (const field of ["checkpoint", "zip", "archiveLocation"]) {
  const seen = new Map();
  for (const episode of episodes) {
    const value = episode[field];
    if (!value) continue;
    if (seen.has(value)) fail(`conflicting ${field}: ${value} (Episodes ${seen.get(value)} and ${episode.episodeNumber})`);
    seen.set(value, episode.episodeNumber);
  }
}

const productionIds = new Map();
for (const episode of episodes) {
  const release = episode.productionRelease;
  if (!release) continue;
  for (const key of ["netlifyDeployId", "renderDeployId"]) {
    if (!release[key]) continue;
    const identity = `${key}:${release[key]}`;
    if (productionIds.has(identity)) {
      fail(`conflicting production reference: ${identity} (Episodes ${productionIds.get(identity)} and ${episode.episodeNumber})`);
    }
    productionIds.set(identity, episode.episodeNumber);
  }
}

for (const episode of episodes) {
  if (!Number.isInteger(episode.episodeNumber) || episode.episodeNumber < 1) fail("episode numbers must be positive integers");
  if (!Array.isArray(episode.commits)) fail(`Episode ${episode.episodeNumber} commits must be an array`);
  if (!Array.isArray(episode.evidence) || episode.evidence.length === 0) fail(`Episode ${episode.episodeNumber} lacks evidence`);
  if (episode.status === "historical-unresolved" && episode.title !== null) fail(`Episode ${episode.episodeNumber} unresolved slot has an invented title`);
  if (episode.status !== "historical-unresolved" && !episode.title) fail(`Episode ${episode.episodeNumber} lacks a title`);
}

if (registry.governance.rule !== "No episode may be created until the previous episode has been authoritatively closed.") {
  fail("governance closure rule changed");
}

if (failures.length) {
  console.error("Episode Registry validation: FAIL");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Episode Registry validation: PASS (${episodes.length} continuous episode slots; ${active.length} active)`);
console.log(`Last closed: Episode ${lastClosed}; active: ${declaredActive === null ? "none" : `Episode ${declaredActive}`}; next reserved: Episode ${registry.governance.nextEpisodeNumber}`);
