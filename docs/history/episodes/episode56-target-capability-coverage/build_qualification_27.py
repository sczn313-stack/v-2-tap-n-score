#!/usr/bin/env python3
"""Build the Founder-facing authority breakdown for the 27 qualification offerings."""

from __future__ import annotations

import json
import re
from pathlib import Path


OUT = Path(__file__).resolve().parent
SOURCE = OUT / "UNRECOGNIZED_69.json"

AUTHORITIES = {
    "navy": {
        "bucket": "Federal / military",
        "jurisdiction": "United States Navy — M4/M16 small-arms qualification",
        "owner": "Department of the Navy / current controlling Navy small-arms qualification instruction and subordinate authorized course material",
        "source": "https://www.secnav.navy.mil/doni/Directives/03000%20Naval%20Operations%20and%20Readiness/03-500%20Training%20and%20Readiness%20Services/3591.1G.pdf",
    },
    "fl_g": {
        "bucket": "State civilian licensing / regulated occupation",
        "jurisdiction": "Florida Class G statewide firearms license",
        "owner": "Florida Department of Agriculture and Consumer Services — current Chapter 493 firearms-training manual, licensed-instructor rules, and qualification/requalification requirements",
        "source": "https://www.fdacs.gov/Business-Services/Private-Investigation-Licenses/Class-G-Statewide-Firearm-License-Requirements",
    },
    "tennessee": {
        "bucket": "State civilian licensing / regulated occupation",
        "jurisdiction": "Tennessee armed-security firearms qualification association",
        "owner": "Tennessee Department of Commerce and Insurance / Private Protective Services — current approved course, instructor, weapon, range, and passing requirements",
        "source": "https://licenses.app.tn.gov/licenses/view?id=1062",
    },
    "kentucky": {
        "bucket": "State civilian licensing / regulated occupation",
        "jurisdiction": "Kentucky firearms qualification association",
        "owner": "Applicable Kentucky program authority must be identified first; then its current regulation, course, instructor, target, distance, round-count, and completion requirements",
        "source": "https://www.docjt.ky.gov/frequently-asked-questions",
    },
    "texas": {
        "bucket": "State civilian/licensing or law-enforcement association",
        "jurisdiction": "Texas B-27/B-27S qualification association",
        "owner": "Applicable Texas authority and claimant population must be identified; TCOLE, private-security, and other Texas qualifications are not interchangeable",
        "source": "https://www.tcole.texas.gov/document/officer_firearms_certificate.pdf",
    },
    "new_york": {
        "bucket": "State qualification association — exact program unresolved",
        "jurisdiction": "New York qualification target association",
        "owner": "The exact New York claimant population and current governing course must be identified—police, peace-officer, and armed-security training are distinct authorities",
        "source": "https://www.criminaljustice.ny.gov/ops/sgtraining/sgpquestion.htm",
    },
    "rhode_island": {
        "bucket": "State qualification association — exact program unresolved",
        "jurisdiction": "Rhode Island qualifying-target association",
        "owner": "The exact Rhode Island program owner and current course must be identified; catalog name and numbered bullseye do not establish police, licensing, or another qualification",
        "source": "https://rules.sos.ri.gov/regulations/part/270-30-00-2",
    },
    "fl_le": {
        "bucket": "State law-enforcement / agency standard",
        "jurisdiction": "Florida law-enforcement firearms qualification",
        "owner": "Florida Criminal Justice Standards and Training Commission / FDLE — current approved course, target equivalence, weapon-specific stages, score, instructor, range, record, and reporting requirements",
        "source": "https://www.fdle.state.fl.us/CJSTC/Documents/Rules-Forms/Table-1-Forms/PDFs/CJSTC-86A.aspx",
    },
    "georgia": {
        "bucket": "State law-enforcement / public-safety standard",
        "jurisdiction": "Georgia public-safety firearms qualification",
        "owner": "Georgia Peace Officer Standards and Training Council / Georgia Public Safety Training Center — current claimant-specific course, SQTA1 use, scoring, timing, instructor, and certification requirements",
        "source": "https://access.gpstc.org/student/classes/details?gpstcCode=MC2845",
    },
    "north_carolina": {
        "bucket": "State law-enforcement / agency standard",
        "jurisdiction": "North Carolina Justice Academy qualification association",
        "owner": "North Carolina Criminal Justice Education and Training Standards Commission / NC Justice Academy — current Commission-approved course and certified-instructor requirements",
        "source": "https://ncja.ncdoj.gov/wpfd_file/in-service-firearms-qualification-manual/",
    },
    "louisiana": {
        "bucket": "State law-enforcement / POST standard",
        "jurisdiction": "Louisiana POST firearms qualification",
        "owner": "Louisiana Peace Officer Standards and Training Council — current course, target/scoring rules, instructor certification, weapon, annual/pre-academy mode, and reporting requirements",
        "source": "https://lcle.la.gov/programs/post/",
    },
    "ohio": {
        "bucket": "State law-enforcement / OPOTA standard",
        "jurisdiction": "Ohio OPOTA/OPOTC qualification",
        "owner": "Ohio Peace Officer Training Commission / Ohio Peace Officer Training Academy — current course version, RQT-2 geometry/values, stages, timing, penalties, instructor determinations, and passing standard",
        "source": "https://www.ohioattorneygeneral.gov/Files/Law-Enforcement/Ohio-Peace-Officer-Training-Academy/OPOTA-news/Police-Rifle-Carbine-Qual-Course-of-Fire-Eff-1-1-2",
    },
    "ctq": {
        "bucket": "Publisher-described training / no government jurisdiction established",
        "jurisdiction": "Generic Command Training “Q” qualification and command training",
        "owner": "Baker or another identified rules owner must supply the exact qualification and command-drill rules; no government authority is established by the product page",
        "source": None,
    },
    "generic_q": {
        "bucket": "Qualification-form target / exact authority unresolved",
        "jurisdiction": "Generic Q/TQ target form; no official claimant population established",
        "owner": "First identify the claimed qualification and governing body; then obtain its current course. Product form, name, and qualification category cannot authorize an official result",
        "source": None,
    },
}


def authority_key(sku: str) -> str:
    if sku == "22460": return "navy"
    if sku.startswith("SL-B29-FloridaG"): return "fl_g"
    if sku in {"22590", "43020"}: return "tennessee"
    if sku == "53900": return "kentucky"
    if sku in {"53010", "53020"}: return "texas"
    if sku == "22120": return "new_york"
    if sku == "53600": return "rhode_island"
    if sku == "23190" or sku.startswith("SL-B21E-FLSHERIFF"): return "fl_le"
    if sku == "22210" or sku.startswith("SL-SQT-A1"): return "georgia"
    if sku == "53060": return "north_carolina"
    if sku == "53050": return "louisiana"
    if sku == "53510" or sku.startswith("SL-OPOTA-RQT2"): return "ohio"
    if sku.startswith("ST-CTQ"): return "ctq"
    if sku in {"22020", "23210"}: return "generic_q"
    raise KeyError(sku)


def printer_establishes(record: dict, key: str) -> str:
    base = "Exact publisher product identity, SKU, artwork/printed form, published dimensions, and catalog representation"
    if key == "fl_le":
        if record["publisher"] == "Baker Targets":
            return base + "; Baker expressly claims current Florida sheriff-office qualification use for this B21E product."
        return base + "; GunFun's categories/tags associate this B21E form with Florida qualification, but its product description supplies no exact sheriff or course claim."
    claims = {
        "navy": "; GunFun additionally describes it as a double-sided Navy M4/M16 qualification target with diagnostic/sighting content",
        "fl_g": "; Baker additionally identifies the Florida Class G use and links the Florida firearms-training manual",
        "tennessee": "; GunFun additionally associates the form and specified size with Tennessee qualification",
        "kentucky": "; GunFun additionally describes the B21F as a Kentucky qualifying target",
        "texas": "; GunFun categories/tags associate these B27S color variants with Texas qualification, although the product description supplies no course",
        "new_york": "; GunFun additionally claims two printed zones conform to New York qualifying-target requirements, without identifying the exact program",
        "rhode_island": "; GunFun additionally labels it a Rhode Island qualifying target, without identifying the exact program",
        "georgia": "; the publisher associates the form with Georgia public-safety qualification",
        "north_carolina": "; GunFun identifies an NCJA state-qualification-series target form",
        "louisiana": "; GunFun identifies the product as LA-POST and categorizes it as Louisiana qualification",
        "ohio": "; the publisher identifies the OPOTA/RQT-2 product as an Ohio qualification target",
        "ctq": "; Baker says the same target supports qualification and command training, but publishes no complete governed course",
        "generic_q": "; GunFun labels/categorizes the printed Q/TQ form as a qualification product, but establishes no governing body or course",
    }
    return base + claims[key] + "."


def additional_capability(record: dict, key: str) -> str:
    core = "A versioned Qualification Profile plus executor for stages, distances, rounds, timing/commands, scoring, penalties, thresholds, weapon/course mode, reconciliation, and PASS/FAIL"
    official = "; an official claim additionally requires governed claimant identity, authorized instructor/range/agency attestations, course-version proof, administration conditions, and any required external filing"
    if key == "navy":
        return core + official + "; compose CF-11 diagnostic authority separately where exact Navy authority permits it."
    if key == "ctq":
        return core + "; compose CF-13 command orchestration separately; without an identified government owner, label only the publisher-authorized practice/training result."
    if key == "generic_q":
        return "No official qualification capability can be admitted until the claimant program and authority are identified; after that, use the same versioned Qualification Profile/executor and claim-grade controls."
    return core + official + "."


data = json.loads(SOURCE.read_text())
records = [record for record in data["records"] if "CF-12" in record["allMissingFamilyIds"]]
assert len(records) == 27

for record in records:
    key = authority_key(record["sku"])
    authority = AUTHORITIES[key]
    record["authorityClassification"] = {
        "bucket": authority["bucket"],
        "jurisdictionOrProgram": authority["jurisdiction"],
        "externalAuthorityNeeded": authority["owner"],
        "officialSourceReference": authority["source"],
    }
    record["printerEstablishes"] = printer_establishes(record, key)
    record["sczn3AlreadyRecognizes"] = "Registered publisher-product identity; governed evidence image and visible-shot observations; backend-authoritative observation reconciliation; Universal SEC; preservation and exact reopen. Geometry or numeric scoring remains available only when separately authorized."
    record["evidenceOnlyExperienceToday"] = "Open the exact registered product, capture/load evidence, record visible shot observations, preserve an evidence-only SEC, and explicitly make no official course, score, PASS/FAIL, certification, or agency-compliance claim."
    record["officialQualificationAddition"] = additional_capability(record, key)
    record["composition"] = ["CF-12"] + [family for family in record["allMissingFamilyIds"] if family != "CF-12"]

bucket_order = list(dict.fromkeys(authority["bucket"] for authority in AUTHORITIES.values()))
records.sort(key=lambda record: (bucket_order.index(record["authorityClassification"]["bucket"]), record["authorityClassification"]["jurisdictionOrProgram"], record["publisher"], record["sku"]))

bucket_summary = []
for bucket in bucket_order:
    subset = [record for record in records if record["authorityClassification"]["bucket"] == bucket]
    if not subset:
        continue
    bucket_summary.append({
        "bucket": bucket,
        "offerings": len(subset),
        "lineages": len({record["canonicalProductLineage"] for record in subset}),
        "skus": [record["sku"] for record in subset],
    })

assert sum(item["offerings"] for item in bucket_summary) == 27
assert len({record["canonicalProductLineage"] for record in records}) == 21
assert sum(len(record["composition"]) > 1 for record in records) == 3

def rollup_name(bucket: str) -> str:
    if bucket == "Federal / military":
        return bucket
    if bucket.startswith("State law-enforcement"):
        return "State law-enforcement / agency"
    if bucket.startswith("State civilian") or bucket.startswith("State qualification"):
        return "State civilian/licensing or state-associated qualification"
    return "Publisher-described or qualification-form — official authority unresolved"


rollup_summary = []
for rollup in [
    "Federal / military",
    "State civilian/licensing or state-associated qualification",
    "State law-enforcement / agency",
    "Publisher-described or qualification-form — official authority unresolved",
]:
    subset = [record for record in records if rollup_name(record["authorityClassification"]["bucket"]) == rollup]
    rollup_summary.append({
        "group": rollup,
        "offerings": len(subset),
        "lineages": len({record["canonicalProductLineage"] for record in subset}),
    })
assert [item["offerings"] for item in rollup_summary] == [1, 9, 13, 4]
assert [item["lineages"] for item in rollup_summary] == [1, 8, 9, 3]

result = {
    "analysisId": "EP56-QUALIFICATION-27-AUTHORITY-BREAKDOWN-V1",
    "status": "founder_review",
    "implementationPerformed": False,
    "population": {"offerings": 27, "canonicalProductLineages": 21},
    "conclusion": {
        "oneReusableFamilySupported": True,
        "finding": "Current evidence supports one reusable Qualification Executor driven by versioned Course/Qualification Profiles, not jurisdiction-specific executors.",
        "compositions": ["CF-12 alone", "CF-12 + CF-11 diagnostic (GunFun 22460)", "CF-12 + CF-13 command orchestration (Baker ST-CTQ base/bulk)"],
        "claimGrades": ["evidence_only", "practice_or_simulation", "official_qualification_when_all_external_authority_and administration conditions are satisfied"],
        "separateConcern": "Official issuance/attestation and external agency reporting are claim-governance concerns layered over the executor; an SEC calculation alone does not create a government credential.",
    },
    "authorityRollup": rollup_summary,
    "bucketSummary": bucket_summary,
    "records": records,
}
(OUT / "QUALIFICATION_27_AUTHORITY_BREAKDOWN.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")


def esc(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


lines = [
    "# Government and Qualification Target Authority Breakdown",
    "",
    "**Status:** Founder review; inspection only  ",
    "**Population:** 27 offerings / 21 product lineages  ",
    "**Implementation:** None",
    "",
    "## Governed answer",
    "",
    "> **The evidence supports one reusable Qualification Executor driven by versioned Course/Qualification Profiles—not government-specific target implementations. Jurisdiction changes the authority package and official-claim conditions, not the fundamental execution family.**",
    "",
    "Two explicit compositions sit on that core: GunFun Navy Qual `22460` adds CF-11 diagnostic authority, while Baker CTQ base/bulk adds CF-13 command orchestration. A third concern—official administration, attestation, and external reporting—is a claim-governance layer, not permission for SCZN3 to turn a computed score into a government credential.",
    "",
    "## Population by authority type",
    "",
    "| Authority grouping | Offerings | Product lineages |",
    "|---|---:|---:|",
]
for item in rollup_summary:
    lines.append(f"| {esc(item['group'])} | {item['offerings']} | {item['lineages']} |")
lines.extend([
    "| **Total** | **27** | **21** |",
    "",
    "## What SCZN3 may claim",
    "",
    "| Claim grade | Truthful result | Required boundary |",
    "|---|---|---|",
    "| Evidence only | Visible observations were recorded against this exact publisher product. | Available now through registered evidence capture; no qualification claim. |",
    "| Practice/simulation | The shooter completed a named practice run using a specific Course Profile, with computed score/result. | Requires complete, versioned course authority and must be unmistakably labeled non-official where administration requirements are unmet. |",
    "| Official qualification | The identified shooter completed the controlling course under all required conditions and achieved its governed result. | Requires current government/agency authority, authorized administration and attestations, claimant/weapon/course identity, complete evidence, and any required external record/reporting. |",
    "",
    "## Complete 27-offering breakdown",
    "",
])

for bucket in bucket_order:
    subset = [record for record in records if record["authorityClassification"]["bucket"] == bucket]
    if not subset:
        continue
    lines.extend([
        f"### {bucket}",
        "",
        "| Publisher product | SKU | Jurisdiction/program | Printer establishes | External authority needed for official claim | Today | Missing reusable capability |",
        "|---|---|---|---|---|---|---|",
    ])
    for record in subset:
        authority = record["authorityClassification"]
        authority_text = authority["externalAuthorityNeeded"]
        if authority["officialSourceReference"]:
            authority_text += f" ([official reference]({authority['officialSourceReference']}))"
        lines.append(
            f"| [{esc(record['exactProductName'])}]({record['publisherProductLink']}) ({record['publisher']}) | `{esc(record['sku'])}` | {esc(authority['jurisdictionOrProgram'])} | {esc(record['printerEstablishes'])} | {esc(authority_text)} | {esc(record['evidenceOnlyExperienceToday'])} | {esc(record['officialQualificationAddition'])} |"
        )
    lines.append("")

lines.extend([
    "## Reusable Qualification Profile — minimum authority shape",
    "",
    "A single executor remains plausible if every course definition supplies, fails closed on, and versions at least:",
    "",
    "- governing body, program, claimant class, status, source, revision, and effective dates;",
    "- exact eligible target profile/edition and scoring geometry;",
    "- course mode, weapon/ammunition constraints, range and distance conditions;",
    "- stages, order, starting conditions, positions, commands, time windows, rounds, reloads, and target allocation;",
    "- scoring, penalties, incomplete/extra/late-shot treatment, aggregation, and passing threshold;",
    "- authorized administrator/instructor, witness and facility requirements;",
    "- attempt, remediation, requalification, and validity rules;",
    "- required attestations, records, signatures, and external reporting;",
    "- result vocabulary and claim grade: evidence-only, practice/simulation, or official qualification.",
    "",
    "## Subfamily decision",
    "",
    "No jurisdiction in this 27 presently proves a materially different qualification execution family. Federal versus state, police versus security, pistol versus rifle, and different scoring thresholds are Course Profile data and authority provenance. Diagnostic feedback and command orchestration remain independently composed capabilities. Official credential issuance or mandatory agency filing must remain outside the Qualification Executor unless separately authorized and integrated.",
    "",
    "The unresolved Q/TQ forms are the strongest fail-closed test: a qualification-looking target may be registered and used for evidence, but it cannot receive an official course merely because its artwork resembles a familiar standard.",
    "",
    "No government rules were implemented. No application architecture, target registration, QR asset, catalog state, production state, commit, push, or deployment changed.",
])
(OUT / "QUALIFICATION_27_AUTHORITY_BREAKDOWN.md").write_text("\n".join(lines) + "\n")

print(json.dumps({"offerings": len(records), "lineages": len({record['canonicalProductLineage'] for record in records}), "buckets": bucket_summary}, indent=2))
