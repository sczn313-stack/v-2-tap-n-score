#!/usr/bin/env python3
"""Build the QT Founder/Homie review reconciliation from conversation decisions only.

Legacy treatment packets and current Backend Authority are used only for inventory identity
and comparison. They never fill a semantic review gap.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
EVIDENCE = ROOT / "docs/authority-evidence/platform/qt-episode64-founder-homie-review-2026-09-23"
TRANSCRIPT = EVIDENCE / "QT_FOUNDER_HOMIE_REVIEW_TRANSCRIPT.jsonl"
AUTHORITY = ROOT / "docs/backend/target_knowledge/qt_episode64_smart_target_authority.json"
OUT_JSON = EVIDENCE / "QT_FOUNDER_HOMIE_254_REVIEW_RECONCILIATION.json"
OUT_MD = EVIDENCE / "QT_FOUNDER_HOMIE_254_REVIEW_RECONCILIATION.md"

# Catalog chair -> final review turn. These mappings come from the sequential Founder walkthrough.
# Missing or ambiguous mappings are deliberately absent.
TURN = {
  2:146, 4:166, 5:208, 6:202, 7:211, 8:213,
  11:235, 12:223, 13:224, 14:226, 15:228, 16:229, 17:230, 18:231, 19:234, 20:235,
  21:237, 22:238, 23:239, 24:240, 25:241, 26:241, 27:242, 28:246, 29:247, 30:248,
  31:249, 32:250, 33:251, 34:253, 35:254, 36:255, 37:256, 38:257, 39:258, 40:259,
  41:262, 42:264, 43:267, 44:269, 45:271, 46:274, 47:276, 48:278, 50:282, 51:284,
  52:286, 53:288, 54:290, 55:292, 56:294, 57:298, 59:300, 60:303, 61:304, 62:305,
  63:306, 64:307, 65:309, 66:310, 67:311, 68:312, 69:313, 70:314, 71:315, 72:315,
  73:316, 74:316, 75:317, 76:317, 77:318, 78:318, 79:318, 80:321, 81:323, 82:325,
  83:327, 84:329, 85:331, 86:334, 87:336, 88:337, 89:339, 90:341, 91:341, 92:344,
  93:344, 94:345, 95:346, 96:348, 97:349, 98:350, 99:353, 100:354, 101:355,
  102:357, 103:358, 104:359, 105:363, 106:364, 107:365, 108:366, 110:367,
  111:368, 112:369, 114:370, 115:371, 116:372, 117:373, 118:374, 119:377,
  120:379, 121:380, 122:382, 123:383, 124:384, 125:386, 126:387, 127:388,
  128:389, 129:392, 130:393, 131:395, 132:396, 133:398, 134:399, 135:400,
  136:401, 137:402, 138:403, 139:404, 140:405, 141:406, 142:407, 143:408,
  144:409, 145:410, 146:411, 147:412, 148:413, 149:414, 150:415, 151:416,
  152:417, 153:418, 154:419, 155:420, 156:421, 157:422, 158:424, 159:425,
  160:426, 162:428, 163:429, 164:430, 165:431, 166:432, 167:433, 168:434,
  169:435, 170:437, 171:438, 172:439, 173:440, 174:442, 175:444, 176:445,
  177:446, 178:447, 179:448, 180:449, 181:450, 182:451, 183:452, 184:453,
  185:454, 186:456, 187:457, 188:458, 189:460, 190:461, 191:463, 192:464,
  193:465, 194:466, 195:467, 196:468, 197:469, 198:470, 199:472, 200:473,
  201:474, 202:475, 204:477, 205:478, 207:481, 208:482, 209:483, 210:485,
  211:486, 212:487, 214:489, 215:490, 216:492, 217:493, 218:494, 219:495,
  220:496, 221:497, 222:498, 223:499, 224:558, 231:510, 232:512, 233:513,
  234:516, 235:517, 236:518, 237:519, 238:520, 239:521, 240:522, 241:523,
  242:524, 243:525, 244:526, 245:528, 246:530, 247:529, 248:531, 249:532,
  250:534, 251:536, 252:537, 253:538, 254:539,
}

SCORING = {
  4,5,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,29,30,33,34,35,36,37,38,39,
  41,43,44,45,46,47,48,50,51,52,81,87,88,89,101,104,121,122,133,135,136,139,146,
  149,150,154,168,170,189,199,200,201,202,209,210,211,214,215,242,244,246,247,248,
}
COUNTS = {
  1,2,6,7,8,31,32,40,42,53,54,55,56,57,59,60,61,62,63,64,65,66,67,68,69,70,71,
  72,73,74,75,76,77,78,79,80,82,83,84,85,86,90,91,92,93,94,95,96,98,99,100,
  102,103,105,106,107,108,110,111,112,114,115,116,117,118,119,120,123,124,125,
  126,127,128,129,130,131,132,134,137,138,140,141,142,143,144,145,147,148,151,
  152,153,155,156,157,159,160,163,164,165,166,167,169,171,172,173,174,
  175,176,177,178,179,180,181,182,183,184,185,186,187,188,190,191,192,193,194,
  207,208,212,216,218,220,221,222,223,224,231,232,233,234,235,236,237,238,239,
  240,241,243,245,249,250,251,252,253,254,
}
EVIDENCE_ONLY = {28,97,195,196,197,198,204,205,217,219}
ZEROING = {162}

# Explicit contradictions or gaps that prevent a safe individual semantic record.
UNRECOVERED_REASON = {
  1:"No individual 5-Spot semantic decision appears in the target-by-target walkthrough; only implementation-defect discussion was recovered.",
  3:"No individual Anatomy-1 decision appears in the target-by-target walkthrough.",
  9:"The unnamed B-21 review image cannot be distinguished safely between B-21R-G and B-21XR.",
  10:"The unnamed B-21 review image cannot be distinguished safely between B-21R-G and B-21XR.",
  49:"CAT-II values were explicitly left unreadable and no later final decision was recovered.",
  58:"CJ-100 was skipped between CCSO-Q5 and Clarke-Q1.",
  109:"No unambiguous individual E-Silhouette review decision was recovered.",
  113:"FAC-RFT was skipped in the walkthrough sequence.",
  133:"FWS-DRLE-1 was identified as scoring, but the review explicitly withheld boundary-to-value geometry pending readable authority; no implementable final treatment was recovered.",
  158:"LSP physical regions and Weapon Library enhancement were identified, but the review explicitly withheld the exact scoring/course treatment pending a readable printed table.",
  161:"M16A2 was skipped between M16A1-SF and M4 Carbine.",
  203:"SN-1 was called Evidence Only while also being assigned a rectangle count; final capability is contradictory.",
  206:"SN-LOG was explicitly declared OOS, which conflicts with the fixed 254 executable-chair premise.",
  213:"ST. LOUIS-Q1 was skipped immediately before the separately named TCT decision.",
  225:"TQ-19E-AZ was not individually and unambiguously mapped in the walkthrough transcript.",
  226:"TQ-20 was not individually and unambiguously mapped in the walkthrough transcript.",
  227:"TQ-21 was not individually and unambiguously mapped in the walkthrough transcript.",
  228:"TQ-21-P1 was not individually and unambiguously mapped in the walkthrough transcript.",
  229:"TQ-21-P1-DC was not individually and unambiguously mapped in the walkthrough transcript.",
  230:"TQ-21-P3 was not individually and unambiguously mapped in the walkthrough transcript.",
}

IMPLEMENTATION_BLOCKER = {
  112:"The recovered FAC-1 decision requires an outer dark frame plus an inner white silhouette region, but both preserved local FAC-1 assets contain only a single solid silhouette. Exact region geometry cannot be registered without guessing or a missing source face.",
}

# Some decisions are cumulative conversations rather than a single assistant turn. Preserve
# every contributing turn so a short final lock cannot erase its supporting zone definitions.
TURN_RANGES = {
  5: list(range(203, 209)),
  224: list(range(555, 559)),
}

def load_transcript():
    records = {}
    for line in TRANSCRIPT.read_text().splitlines():
        if not line or line == "# END":
            continue
        row = json.loads(line)
        if "reviewIndex" in row:
            records[row["reviewIndex"]] = row
    return records

def current_capability(chair):
    value = chair.get("highestTruthfulCapability")
    return "Counts Only / Zone-Object Counting" if value == "Zone / Object Counting" else value

def capability_for(position):
    if position in SCORING: return "Scoring"
    if position in COUNTS: return "Counts Only / Zone-Object Counting"
    if position in EVIDENCE_ONLY: return "Evidence Only"
    if position in ZEROING: return "Zeroing"
    return "REVIEW DECISION NOT RECOVERED"

def normalized(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())

def current_contract_semantics(chair):
    path = DOCS / chair["contractPath"] if chair.get("contractPath") else None
    if not path or not path.is_file():
        return {"labels": [], "values": [], "regionIds": [], "contractPath": chair.get("contractPath")}
    contract = json.loads(path.read_text())
    rules = contract.get("components", {}).get("scoring", {}).get("definition", {}).get("regionRules") or {}
    labels, values = [], []
    for rule in rules.values():
        label = rule.get("label", rule.get("objectLabel"))
        if label is not None:
            labels.append(str(label))
        value = rule.get("value")
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            values.append(str(int(value)) if float(value).is_integer() else str(value))
    return {"labels": labels, "values": values, "regionIds": list(rules), "contractPath": chair.get("contractPath")}

def compare_semantics(capability, current, text, contract_semantics):
    issues = []
    if capability != current:
        issues.append(f"capability: {current} -> {capability}")
    review_normalized = normalized(text)
    for label in contract_semantics["labels"]:
        label_normalized = normalized(label)
        if label_normalized and label_normalized not in review_normalized:
            issues.append(f"current region label not established in recovered review: {label}")
    review_number_tokens = set(re.findall(r"(?<!\d)\d+(?:\.\d+)?(?!\d)", text))
    for value in contract_semantics["values"]:
        if value not in review_number_tokens:
            issues.append(f"current scoring value not established in recovered review: {value}")
    if capability in {"Scoring", "Counts Only / Zone-Object Counting"} and not contract_semantics["regionIds"]:
        issues.append("current contract has no executable reviewed regions/objects")
    return ("MATCH" if not issues else "MISMATCH"), issues

def evidence_fragments(text):
    clean = re.sub(r"\s+", " ", text).strip()
    bold = [re.sub(r"\s+", " ", item).strip() for item in re.findall(r"\*\*(.+?)\*\*", text, re.S)]
    zones = []
    for item in bold:
        if len(item) > 160 or item.lower() in {"locked", "lock it", "scoring", "counts only", "zone counting only"}:
            continue
        if item not in zones:
            zones.append(item)
    values = sorted(set(re.findall(r"(?<!\d)(?:100|50|10|9|8|7|6|5|4|3|2|1|0)(?=\s*(?:points?|pts?|/|·|→|=|$))", clean, re.I)))
    exclusions = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean) if re.search(r"\b(?:do not|no invented|not a|reference|outside|unknown|unreadable|without authority)\b", s, re.I)]
    return zones[:32], values, exclusions[:12]

def main():
    inventory = json.loads(AUTHORITY.read_text())["chairs"]
    transcript = load_transcript()
    rows = []
    for position, chair in enumerate(inventory, 1):
        capability = capability_for(position)
        review_index = TURN.get(position)
        source = transcript.get(review_index) if review_index is not None else None
        if position in UNRECOVERED_REASON:
            capability = "REVIEW DECISION NOT RECOVERED"
            source = None
        contributing = [transcript[index] for index in TURN_RANGES.get(position, []) if index in transcript]
        if not contributing and source:
            contributing = [source]
        text = "\n\n---\n\n".join(item["assistant"] for item in contributing)
        zones, values, exclusions = evidence_fragments(text)
        current = current_capability(chair)
        contract_semantics = current_contract_semantics(chair)
        comparison, comparison_issues = compare_semantics(capability, current, text, contract_semantics)
        if capability == "REVIEW DECISION NOT RECOVERED":
            comparison = "REVIEW DECISION NOT RECOVERED"
            comparison_issues = [UNRECOVERED_REASON[position]]
        rows.append({
            "catalogChair": position,
            "visualStackChair": chair["chair"],
            "qtCatalogId": chair["qtCatalogId"],
            "productName": chair["productName"],
            "founderHomieCapability": capability,
            "exactZonesObjectsFromReview": zones,
            "explicitScoringValuesFromReview": values,
            "specialRelationshipsInstructions": text,
            "explicitExclusionsUnknowns": exclusions,
            "provenance": ({
                "sourceThreadId":"6ab332a6-293c-83e9-a924-bdda67a4e523",
                "reviewIndices": [item["reviewIndex"] for item in contributing],
                "turnIds": [item["turnId"] for item in contributing],
                "startedAt": [item["startedAt"] for item in contributing],
            } if source else None),
            "currentImplementationCapabilityAt9f3c100": current,
            "currentImplementationSemanticsAt9f3c100": contract_semantics,
            "capabilityComparison": comparison,
            "comparisonIssues": comparison_issues,
            "requiredChange": (
                "Return to Founder/Homie; do not fill from legacy/current/family authority."
                if capability == "REVIEW DECISION NOT RECOVERED"
                else ("Rebind to recovered review and change capability/semantics." if comparison == "MISMATCH" else "Rebind provenance to recovered review; verify exact semantics independently.")
            ),
            "unrecoveredReason": UNRECOVERED_REASON.get(position),
            "implementationBlocker": IMPLEMENTATION_BLOCKER.get(position),
        })
    recovered = [r for r in rows if r["founderHomieCapability"] != "REVIEW DECISION NOT RECOVERED"]
    totals = Counter(r["founderHomieCapability"] for r in recovered)
    mismatches = [r for r in rows if r["capabilityComparison"] == "MISMATCH"]
    payload = {
        "schemaVersion":"sczn3.qt-founder-homie-review-reconciliation.v1",
        "authority":"Episode 64 Founder/Homie target-by-target conversation only",
        "excludedSemanticSources":["QT_HOMIE_254_CORRECTED_TREATMENTS.md","current Backend Authority","family defaults","commit 9f3c100 implementation behavior"],
        "chairs":254,
        "recoveredDecisionCount":len(recovered),
        "unrecoveredDecisionCount":254-len(recovered),
        "recoveredCapabilityTotals":dict(totals),
        "capabilityMismatchCount":len(mismatches),
        "rows":rows,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2) + "\n")
    md = [
        "# QT Founder/Homie 254 Review Reconciliation", "",
        f"- Recovered decisions: **{len(recovered)}/254**",
        f"- Review decisions not recovered: **{254-len(recovered)}**",
        f"- Capability mismatches against `9f3c100`: **{len(mismatches)}**",
        "- Semantic source: **Episode 64 Founder/Homie target-by-target conversation only**", "",
        "| Chair | QT chair | Identity | Target | Founder/Homie decision | Current | Compare | Provenance |",
        "|---:|---:|---|---|---|---|---|---|",
    ]
    for r in rows:
        prov = (", ".join(f"turn `{turn_id}`" for turn_id in r["provenance"]["turnIds"]) if r["provenance"] else "NOT RECOVERED")
        md.append(f"| {r['catalogChair']} | {r['visualStackChair']} | `{r['qtCatalogId']}` | {r['productName']} | {r['founderHomieCapability']} | {r['currentImplementationCapabilityAt9f3c100']} | {r['capabilityComparison']} | {prov} |")
    md += ["", "## Unrecovered decisions", ""]
    for r in rows:
        if r["unrecoveredReason"]:
            md.append(f"- **{r['catalogChair']} · {r['productName']}** — {r['unrecoveredReason']}")
    md += ["", "## Implementation blockers", ""]
    for r in rows:
        if r["implementationBlocker"]:
            md.append(f"- **{r['catalogChair']} · {r['productName']}** — {r['implementationBlocker']}")
    OUT_MD.write_text("\n".join(md) + "\n")
    print(json.dumps({k:payload[k] for k in ("recoveredDecisionCount","unrecoveredDecisionCount","recoveredCapabilityTotals","capabilityMismatchCount")}, indent=2))

if __name__ == "__main__":
    main()
