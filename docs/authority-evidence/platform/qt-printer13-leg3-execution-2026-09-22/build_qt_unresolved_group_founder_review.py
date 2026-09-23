#!/usr/bin/env python3
"""Build exact-membership Founder N/N stacks for QT unresolved groups."""

from __future__ import annotations

import html
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SWEEP_PATH = ROOT / "QT_THE13_SURGICAL_CORRECTNESS_SWEEP.json"
EXECUTION_PATH = ROOT / "QT_LEG3_EXECUTION_MANIFEST.json"
MANIFEST_PATH = ROOT / "QT_UNRESOLVED_GROUP_FOUNDER_NN_MANIFEST.json"
VERIFICATION_PATH = ROOT / "QT_UNRESOLVED_GROUP_FOUNDER_NN_VERIFICATION.json"
CSS_PATH = ROOT / "QT_UNRESOLVED_GROUP_FOUNDER_NN.css"
JS_PATH = ROOT / "QT_UNRESOLVED_GROUP_FOUNDER_NN.js"

EXPECTED_COUNTS = [1, 8, 18, 2, 2, 13, 49, 29, 8, 10, 63, 5]


CSS = """\
:root {
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #080a0e;
  color: #f4f6fa;
  --panel: #111620;
  --line: #303947;
  --muted: #aeb8c8;
  --accent: #f1c84b;
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; overflow: hidden; background: #080a0e; }
.shell { display: grid; grid-template-rows: auto 1fr; height: 100%; }
header { background: var(--panel); border-bottom: 1px solid var(--line); padding: 9px 12px; }
.topline { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 10px; }
.group { min-width: 0; }
.eyebrow { color: var(--accent); font: 800 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; }
h1 { margin: 2px 0 0; overflow: hidden; font-size: 18px; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
.nav { display: flex; align-items: center; justify-content: center; gap: 9px; }
button, .open { border: 1px solid #576274; border-radius: 5px; background: #202836; color: #f4f6fa; padding: 7px 10px; font: 800 12px/1 system-ui, sans-serif; text-decoration: none; cursor: pointer; }
button:hover:not(:disabled), button:focus-visible, .open:hover, .open:focus-visible { border-color: var(--accent); }
button:disabled { cursor: default; opacity: .35; }
#progress { min-width: 112px; text-align: center; color: var(--accent); font: 900 14px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
.identity { min-width: 0; text-align: right; }
#target-name { margin: 0; overflow: hidden; font-size: 15px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
#target-meta { margin-top: 2px; overflow: hidden; color: var(--muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.issue { display: flex; align-items: center; gap: 8px; margin-top: 7px; color: var(--muted); font-size: 11px; line-height: 1.25; }
.issue strong { flex: none; color: #f4f6fa; }
.issue span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.open { flex: none; margin-left: auto; }
main { min-height: 0; background: #05070a; }
iframe { display: block; width: 100%; height: 100%; border: 0; background: #fff; }
.failure { display: grid; place-items: center; height: 100%; padding: 24px; color: #ffb1b1; text-align: center; }
@media (max-width: 900px) {
  .topline { grid-template-columns: 1fr; }
  .group, .identity { text-align: center; }
  .issue span { white-space: normal; }
}
"""


JS = """\
(() => {
  const dataNode = document.querySelector("#group-data");
  const frame = document.querySelector("#smart-target");
  const previous = document.querySelector("#previous");
  const next = document.querySelector("#next");
  const progress = document.querySelector("#progress");
  const targetName = document.querySelector("#target-name");
  const targetMeta = document.querySelector("#target-meta");
  const issue = document.querySelector("#issue-text");
  const open = document.querySelector("#open-experience");

  function fail(message) {
    document.querySelector("main").innerHTML = `<p class="failure">${escapeHtml(message)}</p>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  let group;
  try {
    group = JSON.parse(dataNode.textContent);
  } catch (error) {
    fail(`Review stack unavailable: ${error.message}`);
    return;
  }

  const expected = Number(document.body.dataset.denominator);
  const ordinals = group.chairs.map(chair => chair.visualStackOrdinal);
  if (group.chairs.length !== expected || new Set(ordinals).size !== expected) {
    fail("Review stack membership verification failed.");
    return;
  }

  const parseIndex = () => {
    const match = location.hash.match(/^#chair=(\\d+)$/);
    const requested = match ? Number(match[1]) - 1 : 0;
    return Number.isInteger(requested) && requested >= 0 && requested < expected ? requested : 0;
  };

  function render(index, updateHash = true) {
    const chair = group.chairs[index];
    const href = `../../../target-experience.html?missionFamily=${encodeURIComponent(chair.missionFamily)}&target=${encodeURIComponent(chair.targetProfileId)}&source=registered&authorityPort=8098`;
    progress.textContent = `Founder ${index + 1}/${expected}`;
    targetName.textContent = chair.targetName;
    targetMeta.textContent = `${chair.skus.join(" · ") || "SKU not recorded"} · ${chair.currentCapability} · QT chair #${chair.visualStackOrdinal}`;
    issue.textContent = group.unresolvedIssue;
    frame.title = `${chair.targetName} Smart Target experience`;
    frame.src = href;
    open.href = href;
    previous.disabled = index === 0;
    next.disabled = index === expected - 1;
    previous.dataset.index = String(index - 1);
    next.dataset.index = String(index + 1);
    if (updateHash) history.replaceState(null, "", `#chair=${index + 1}`);
  }

  previous.addEventListener("click", () => {
    const index = Number(previous.dataset.index);
    if (index >= 0) render(index);
  });
  next.addEventListener("click", () => {
    const index = Number(next.dataset.index);
    if (index < expected) render(index);
  });
  addEventListener("hashchange", () => render(parseIndex(), false));

  window.QT_REVIEW_DIAGNOSTICS = Object.freeze({
    groupNumber: group.groupNumber,
    groupName: group.groupName,
    manifestCount: group.manifestCount,
    displayedDenominator: expected,
    uniqueChairCount: new Set(ordinals).size,
    chairOrdinals: Object.freeze([...ordinals])
  });
  render(parseIndex(), false);
})();
"""


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def page_path(group_number: int) -> Path:
    return ROOT / f"QT_UNRESOLVED_GROUP_{group_number:02d}_FOUNDER_NN.html"


def page_html(group: dict) -> str:
    number = group["groupNumber"]
    count = group["manifestCount"]
    title = f"QT Group {number} · {group['groupName']} · Founder N/N"
    embedded = json.dumps(group, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{html.escape(title)}</title>
  <link rel="stylesheet" href="QT_UNRESOLVED_GROUP_FOUNDER_NN.css">
</head>
<body data-group-number="{number}" data-denominator="{count}">
  <div class="shell">
    <header>
      <div class="topline">
        <div class="group">
          <div class="eyebrow">QT unresolved group {number} of 12</div>
          <h1>{html.escape(group['groupName'])}</h1>
        </div>
        <nav class="nav" aria-label="Founder chair navigation">
          <button id="previous" type="button">PREVIOUS ←</button>
          <strong id="progress">Founder 1/{count}</strong>
          <button id="next" type="button">→ NEXT</button>
        </nav>
        <div class="identity">
          <h2 id="target-name">Loading target…</h2>
          <div id="target-meta"></div>
        </div>
      </div>
      <div class="issue">
        <strong>Exact unresolved issue</strong>
        <span id="issue-text">{html.escape(group['unresolvedIssue'])}</span>
        <a id="open-experience" class="open" href="#" target="_blank" rel="noreferrer">Open Smart Target experience</a>
      </div>
    </header>
    <main><iframe id="smart-target" title="Smart Target experience"></iframe></main>
  </div>
  <script id="group-data" type="application/json">{embedded}</script>
  <script src="QT_UNRESOLVED_GROUP_FOUNDER_NN.js"></script>
</body>
</html>
"""


def main() -> None:
    sweep = load_json(SWEEP_PATH)
    execution = load_json(EXECUTION_PATH)
    unresolved = sweep.get("unresolvedGroups", [])
    if len(unresolved) != 12:
        raise SystemExit(f"expected 12 unresolved groups, found {len(unresolved)}")

    surfaces = {surface["visualStackOrdinal"]: surface for surface in execution["surfaces"]}
    rows = {row["visualStackOrdinal"]: row for row in sweep["rows"]}
    groups = []
    all_ordinals = []

    for index, source_group in enumerate(unresolved, start=1):
        expected = EXPECTED_COUNTS[index - 1]
        ordinals = source_group["chairs"]
        if source_group["surfaceCount"] != expected or len(ordinals) != expected:
            raise SystemExit(f"group {index} count mismatch")
        if len(set(ordinals)) != expected:
            raise SystemExit(f"group {index} contains duplicate chairs")

        chairs = []
        for ordinal in ordinals:
            surface = surfaces.get(ordinal)
            row = rows.get(ordinal)
            if not surface or not row:
                raise SystemExit(f"group {index} chair {ordinal} is absent from source records")
            chairs.append(
                {
                    "visualStackOrdinal": ordinal,
                    "qtCatalogId": surface["qtCatalogId"],
                    "targetName": surface["productName"],
                    "skus": surface.get("skuProductIdentifiers", []),
                    "currentCapability": row["finalCapability"],
                    "targetProfileId": surface["targetProfileId"],
                    "missionFamily": surface["missionFamily"],
                }
            )

        group = {
            "groupNumber": index,
            "groupName": source_group["family"],
            "unresolvedIssue": source_group["question"],
            "manifestCount": expected,
            "chairs": chairs,
        }
        groups.append(group)
        all_ordinals.extend(ordinals)

    if len(all_ordinals) != 208 or len(set(all_ordinals)) != 208:
        raise SystemExit("12-group membership does not reconcile to 208 unique chairs")

    CSS_PATH.write_text(CSS, encoding="utf-8")
    JS_PATH.write_text(JS, encoding="utf-8")
    for group in groups:
        page_path(group["groupNumber"]).write_text(page_html(group), encoding="utf-8")

    manifest = {
        "schemaVersion": "qt-unresolved-group-founder-nn-review-v1",
        "generatedOn": date.today().isoformat(),
        "source": SWEEP_PATH.name,
        "scope": "REVIEW_PRESENTATION_ONLY",
        "groupCount": 12,
        "totalUniqueChairs": 208,
        "groups": groups,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    group_results = []
    for group in groups:
        page = page_path(group["groupNumber"])
        page_text = page.read_text(encoding="utf-8")
        ordinals = [chair["visualStackOrdinal"] for chair in group["chairs"]]
        denominator_marker = f'data-denominator="{group["manifestCount"]}"'
        group_marker = f'data-group-number="{group["groupNumber"]}"'
        result = {
            "groupNumber": group["groupNumber"],
            "groupName": group["groupName"],
            "manifestCount": group["manifestCount"],
            "displayedDenominator": group["manifestCount"] if denominator_marker in page_text else None,
            "actualUniqueChairs": len(set(ordinals)),
            "duplicateChairs": len(ordinals) - len(set(ordinals)),
            "outsideGroupChairs": [],
            "pageGroupMatches": group_marker in page_text,
            "status": "PASS",
        }
        if not (
            result["manifestCount"]
            == result["displayedDenominator"]
            == result["actualUniqueChairs"]
            and result["duplicateChairs"] == 0
            and result["pageGroupMatches"]
        ):
            result["status"] = "FAIL"
        group_results.append(result)

    verification = {
        "schemaVersion": "qt-unresolved-group-founder-nn-verification-v1",
        "generatedOn": date.today().isoformat(),
        "status": "PASS" if all(item["status"] == "PASS" for item in group_results) else "FAIL",
        "checks": {
            "groupCount": len(groups),
            "sumOfGroupCounts": len(all_ordinals),
            "totalUniqueChairs": len(set(all_ordinals)),
            "crossGroupDuplicateMemberships": len(all_ordinals) - len(set(all_ordinals)),
            "group2ExactMembership": [chair["visualStackOrdinal"] for chair in groups[1]["chairs"]],
            "group2Count": groups[1]["manifestCount"],
        },
        "groups": group_results,
    }
    VERIFICATION_PATH.write_text(json.dumps(verification, indent=2) + "\n", encoding="utf-8")
    if verification["status"] != "PASS":
        raise SystemExit("review-stack verification failed")

    print(json.dumps(verification, indent=2))


if __name__ == "__main__":
    main()
