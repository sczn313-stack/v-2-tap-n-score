#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "SHOOTING_KNOWLEDGE.json").read_text())
REPORT = (ROOT / "REPORT.md").read_text()
LEDGER = (ROOT / "SOURCE_LEDGER.md").read_text()
REPORT_FLAT = " ".join(REPORT.split())

assert DATA["schemaVersion"] == "1.0.0"
assert DATA["revision"] == 2
assert DATA["corpus"]["publisherCount"] == 12
assert len(DATA["corpus"]["publishers"]) == 12
assert len(set(DATA["corpus"]["publishers"])) == 12
assert DATA["corpus"]["method"] == [
    "mine", "commonize", "reconcile", "synthesize", "deliver", "learn"
]
assert DATA["knowledgePhilosophy"]["publisherHierarchyForGeneralKnowledge"] is False
assert DATA["knowledgePhilosophy"]["deliveryStandard"] == (
    "SCZN3 always tells the truth to its audience."
)
assert DATA["whatSczn3NowKnows"]
assert DATA["commonizationGains"]
assert DATA["uncertainties"]
assert DATA["missingKnowledge"]

domains = DATA["domains"]
ids = [item["id"] for item in domains]
assert len(domains) >= 19
assert len(ids) == len(set(ids))
for item in domains:
    for required in ("id", "name", "strength", "synthesis", "limits", "primaryEvidence"):
        assert item.get(required), (item.get("id"), required)

required_report_terms = [
    "Fundamentals", "Accuracy and grouping", "Sight and optic use",
    "Trigger operation", "Grip and control", "Zeroing",
    "Diagnosing shot and group patterns", "Recoil management",
    "Speed versus accuracy", "Drills and repetition", "Progression",
    "Pistol knowledge", "Rifle knowledge", "Shotgun knowledge",
    "Competition preparation", "Qualification preparation",
    "Beginner knowledge", "Common problems and corrective actions",
    "WHAT SCZN3 NOW KNOWS",
    "WHAT BECAME STRONGER THROUGH COMMONIZATION",
    "WHAT CONFLICTS WERE RECONCILED",
    "WHAT REMAINS UNCERTAIN",
    "WHAT KNOWLEDGE IS STILL MISSING",
    "WHAT WE SHOULD DELIBERATELY LEARN NEXT"
]
for term in required_report_terms:
    assert term in REPORT, term

assert "MINE → COMMONIZE → RECONCILE → SYNTHESIZE → DELIVER → LEARN" in REPORT
assert "Shooter improvement is a learning loop" in REPORT_FLAT
assert "There is no governing-authority hierarchy for general shooting knowledge" in REPORT_FLAT
assert "Source recognition is not" in REPORT_FLAT
assert "does not" in REPORT.lower()
assert "12 preserved publisher" in REPORT
assert "Public visibility does not establish a license" in LEDGER

print(f"PASS: 12 publishers, {len(domains)} synthesized domains, "
      f"{len(DATA['reconciliations'])} reconciliations, "
      f"{len(DATA['nextResearch'])} next-research priorities")
