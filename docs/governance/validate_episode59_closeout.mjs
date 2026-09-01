import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relative) => fs.readFileSync(path.join(repo, relative), "utf8");
const requireText = (value, expected, label) => {
  if (!value.includes(expected)) throw new Error(`${label}: missing ${expected}`);
};

const registry = JSON.parse(read("governance/episode-registry/EPISODE_REGISTRY.json"));
const episodes = registry.episodes;
if (!Array.isArray(episodes) || episodes.length !== 60) throw new Error("Episode Registry must contain 60 entries");
for (let i = 0; i < episodes.length; i += 1) {
  if (episodes[i].episodeNumber !== i + 1) throw new Error(`Episode Registry discontinuity at ${i + 1}`);
}
if (episodes[58].status !== "locked") throw new Error("Episode 59 is not locked");
if (episodes[59].status !== "active") throw new Error("Episode 60 is not active");

const scmm = read("docs/architecture/SCZN3_SHORTEST_CORRECT_MENTAL_MODEL.md");
requireText(scmm, "**Version:** 1.8", "SCMM");
requireText(scmm, "Episode 60 — M4: LET THE TARGET TALK", "SCMM");
requireText(scmm, "Do not re-solve conquered behavior. Retrieve it.", "SCMM");

for (const relative of [
  "docs/history/episodes/EPISODE_59_I_KNOW_THIS_SHOOTER.md",
  "docs/history/episodes/EPISODE_60_M4_LET_THE_TARGET_TALK_HANDOFF.md",
  "docs/history/episodes/EPISODE_60_CODY_IMPLEMENTATION_HANDOFF.md",
  "docs/history/snapshots/SNAPSHOT_017_EPISODE_59_CLOSURE_EPISODE_60_OPENING_FLOOR.md",
  "CHECKPOINTS/SCZN3_EP59_CLOSURE_EP60_OPENING_FLOOR_2026-09-01/CHECKPOINT.md",
]) {
  if (!fs.existsSync(path.join(repo, relative))) throw new Error(`Missing ${relative}`);
}

const keepsakes = read("docs/governance/KEEPSAKE_VAULT_INDEX.md");
requireText(keepsakes, "Keepsake #20 — Equipment Library — Shooter Data Survives Updates", "Keepsake Index");
requireText(keepsakes, "Keepsake #21 — Printer-Recipient Campaign", "Keepsake Index");
requireText(keepsakes, "6d1cae11042d0c9f4efc446ae281a85381ccd95bb5d8877e66643b147aa69f4c", "Keepsake Index");

console.log("PASS Episode 59 closeout / Episode 60 opening continuity");
