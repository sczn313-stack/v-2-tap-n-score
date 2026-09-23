#!/usr/bin/env python3
"""Apply Homie's authoritative corrected QT 254 treatments without reinterpretation."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from collections import Counter
from copy import deepcopy
from pathlib import Path


DOCS = Path(__file__).resolve().parents[1]
PACKET_DIR = DOCS / "authority-evidence/platform/qt-episode64-homie-locked-treatment-2026-09-23"
PACKET = PACKET_DIR / "QT_HOMIE_254_CORRECTED_TREATMENTS.md"
AUTHORITY = DOCS / "backend/target_knowledge/qt_episode64_smart_target_authority.json"
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))
from target_execution_contract import component_digest, validate_contract  # noqa: E402

MANIFEST = DOCS / "authority-evidence/platform/qt-episode64-smart-target-completion-2026-09-22/QT_EP64_254_IMPLEMENTATION_MANIFEST.json"
LEG3 = DOCS / "authority-evidence/platform/qt-printer13-leg3-execution-2026-09-22/QT_LEG3_EXECUTION_MANIFEST.json"
RECONCILIATION = PACKET_DIR / "QT_HOMIE_254_CORRECTED_IMPLEMENTATION_RECONCILIATION.json"
SELECTOR = PACKET_DIR / "QT_FOUNDER_254_EXECUTABLE_SELECTOR.html"

EXPECTED_SHA256 = "ac73166e47bd17ca76882d27260b7528419f2b174ea4d0bc1b4ef8cfdb6daa44"
EXPECTED_CAPABILITIES = {
    "Zone / Object Counting": 154,
    "Evidence Only": 63,
    "Scoring": 36,
    "Zeroing": 1,
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def plain(value: str) -> str:
    return value.replace("`", "").replace("*", "").strip()


def field(block: str, label: str, *, required: bool = True) -> str | None:
    match = re.search(rf"^- \*\*{re.escape(label)}:\*\*\s*(.+?)\s*$", block, re.MULTILINE)
    if match:
        return match.group(1).strip()
    if required:
        raise AssertionError(f"packet field missing: {label}")
    return None


def csv_field(value: str | None) -> list[str]:
    if not value:
        return []
    cleaned = plain(value)
    if cleaned.lower() in {"none", "none stored", "n/a"}:
        return []
    return [item.strip() for item in cleaned.split(",") if item.strip()]


def parse_identity(value: str) -> dict:
    cleaned = plain(value)
    match = re.match(
        r"(?P<id>QT-PRODUCT-\d+)\s*\|\s*SKU:\s*(?P<sku>.*?)\s*\|\s*image:\s*(?P<image>\S+)\s*\|\s*SHA-256:\s*(?P<sha>[a-f0-9]{64})$",
        cleaned,
    )
    if not match:
        raise AssertionError(f"packet identity syntax invalid: {value}")
    return match.groupdict()


def parse_packet() -> list[dict]:
    actual_sha = sha256(PACKET)
    if actual_sha != EXPECTED_SHA256:
        raise AssertionError(f"packet SHA-256 mismatch: {actual_sha}")
    text = PACKET.read_text(encoding="utf-8")
    headings = list(re.finditer(r"^## (\d+)/254 — QT #(\d+) — (.+?)\s*$", text, re.MULTILINE))
    if len(headings) != 254:
        raise AssertionError(f"packet must contain 254 chairs, found {len(headings)}")
    records = []
    for index, heading in enumerate(headings):
        block = text[heading.end() : headings[index + 1].start() if index + 1 < len(headings) else len(text)]
        identity = parse_identity(field(block, "Identity"))
        record = {
            "catalogChair": int(heading.group(1)),
            "visualStackChair": int(heading.group(2)),
            "productName": heading.group(3).strip(),
            "qtCatalogId": identity["id"],
            "sku": identity["sku"],
            "imageFilename": identity["image"],
            "imageSha256": identity["sha"],
            "publisherEvidence": plain(field(block, "Publisher/catalog evidence")),
            "storedGoverningRule": plain(field(block, "Stored governing rule")),
            "capability": plain(field(block, "Homie capability")),
            "intelligenceFamily": plain(field(block, "SCZN3 family")),
            "labels": csv_field(field(block, "Explicit governed labels", required=False)),
            "values": csv_field(field(block, "Explicit governed values", required=False)),
            "regionIds": csv_field(field(block, "Registered semantic regions/objects", required=False)),
            "codyAction": plain(field(block, "Cody action")),
            "geometryInstruction": plain(field(block, "Geometry instruction")),
            "authorityLimit": plain(field(block, "Authority limit / unresolved")),
            "forbiddenInference": csv_field(field(block, "Forbidden inference")),
            "requiredPersistence": plain(field(block, "Required persistence")),
        }
        records.append(record)
    if [row["catalogChair"] for row in records] != list(range(1, 255)):
        raise AssertionError("packet catalog chair order is not 1..254")
    if len({row["qtCatalogId"] for row in records}) != 254:
        raise AssertionError("packet identities are not unique")
    counts = Counter(row["capability"] for row in records)
    if dict(counts) != EXPECTED_CAPABILITIES:
        raise AssertionError(f"packet capability counts differ from Founder lock: {dict(counts)}")
    return records


def normalized(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def contract_facts(contract: dict) -> tuple[list[str], list[str], list[str]]:
    scoring = contract.get("components", {}).get("scoring", {}).get("definition", {})
    rules = scoring.get("regionRules") or {}
    region_ids = list(rules)
    labels = []
    values = []
    for rule in rules.values():
        label = rule.get("label", rule.get("objectLabel"))
        if label is not None:
            labels.append(str(label))
        value = rule.get("value")
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            values.append(str(int(value)) if float(value).is_integer() else str(value))
    return region_ids, labels, values


def audit(records: list[dict]) -> dict:
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    authority_by_id = {row["qtCatalogId"]: row for row in authority["chairs"]}
    packet_ids = {row["qtCatalogId"] for row in records}
    identity_gaps = sorted(packet_ids.symmetric_difference(authority_by_id))
    differences = []
    asset_failures = []
    region_failures = []
    label_failures = []
    value_failures = []
    contract_failures = []
    for record in records:
        current = authority_by_id.get(record["qtCatalogId"])
        if not current:
            continue
        fields = {
            "visualStackChair": (current.get("chair"), record["visualStackChair"]),
            "productName": (current.get("productName"), record["productName"]),
            "imageSha256": (current.get("assetSha256"), record["imageSha256"]),
            "capability": (current.get("highestTruthfulCapability"), record["capability"]),
            "intelligenceFamily": (current.get("intelligenceFamily"), record["intelligenceFamily"]),
        }
        changed = {key: {"current": old, "corrected": new} for key, (old, new) in fields.items() if old != new}
        if changed:
            differences.append({"qtCatalogId": record["qtCatalogId"], "productName": record["productName"], "differences": changed})
        asset_path = DOCS / current["assetPath"]
        if not asset_path.is_file() or asset_path.name != record["imageFilename"] or sha256(asset_path) != record["imageSha256"]:
            asset_failures.append({
                "qtCatalogId": record["qtCatalogId"],
                "packetFilename": record["imageFilename"],
                "authorityPath": current["assetPath"],
                "packetSha256": record["imageSha256"],
                "actualSha256": sha256(asset_path) if asset_path.is_file() else None,
            })
        authority_regions = [region["regionId"] for region in (current.get("geometry", {}).get("regions") or [])]
        treatment_regions = current.get("smartTargetTreatment", {}).get("truthLayers", {}).get("targetStructure", {}).get("registeredRegionIds") or []
        if record["regionIds"] and (record["regionIds"] != authority_regions or record["regionIds"] != treatment_regions):
            region_failures.append({
                "qtCatalogId": record["qtCatalogId"],
                "packet": record["regionIds"],
                "authorityGeometry": authority_regions,
                "currentTreatment": treatment_regions,
            })
        contract_path = DOCS / current["contractPath"] if current.get("contractPath") else None
        if not contract_path:
            if record["capability"] != "Zeroing":
                contract_failures.append({"qtCatalogId": record["qtCatalogId"], "reason": "missing_contract_path"})
            continue
        if not contract_path.is_file():
            contract_failures.append({"qtCatalogId": record["qtCatalogId"], "reason": "contract_file_missing", "path": str(contract_path)})
            continue
        contract = json.loads(contract_path.read_text(encoding="utf-8"))
        contract_regions, contract_labels, contract_values = contract_facts(contract)
        if record["regionIds"] and contract_regions != record["regionIds"]:
            contract_failures.append({"qtCatalogId": record["qtCatalogId"], "reason": "region_rules", "packet": record["regionIds"], "contract": contract_regions})
        if Counter(map(normalized, contract_labels)) != Counter(map(normalized, record["labels"])):
            label_failures.append({"qtCatalogId": record["qtCatalogId"], "packet": record["labels"], "contract": contract_labels})
        if set(contract_values) != set(record["values"]):
            value_failures.append({"qtCatalogId": record["qtCatalogId"], "packet": record["values"], "contract": contract_values})
    return {
        "packetSha256": sha256(PACKET),
        "packetChairs": len(records),
        "packetCapabilityCounts": dict(Counter(row["capability"] for row in records)),
        "packetFamilyCounts": dict(Counter(row["intelligenceFamily"] for row in records)),
        "authorityChairs": len(authority["chairs"]),
        "identityGaps": identity_gaps,
        "assetFailures": asset_failures,
        "regionBindingFailures": region_failures,
        "labelBindingFailures": label_failures,
        "valueBindingFailures": value_failures,
        "contractFailures": contract_failures,
        "changedIdentityCapabilityOrFamily": differences,
    }


def corrected_treatment(record: dict, prior: dict) -> dict:
    treatment = deepcopy(prior)
    treatment["schemaVersion"] = "sczn3-episode64-homie-corrected-treatment-v3"
    treatment["intelligenceFamily"] = record["intelligenceFamily"]
    treatment["highestTruthfulCapability"] = record["capability"]
    publisher = treatment["truthLayers"]["publisherTruth"]
    publisher["publishedRuleAuthority"] = {
        "source": f"Homie corrected treatment packet {EXPECTED_SHA256}",
        "packetPath": str(PACKET.relative_to(DOCS)),
        "publisherCatalogEvidence": record["publisherEvidence"],
        "rule": record["storedGoverningRule"],
    }
    publisher["publishedValuesAvailable"] = bool(record["values"])
    publisher["unresolved"] = record["authorityLimit"]
    publisher["artworkFacts"] = {
        "values": record["values"],
        "labels": record["labels"],
        "authorityClass": "homie_verified_source_artwork_and_stored_authority",
    }
    structure = treatment["truthLayers"]["targetStructure"]
    structure["registeredGeometryStatus"] = "regions_available" if record["regionIds"] else "no_governed_regions"
    structure["registeredRegionCount"] = len(record["regionIds"])
    structure["registeredRegionIds"] = record["regionIds"]
    treatment["accounting"]["meaningfulBreakdown"] = (
        "score_and_regions" if record["capability"] == "Scoring"
        else "regions_or_objects" if record["capability"] == "Zone / Object Counting"
        else "governed_zeroing" if record["capability"] == "Zeroing"
        else "measured_shot_pattern"
    )
    treatment["result"]["publisherScore"] = record["capability"] == "Scoring"
    treatment["result"]["regionObjectBreakdown"] = record["capability"] in {"Scoring", "Zone / Object Counting"}
    treatment["progress"]["scoreHistoryWhenGoverned"] = record["capability"] == "Scoring"
    treatment["unsupported"] = list(dict.fromkeys(normalized(item) for item in record["forbiddenInference"]))
    treatment["smartBehavior"] = record["codyAction"]
    treatment["homieFounderLock"] = {
        "status": "FOUNDER_LOCKED_CORRECTED",
        "packetPath": str(PACKET.relative_to(DOCS)),
        "packetSha256": EXPECTED_SHA256,
        "catalogChair": record["catalogChair"],
        "visualStackChair": record["visualStackChair"],
        "governingRule": "Homie defines target semantics; Cody implements without reinterpretation.",
    }
    treatment["homieCorrectedTreatment"] = {
        "identity": {
            "qtCatalogId": record["qtCatalogId"],
            "productName": record["productName"],
            "sku": record["sku"],
            "imageFilename": record["imageFilename"],
            "imageSha256": record["imageSha256"],
        },
        "publisherCatalogEvidence": record["publisherEvidence"],
        "storedGoverningRule": record["storedGoverningRule"],
        "capability": record["capability"],
        "intelligenceFamily": record["intelligenceFamily"],
        "explicitGovernedLabels": record["labels"],
        "explicitGovernedValues": record["values"],
        "registeredSemanticRegionObjectIds": record["regionIds"],
        "requiredBehavior": record["codyAction"],
        "geometryInstruction": record["geometryInstruction"],
        "authorityLimitOrUnresolved": record["authorityLimit"],
        "forbiddenInference": record["forbiddenInference"],
        "requiredPersistence": record["requiredPersistence"],
    }
    return treatment


def write_selector(records: list[dict], authority_by_id: dict[str, dict]) -> None:
    options = []
    surfaces = []
    for record in records:
        row = authority_by_id[record["qtCatalogId"]]
        surfaces.append({
            "position": record["catalogChair"],
            "visualStackChair": record["visualStackChair"],
            "productName": record["productName"],
            "qtCatalogId": record["qtCatalogId"],
            "capability": record["capability"],
            "family": record["intelligenceFamily"],
            "targetProfileId": row["targetProfileId"],
            "missionFamily": row["missionFamily"],
        })
        options.append(f'<option value="{record["catalogChair"] - 1}">{record["catalogChair"]}/254 · QT #{record["visualStackChair"]} · {html.escape(record["productName"])}</option>')
    data = json.dumps(surfaces, separators=(",", ":")).replace("</", "<\\/")
    SELECTOR.write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QT · Founder 254 Corrected Treatment Selector</title><style>*{{box-sizing:border-box}}html,body{{height:100%;margin:0;background:#080b10;color:#f5f7fa;font:13px system-ui,sans-serif}}body{{display:grid;grid-template-rows:auto minmax(0,1fr)}}header{{display:grid;grid-template-columns:auto minmax(220px,1fr) minmax(260px,auto);gap:8px;align-items:center;padding:8px;background:#101722;border-bottom:1px solid #334155}}.nav{{display:flex;align-items:center;gap:7px}}button,.launch{{min-height:38px;border:1px solid #80671c;border-radius:6px;background:#e4bd45;color:#111827;padding:7px 12px;font-weight:900;cursor:pointer;text-decoration:none}}button:disabled{{opacity:.42;cursor:not-allowed}}#progress{{min-width:112px;text-align:center;color:#f1cc62;font-size:15px;font-weight:900}}select{{width:100%;min-height:38px;border:1px solid #465568;border-radius:6px;background:#151f2b;color:#fff;padding:6px 9px;font-weight:750}}.identity{{min-width:0;text-align:right}}.identity strong,.identity small{{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}.identity small{{color:#aeb9c8}}iframe{{width:100%;height:100%;border:0;background:#080b10}}@media(max-width:760px){{header{{grid-template-columns:1fr}}.nav{{justify-content:space-between}}.identity{{text-align:left}}.launch{{display:block;text-align:center}}}}</style></head><body><header><div class="nav"><button id="previous">PREVIOUS ←</button><strong id="progress">Founder 1/254</strong><button id="next">→ NEXT</button></div><select id="selector" aria-label="Select one of 254 QT targets">{''.join(options)}</select><div class="identity"><strong id="name"></strong><small id="detail"></small><a class="launch" id="launch" target="_blank" rel="noopener">OPEN TARGET ↗</a></div></header><iframe id="experience" title="Selected QT executable Smart Target"></iframe><script>const surfaces={data};const selector=document.getElementById("selector"),experience=document.getElementById("experience"),progress=document.getElementById("progress"),previous=document.getElementById("previous"),next=document.getElementById("next"),launch=document.getElementById("launch"),name=document.getElementById("name"),detail=document.getElementById("detail");let index=0;function url(s){{return s.capability==="Zeroing"?`../../../shoot.html?target_profile_id=${{encodeURIComponent(s.targetProfileId)}}&missionFamily=zeroingCorrection&authorityPort=8118`:`../../../target-experience.html?missionFamily=${{encodeURIComponent(s.missionFamily)}}&target=${{encodeURIComponent(s.targetProfileId)}}&source=registered&authorityPort=8118&v=qt-homie-corrected-254`;}}function render(){{const s=surfaces[index],href=url(s);selector.value=String(index);progress.textContent=`Founder ${{index+1}}/${{surfaces.length}}`;name.textContent=s.productName;detail.textContent=`QT #${{s.visualStackChair}} · ${{s.capability}} · ${{s.family.replaceAll("_"," ")}}`;launch.href=href;previous.disabled=index===0;next.disabled=index===surfaces.length-1;experience.src=href;history.replaceState(null,"",`#chair-${{index+1}}`);}}function move(delta){{const n=index+delta;if(n<0||n>=surfaces.length)return;index=n;render();}}previous.onclick=()=>move(-1);next.onclick=()=>move(1);selector.onchange=()=>{{index=Number(selector.value);render();}};document.addEventListener("keydown",event=>{{if(event.target===selector)return;if(event.key==="ArrowLeft")move(-1);if(event.key==="ArrowRight")move(1);}});const requested=Number((location.hash.match(/chair-(\d+)/)||[])[1]);if(Number.isInteger(requested)&&requested>=1&&requested<=254)index=requested-1;render();</script></body></html>''', encoding="utf-8")


def apply(records: list[dict], report: dict) -> None:
    blocking = [
        "identityGaps", "assetFailures", "regionBindingFailures", "labelBindingFailures",
        "valueBindingFailures", "contractFailures",
    ]
    failures = {name: report[name] for name in blocking if report[name]}
    if failures:
        raise AssertionError(f"corrected packet conflicts with current Backend Authority: {failures}")
    authority = json.loads(AUTHORITY.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    leg3 = json.loads(LEG3.read_text(encoding="utf-8"))
    authority_by_id = {row["qtCatalogId"]: row for row in authority["chairs"]}
    surface_by_id = {row["qtCatalogId"]: row for row in leg3["surfaces"]}
    changed = []
    updated_rows = []
    for record in records:
        row = deepcopy(authority_by_id[record["qtCatalogId"]])
        prior_capability = row["highestTruthfulCapability"]
        treatment = corrected_treatment(record, row["smartTargetTreatment"])
        row["intelligenceFamily"] = record["intelligenceFamily"]
        row["highestTruthfulCapability"] = record["capability"]
        row["smartTargetTreatment"] = treatment
        row["homieCorrectedTreatmentRecord"] = deepcopy(record)
        contract_path = DOCS / row["contractPath"] if row.get("contractPath") else None
        if contract_path:
            contract = json.loads(contract_path.read_text(encoding="utf-8"))
            contract["authorityContractVersion"] = "QT-EPISODE64-HOMIE-CORRECTED-v3"
            contract["approval"] = {
                "status": "approved",
                "authorityId": "QT_EPISODE64_HOMIE_CORRECTED_AUTHORITY_2026_09_23",
                "approvedAt": "2026-09-23T00:00:00-04:00",
            }
            product = contract["targetProfile"]["product"]
            product["episode64IntelligenceFamily"] = record["intelligenceFamily"]
            product["homieLockedCapability"] = record["capability"]
            product["homieCorrectedPacketSha256"] = EXPECTED_SHA256
            mission = contract["components"]["mission"]["definition"]
            mission["smartTargetTreatment"] = treatment
            mission.setdefault("capabilityStates", {})["officialScore"] = {
                "status": "available" if record["capability"] == "Scoring" else "not_applicable"
            }
            scoring = contract["components"]["scoring"]["definition"]
            scoring["publisherRuleAuthority"] = treatment["truthLayers"]["publisherTruth"]["publishedRuleAuthority"]
            scoring["homieCorrectedArtworkFacts"] = {
                "packetSha256": EXPECTED_SHA256,
                "values": record["values"],
                "labels": record["labels"],
                "regionObjectIds": record["regionIds"],
                "storedGoverningRule": record["storedGoverningRule"],
            }
            for component in contract["components"].values():
                component["digest"] = component_digest(component)
            contract.pop("contractFingerprint", None)
            validated = validate_contract(contract)
            contract_path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
            row["contractSha256"] = sha256(contract_path)
            row["contractFingerprint"] = validated["contractFingerprint"]
        if prior_capability != record["capability"]:
            changed.append({
                "catalogChair": record["catalogChair"], "visualStackChair": record["visualStackChair"],
                "qtCatalogId": record["qtCatalogId"], "productName": record["productName"],
                "from": prior_capability, "to": record["capability"],
            })
        surface = surface_by_id[record["qtCatalogId"]]
        surface["executionCapability"] = record["capability"]
        updated_rows.append(row)
    authority["schemaVersion"] = "sczn3-qt-episode64-homie-corrected-authority-v3"
    authority["authorityId"] = "QT_EPISODE64_HOMIE_CORRECTED_AUTHORITY_2026_09_23"
    authority["status"] = "HOMIE_CORRECTED_IMPLEMENTED_PENDING_VERIFICATION"
    authority["catalogAuthority"] = {
        "path": str(PACKET.relative_to(DOCS)),
        "sha256": EXPECTED_SHA256,
        "governingRule": "Homie defines target semantics; Cody implements without reinterpretation.",
        "founderLocked": True,
        "reviewedChairs": 254,
        "inventedRules": 0,
    }
    authority["chairs"] = updated_rows
    authority["capabilityCounts"] = dict(Counter(row["capability"] for row in records))
    authority["intelligenceFamilyCounts"] = dict(Counter(row["intelligenceFamily"] for row in records))
    authority.pop("verification", None)
    authority.pop("exceptions", None)
    AUTHORITY.write_text(json.dumps(authority, indent=2) + "\n", encoding="utf-8")
    leg3["capabilityCounts"] = authority["capabilityCounts"]
    LEG3.write_text(json.dumps(leg3, indent=2) + "\n", encoding="utf-8")
    reconciliation = {
        "schemaVersion": "sczn3-qt-homie-corrected-implementation-reconciliation-v1",
        "status": "IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION",
        "packetPath": str(PACKET.relative_to(DOCS)),
        "packetSha256": EXPECTED_SHA256,
        "chairs": 254,
        "contracts": 253,
        "inheritedZeroing": 1,
        "capabilityCounts": authority["capabilityCounts"],
        "intelligenceFamilyCounts": authority["intelligenceFamilyCounts"],
        "changedChairCount": len(changed),
        "changedChairs": changed,
        "implementationConflicts": [],
        "unresolvedTreatmentConflicts": [],
    }
    RECONCILIATION.write_text(json.dumps(reconciliation, indent=2) + "\n", encoding="utf-8")
    manifest.update({
        "schemaVersion": "sczn3-qt-episode64-homie-corrected-implementation-manifest-v3",
        "status": "HOMIE_CORRECTED_IMPLEMENTED_PENDING_VERIFICATION",
        "capabilityCounts": authority["capabilityCounts"],
        "intelligenceFamilyCounts": authority["intelligenceFamilyCounts"],
        "homieCatalogPath": str(PACKET.relative_to(DOCS)),
        "homieCatalogSha256": EXPECTED_SHA256,
        "reconciliationPath": str(RECONCILIATION.relative_to(DOCS)),
        "reviewPath": str(SELECTOR.relative_to(DOCS)),
    })
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    write_selector(records, {row["qtCatalogId"]: row for row in updated_rows})
    print(json.dumps(reconciliation, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate and reconcile without writing")
    args = parser.parse_args()
    records = parse_packet()
    report = audit(records)
    if args.check:
        print(json.dumps(report, indent=2))
        return
    apply(records, report)


if __name__ == "__main__":
    main()
