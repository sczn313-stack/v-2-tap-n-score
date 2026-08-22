#!/usr/bin/env python3
"""Build the Authority First dissection of the five non-qualification missing families."""

from __future__ import annotations

import json
from pathlib import Path


OUT = Path(__file__).resolve().parent
SOURCE = OUT / "UNRECOGNIZED_69.json"
FAMILY_IDS = ["CF-11", "CF-13", "CF-14", "CF-15", "CF-16"]

FINDINGS = {
    "CF-11": {
        "name": "Governed diagnostic feedback",
        "profile": "Diagnostic Feedback Profile",
        "executor": "Diagnostic Feedback Evaluator",
        "publisher": "Exact product identity and artwork; Baker expressly claims handedness-specific tutor feedback and example shooting causes, while GunFun identifies diagnostic zones/tags. Printed labels may be publisher evidence, but catalog metadata alone does not establish a complete structured mapping.",
        "existing": "Exact product identity, evidence capture, shot-observation reconciliation, SEC, preservation/reopen; registered geometry only where separately authorized.",
        "missing": "Classify authorized observations into exact publisher-defined diagnostic regions and return only the corresponding publisher-supplied label, with provenance and confidence/failure state.",
        "floor": "Record and preserve visible observations without diagnosing cause, technique, anatomy, or correction.",
        "authority_gap": "Most GunFun catalog records establish a diagnostic tag or zone but do not publish the complete label/geometry mapping in structured authority. Baker describes example causes, but exact region mappings still require authoritative packaging from the target/Publisher Profile.",
        "subfamilies": "No. Right/left-handed layouts, humorous labels, bullseye versus silhouette presentation, and the Navy composition are profile variants. Navy qualification remains independently composed CF-12 authority.",
        "claim_grades": ["evidence_only", "publisher_label_match", "publisher_governed_feedback"],
    },
    "CF-13": {
        "name": "Commanded, cued, randomized, or timed drill orchestration",
        "profile": "Cue/Drill Profile",
        "executor": "Cue/Drill Orchestrator",
        "publisher": "Exact product identity and selectable printed entities such as shapes, colors, numbers, rounds, or aim points, plus intended command/timed/memory use. Most product pages do not establish one canonical cue sequence, timing model, completion rule, or result.",
        "existing": "Registered product, evidence capture, session state, backend-authoritative result, Universal SEC, preservation/reopen, and reusable scoring/challenge components where separately authorized.",
        "missing": "Issue or accept governed cues, maintain sequence/timer/memory state, associate observations with the active cue, reconcile correct/late/missed/extra responses, and terminate by profile rules.",
        "floor": "Record the target and observations; an instructor may conduct an external drill, but SCZN3 cannot claim it issued, timed, randomized, or evaluated that drill.",
        "authority_gap": "Many Command products publish useful selectable shapes/colors/numbers but no canonical course. Primary links sample Simon-Says-style instructions; Fusion links a mutable external drill library. Each executable drill still needs a frozen, versioned rules profile.",
        "subfamilies": "One family with declarative modes: commanded selection, randomized cue, fixed timed string, and memory/repetition. CTQ composes CF-12 qualification; it does not create a new orchestrator.",
        "claim_grades": ["evidence_only", "externally_conducted_drill_evidence", "sczn3_orchestrated_governed_drill"],
    },
    "CF-14": {
        "name": "Decision discrimination and scenario state",
        "profile": "Decision Scenario Profile",
        "executor": "Decision Scenario Evaluator",
        "publisher": "Exact Good/Bad paired identity and the publisher's shoot/no-shoot designation for Dan, Dave, Jeff, and Rich products.",
        "existing": "Exact target identity, evidence capture, observation reconciliation, session/SEC lifecycle, and preservation.",
        "missing": "Govern which scenario identity was presented, the authorized expected response including no-response, response window, observation association, transition, and truthful result semantics.",
        "floor": "Record observations against the exact product without inferring threat, legality, tactics, anatomy, or whether firing was correct.",
        "authority_gap": "Baker establishes the pair membership and Good/Bad shoot/don't-shoot concept, but the catalog does not establish a complete digital course: presentation order, timing, shot limits, penalties, completion, or scoring.",
        "subfamilies": "No. Four character pairs are data instances of the same scenario-state behavior. Any future legal, tactical, use-of-force, or multi-scene judgment would require separate external authority and may expand the family later.",
        "claim_grades": ["evidence_only", "publisher_designation_recall", "governed_scenario_response_result"],
    },
    "CF-15": {
        "name": "Longitudinal progression",
        "profile": "Progression Profile",
        "executor": "SEC Progression Evaluator",
        "publisher": "Baker establishes that the Bullseye Challenge target is used with its 20-page guide to track accuracy and advance from lower to higher levels over time.",
        "existing": "Individual session evidence/results, shooter/session identity where governed, Universal SEC, preservation, and exact historical reopen.",
        "missing": "Evaluate eligible preserved SECs against versioned level criteria, maintain current level and history, advance or hold by exact rules, and preserve the profile/version that produced each transition.",
        "floor": "Preserve each target session independently; the shooter may consult the physical guide, but SCZN3 cannot assign or advance a level.",
        "authority_gap": "The public product page establishes progression intent but not the guide's complete level criteria. The 20-page Baker guide is the primary rules authority and must be obtained, versioned, and licensed/approved for digital use.",
        "subfamilies": "No subfamily is established by one lineage. Architecturally this is a cross-session evaluator over SECs, not a target executor. A second independent progression fixture is required before claiming broad generality.",
        "claim_grades": ["independent_session_history", "publisher_program_progress", "credential_or_rank_only_if_separately_authorized"],
    },
    "CF-16": {
        "name": "Declarative collection/hand/path game state",
        "profile": "Collection/Hand Game Profile",
        "executor": "Collection/Hand Evaluator",
        "publisher": "Baker establishes Poker Wheel play, solo or multiplayer use, poker-hand formation, Royal Flush objective, and an instruction guide printed on the target.",
        "existing": "Target identity, evidence capture, observation reconciliation, multiplayer/session primitives from existing target-shaped games, Universal SEC, and preservation.",
        "missing": "Map observations to card/collection members, enforce hand size and turn rules, evaluate combinations/rank/ties, maintain player state, and terminate according to the exact printed game rules.",
        "floor": "Record the impacts and preserve the evidence; the shooter may determine the poker hand manually from the printed guide.",
        "authority_gap": "The product description is insufficient for executable details such as observation-to-card mapping, duplicate treatment, shot/hand size, turn structure, ties, misses, and completion. The printed guide must be captured as authoritative profile data.",
        "subfamilies": "Only collection/hand evaluation is evidenced by the counted products. The broader 'path' portion is not yet proven by this 69-offering denominator and must not be prebuilt. One lineage is insufficient to prove a universal game executor.",
        "claim_grades": ["evidence_only", "publisher_hand_result", "governed_multiplayer_game_result"],
    },
}


data = json.loads(SOURCE.read_text())
records = [record for record in data["records"] if any(family in record["allMissingFamilyIds"] for family in FAMILY_IDS)]
assert len(records) == 45

family_summary = []
for family_id in FAMILY_IDS:
    subset = [record for record in records if family_id in record["allMissingFamilyIds"]]
    finding = FINDINGS[family_id]
    family_summary.append({
        "id": family_id,
        "name": finding["name"],
        "offerings": len(subset),
        "lineages": len({record["canonicalProductLineage"] for record in subset}),
        "publisherCounts": {
            "GunFun": sum(record["publisher"] == "GunFun" for record in subset),
            "Baker Targets": sum(record["publisher"] == "Baker Targets" for record in subset),
        },
        "proposedProfile": finding["profile"],
        "proposedExecutor": finding["executor"],
        "publisherEstablishes": finding["publisher"],
        "sczn3AlreadyRecognizes": finding["existing"],
        "smallestMissingBehavior": finding["missing"],
        "evidenceOnlyToday": finding["floor"],
        "authorityGap": finding["authority_gap"],
        "subfamilyFinding": finding["subfamilies"],
        "claimGrades": finding["claim_grades"],
    })

for record in records:
    relevant = [family for family in FAMILY_IDS if family in record["allMissingFamilyIds"]]
    assert len(relevant) == 1
    family_id = relevant[0]
    record["remainingFamily"] = {"id": family_id, "name": FINDINGS[family_id]["name"]}
    record["publisherEstablishesAtFamilyLevel"] = FINDINGS[family_id]["publisher"]
    record["sczn3AlreadyRecognizes"] = FINDINGS[family_id]["existing"]
    record["evidenceOnlyToday"] = FINDINGS[family_id]["floor"]
    record["smallestMissingReusableBehavior"] = FINDINGS[family_id]["missing"]
    record["authorityGap"] = FINDINGS[family_id]["authority_gap"]
    record["compositionWithOtherMissingFamilies"] = [family for family in record["allMissingFamilyIds"] if family != family_id]

assert [item["offerings"] for item in family_summary] == [16, 17, 8, 2, 2]
assert [item["lineages"] for item in family_summary] == [13, 13, 8, 1, 1]
assert len({record["canonicalProductLineage"] for record in records}) == 36
qualification_overlaps = [record for record in records if "CF-12" in record["allMissingFamilyIds"]]
assert len(qualification_overlaps) == 3
assert len({record["canonicalProductLineage"] for record in qualification_overlaps}) == 2

result = {
    "analysisId": "EP56-REMAINING-FIVE-MISSING-FAMILIES-V1",
    "status": "founder_review",
    "implementationPerformed": False,
    "reconciliation": {
        "familyLabeledOfferings": 45,
        "canonicalLineages": 36,
        "overlapWithQualificationOfferings": 3,
        "overlapWithQualificationLineages": 2,
        "offeringsAddedBeyondQualificationPopulation": 42,
        "allSixUniqueOfferings": 69,
        "allSixUniqueLineages": 55,
        "equations": ["27 + 45 - 3 = 69 offerings", "21 + 36 - 2 = 55 lineages"],
    },
    "familySummary": family_summary,
    "crossFamilyConclusion": {
        "supportedReusableOwners": 5,
        "finding": "Current evidence supports one reusable owner for each remaining family, with no target-specific or publisher-specific executor.",
        "refinement": "CF-16 evidence supports collection/hand state only; generic path-state generalization is not established by the counted population.",
        "validationCaveat": "CF-15 and CF-16 each have only one product lineage, so a second authority-complete fixture is required before broad generality can be claimed.",
    },
    "records": records,
}
(OUT / "REMAINING_FIVE_AUTHORITY_BREAKDOWN.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")


def esc(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


lines = [
    "# Remaining Five Missing Capability Families — Authority First Dissection",
    "",
    "**Status:** Founder review; inspection only  ",
    "**Population:** 45 family-labeled offerings / 36 lineages; three offerings overlap Qualification  ",
    "**Implementation:** None",
    "",
    "## Executive answer",
    "",
    "> **The remaining catalog evidence supports five reusable owners—not 45 target implementations. No publisher-specific or target-specific executor is justified.**",
    "",
    "There is one important narrowing: CF-16 is proven here only as collection/hand game state. The broader `path` generalization is not established by the two Poker Wheel offerings and must not be implemented speculatively.",
    "",
    "## Exact population reconciliation",
    "",
    "| Family | Offerings | Lineages | GunFun | Baker | Smallest reusable owner |",
    "|---|---:|---:|---:|---:|---|",
]
for item in family_summary:
    lines.append(f"| {item['id']} — {item['name']} | {item['offerings']} | {item['lineages']} | {item['publisherCounts']['GunFun']} | {item['publisherCounts']['Baker Targets']} | {item['proposedProfile']} → {item['proposedExecutor']} |")
lines.extend([
    "",
    "The five-family population contains 45 offerings. Navy `22460` and Baker CTQ base/bulk also belong to Qualification, so they add only 42 new offerings beyond the 27 qualification offerings: **27 + 45 − 3 = 69**. At lineage level: **21 + 36 − 2 = 55**.",
    "",
    "## Family findings",
    "",
])

for item in family_summary:
    lines.extend([
        f"### {item['id']} — {item['name']}",
        "",
        f"**Reusable shape:** `{item['proposedProfile']} → {item['proposedExecutor']} → governed result`",
        "",
        f"- **Publisher establishes:** {item['publisherEstablishes']}",
        f"- **SCZN3 already recognizes:** {item['sczn3AlreadyRecognizes']}",
        f"- **Evidence-only today:** {item['evidenceOnlyToday']}",
        f"- **Smallest missing behavior:** {item['smallestMissingBehavior']}",
        f"- **Authority gap:** {item['authorityGap']}",
        f"- **Subfamily result:** {item['subfamilyFinding']}",
        f"- **Claim grades:** {' → '.join(item['claimGrades'])}",
        "",
    ])

lines.extend([
    "## Complete 45-offering authority ledger",
    "",
    "Every offering is listed once under its remaining-family assignment. The composition column preserves its separate Qualification overlap where present.",
    "",
])

for family_id in FAMILY_IDS:
    item = next(item for item in family_summary if item["id"] == family_id)
    subset = [record for record in records if record["remainingFamily"]["id"] == family_id]
    lines.extend([
        f"### {family_id} — {item['name']} ({len(subset)} offerings)",
        "",
        "| Publisher product | SKU | Composition | What the printer establishes | What works today | Missing governed behavior / authority |",
        "|---|---|---|---|---|---|",
    ])
    for record in subset:
        composition = " + ".join([family_id] + record["compositionWithOtherMissingFamilies"])
        lines.append(
            f"| [{esc(record['exactProductName'])}]({record['publisherProductLink']}) ({record['publisher']}) | `{esc(record['sku'])}` | {composition} | {esc(record['publisherEstablishesAtFamilyLevel'])} | {esc(record['evidenceOnlyToday'])} | {esc(record['smallestMissingReusableBehavior'])} {esc(record['authorityGap'])} |"
        )
    lines.append("")

lines.extend([
    "## Cross-family architecture conclusion",
    "",
    "The six missing families still stand after product-level inspection, but their correct shapes are now clearer:",
    "",
    "1. Diagnostic Feedback Profile → Diagnostic Feedback Evaluator.",
    "2. Qualification Profile → Qualification Executor, with official administration/attestation separate.",
    "3. Cue/Drill Profile → Cue/Drill Orchestrator.",
    "4. Decision Scenario Profile → Decision Scenario Evaluator.",
    "5. Progression Profile → SEC Progression Evaluator.",
    "6. Collection/Hand Game Profile → Collection/Hand Evaluator.",
    "",
    "CF-15 and CF-16 have only one product lineage each. Their boundaries are plausible but not yet empirically reusable; each needs a second independent authority-complete fixture before generality is accepted. No path-game owner is justified yet.",
    "",
    "No capability, authority profile, application architecture, registration, production state, commit, push, or deployment was implemented or changed.",
])
(OUT / "REMAINING_FIVE_AUTHORITY_BREAKDOWN.md").write_text("\n".join(lines) + "\n")

print(json.dumps({"offerings": len(records), "lineages": len({record['canonicalProductLineage'] for record in records}), "families": [(item['id'], item['offerings'], item['lineages']) for item in family_summary]}, indent=2))
