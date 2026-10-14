#!/usr/bin/env python3
"""Apply GitHub Issue #4's two governed GunFun fleet treatments."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path

from target_execution_contract import component_digest


ROOT = Path(__file__).resolve().parent
CONTRACTS = ROOT / "target_execution_contracts" / "contracts"
EVIDENCE = ROOT.parent / "authority-evidence" / "gunfun" / "episode64-issue4-sink-games"

SPECS = {
    "gunfun_21110_sink_a_sub": {
        "contract": "gunfun_21110_sink_a_sub_smart_evidence_v1.json",
        "masterNumber": 192,
        "name": "Sink-A-Sub",
        "objectNoun": "submarine",
        "objectPlural": "submarines",
        "dimensions": [23.0, 35.0],
        "radiusInches": 2.0,
        "objects": [
            ("upper_submarine_1", "Upper Fleet — Submarine 1", [(5.904, 5.103), (11.374, 5.082), (17.802, 5.103)]),
            ("upper_submarine_2", "Upper Fleet — Submarine 2", [(5.950, 9.751)]),
            ("upper_submarine_3", "Upper Fleet — Submarine 3", [(17.004, 9.751)]),
            ("upper_submarine_4", "Upper Fleet — Submarine 4", [(5.927, 14.378), (11.397, 14.357), (17.825, 14.378)]),
            ("lower_submarine_1", "Lower Fleet — Submarine 1", [(5.060, 19.278), (11.466, 19.278), (16.960, 19.278)]),
            ("lower_submarine_2", "Lower Fleet — Submarine 2", [(5.858, 23.905)]),
            ("lower_submarine_3", "Lower Fleet — Submarine 3", [(16.914, 23.905)]),
            ("lower_submarine_4", "Lower Fleet — Submarine 4", [(5.060, 28.529), (11.489, 28.553), (16.960, 28.529)]),
        ],
        "authority": {
            "source": "GunFun SKU 21110 exact physical target plus preserved publisher rules",
            "rule": "Choose a fleet and alternate shots. Hits inside a printed ring or touching its line count. The first player to sink all opponent submarines wins.",
            "limitations": "Fleet ownership and alternating turns are shooter-managed. SCZN3 reports governed ring and submarine contact; it does not declare a submarine sunk or a winner without a governed play-state record.",
        },
    },
    "gunfun_11160_sink_a_ship": {
        "contract": "gunfun_11160_sink_a_ship_smart_evidence_v1.json",
        "masterNumber": 193,
        "name": "Sink-a-Ship",
        "objectNoun": "ship",
        "objectPlural": "ships",
        "dimensions": [19.0, 25.0],
        "radiusInches": 0.85,
        "objects": [
            ("upper_ship_1", "Upper Fleet — Ship 1", [(2.479, 5.812), (5.516, 5.815), (8.557, 5.813), (11.590, 5.815), (14.630, 5.815)]),
            ("upper_ship_2", "Upper Fleet — Ship 2", [(7.087, 9.464), (9.672, 9.463), (12.237, 9.465)]),
            ("upper_ship_3", "Upper Fleet — Ship 3", [(1.732, 9.215), (3.533, 10.956)]),
            ("upper_ship_4", "Upper Fleet — Ship 4", [(17.220, 8.254), (17.244, 10.748)]),
            ("central_object", "Central Circular Object", [(9.548, 12.662)]),
            ("lower_ship_1", "Lower Fleet — Ship 1", [(1.820, 14.529), (1.836, 17.023)]),
            ("lower_ship_2", "Lower Fleet — Ship 2", [(15.597, 14.184), (17.387, 15.936)]),
            ("lower_ship_3", "Lower Fleet — Ship 3", [(6.834, 15.607), (9.402, 15.607), (11.988, 15.606)]),
            ("lower_ship_4", "Lower Fleet — Ship 4", [(4.370, 19.459), (7.383, 19.458), (10.396, 19.460), (13.412, 19.461), (16.418, 19.461)]),
        ],
        "authority": {
            "source": "GunFun SKU 11160 exact physical target and preserved publisher product identity",
            "rule": "Printed magenta circles are the governed hit areas for the eight ships and the separate central circular object. A tap inside or touching a governed circle counts as a hit on that circle and its parent object.",
            "limitations": "No numeric points, automatic sunk threshold, central-object bonus, turn sequence, or winner rule is asserted where exact publisher wording is not independently preserved.",
        },
        "ugoTranslation": {
            "status": "complete_target_recalibrated",
            "reason": "Founder 14-tap session exposed that the prior hand-entered physical centers were approximate and the generated boundary proof was self-referential.",
            "physicalAuthoritySource": "identified GunFun SKU 11160 physical target, its governed 19 x 25 inch target plane, and its 25 printed aiming-circle boundaries",
            "representationRole": "The exact registered artwork supplies registration correspondence only; its pixels are not physical authority.",
            "founderRegressionSessionId": "sczn3-session-ea689b3f-1ef1-4823-8428-927e2f659953",
        },
    },
}


def rounded(value: float) -> float:
    return round(value, 8)


def build(spec: dict, original: dict) -> tuple[dict, dict]:
    contract = deepcopy(original)
    width, height = spec["dimensions"]
    radius = spec["radiusInches"]
    regions = []
    rules = {}
    physical_regions = []
    circle_number = 0
    for object_index, (object_id, object_label, centers) in enumerate(spec["objects"], start=1):
        for local_index, (cx_inches, cy_inches) in enumerate(centers, start=1):
            circle_number += 1
            region_id = f"aim_circle_{circle_number:02d}"
            label = f"Aim Circle {circle_number} — {object_label}"
            regions.append({
                "regionId": region_id,
                "shape": "ellipse",
                "cx": rounded(cx_inches / width),
                "cy": rounded(cy_inches / height),
                "radiusX": rounded(radius / width),
                "radiusY": rounded(radius / height),
                "priority": 1000 - circle_number,
            })
            rules[region_id] = {
                "label": label,
                "objectId": object_id,
                "objectLabel": object_label,
                "countsAsHit": True,
                "fleetPosition": "upper" if object_id.startswith("upper_") else "lower" if object_id.startswith("lower_") else "center",
                "aimAreaIndex": local_index,
            }
            physical_regions.append({
                "regionId": region_id,
                "parentObjectId": object_id,
                "parentObjectLabel": object_label,
                "shape": "circle",
                "center": {"x": cx_inches, "y": cy_inches, "unit": "inch", "origin": "target_top_left"},
                "radius": {"value": radius, "unit": "inch"},
                "boundaryRule": "inside_or_touching_printed_line_is_hit",
            })

    boundary_proof = []
    for region in regions:
        cx, cy = float(region["cx"]), float(region["cy"])
        rx = float(region["radiusX"])
        boundary_proof.append({
            "regionId": region["regionId"],
            "effects": ["hit_miss", "zone_identity", "object_identity"],
            "probes": {
                "inside": {"x": cx, "y": cy, "expectedEntityId": region["regionId"]},
                "edge": {"x": rounded(cx + rx * 0.999), "y": cy, "expectedEntityId": region["regionId"]},
                "outside": {"x": rounded(cx + rx * 1.08), "y": cy, "expectedEntityId": "outside"},
            },
        })
    geometry = {
        "status": "ugo_governed_complete_boundary",
        "coordinateSystem": "normalized_source_image_top_left",
        "layoutModel": "repeated_regions",
        "canonicalRegionMapping": "available",
        "semanticClassification": "available",
        "physicalMeasurement": {"width": width, "height": height, "unit": "inch"},
        "regions": regions,
        "ugoAuthority": f"EP64-ISSUE4-UGO-{contract['targetProfile']['product']['sku']}-V1",
        "physicalAuthority": {
            "authorityId": f"EP64-ISSUE4-PHYSICAL-{contract['targetProfile']['product']['sku']}-V1",
            "source": spec["authority"]["source"],
            "targetPlane": {"width": width, "height": height, "unit": "inch"},
            "pixelIsAuthority": False,
            "ugoTranslatesPhysicalTruth": True,
        },
        "completeBoundaryProof": {
            "schemaVersion": "sczn3.ugo.complete-boundary.v1",
            "status": "PASS",
            "completenessAssertion": {
                "allResultAffectingPhysicalBoundariesEnumerated": True,
                "allOuterHitMissEnvelopesEnumerated": True,
                "pixelIsAuthorityFalse": True,
            },
            "resultAffectingBoundaryIds": [region["regionId"] for region in regions],
            "boundaries": boundary_proof,
        },
        "completeBoundaryLedger": {
            "resultAffectingBoundaryCount": len(regions),
            "insideEdgeOutsideRequired": True,
            "lineTouchRule": "inside_or_touching_printed_line_is_hit",
            "outsideDefinition": "outside_all_governed_aim_circles",
        },
    }
    scoring = {
        "status": "complete",
        "model": "multiple_bulls",
        "schemaVersion": "sczn3-target-scoring-data-v1",
        "regionRules": rules,
        "outsideRule": {"label": "Outside Governed Play Areas", "countsAsHit": False},
        "classificationFootprintMode": "hit_on_touch",
        "aggregation": {"mode": "per_object_counts"},
        "publisherRuleAuthority": spec["authority"],
    }
    if contract["targetProfile"]["id"] == "gunfun_11160_sink_a_ship":
        ship_regions = [region_id for region_id, rule in rules.items() if rule["objectId"] != "central_object"]
        central_regions = [region_id for region_id, rule in rules.items() if rule["objectId"] == "central_object"]
        scoring.update({
            "primaryObjectLayerId": "ships",
            "semanticLayers": [
                {"layerId": "ships", "label": "Ships", "resultLabel": "Ships Contacted", "regionIds": ship_regions},
                {"layerId": "central_object", "label": "Central Object", "resultLabel": "Central Object Contacted", "regionIds": central_regions},
            ],
        })
    capabilities = {
        "evidence": {"status": "available"},
        "measurement": {"status": "available"},
        "correction": {"status": "not_applicable"},
        "officialScore": {"status": "not_applicable", "reason": "no_governed_numeric_score"},
        "publisherMission": {"status": "available"},
        "qualification": {"status": "not_applicable"},
    }
    mission = {
        "missionFamily": "targetScoring",
        "resultPackageType": "targetScoreResult",
        "resultPackageVersion": "1",
        "maxObservations": 500,
        "interaction": {"aim": {"mode": "not_required", "points": []}, "observationInput": "normalized_taps", "resultAction": "show_result"},
        "capabilityStates": capabilities,
        "authorityResolution": "Issue #4 target-local fleet and printed-circle authority admitted through UGO; no numeric score or unsupported game state added.",
        "recognizedBehaviorFamily": "OBJECT_OR_GAME_DISTRIBUTION",
        "allowShooterDeclaredAim": False,
        "smartTargetTreatment": {
            "grammar": ["governed_fleet_objects", "governed_aim_circles", "open_observation_count"],
            "shooterFacingVocabulary": {"singular": spec["objectNoun"], "plural": spec["objectPlural"]},
            "objectCompletionVerbPast": "contacted",
            "objectCompletionLabel": f"{spec['objectPlural'].title()} Contacted",
            "outsideLabel": "Outside Governed Play Areas",
            "hitAreaLabel": "governed aiming circles",
            "intelligence": ["hits_by_object", "hits_by_aiming_circle", "unique_objects_contacted", "misses_outside_governed_play_areas", "complete_observation_accounting"],
            "authorityScope": "publisher_physical_target_plus_preserved_rules_plus_ugo_translation",
            "publisherScoreStatus": "no_numeric_score_governed",
            "limitations": spec["authority"]["limitations"],
            "resultPresentation": {"showObjectTapIdentifiers": True},
        },
    }
    product = contract["targetProfile"]["product"]
    product["shooterExperience"].update({
        "status": "connected_with_authority_limitations",
        "description": (
            "Engage the eight governed ships and the separate central circular object through 25 printed aiming circles. SCZN3 reports every circle hit, every object contacted, and every shot outside the governed play areas."
            if contract["targetProfile"]["id"] == "gunfun_11160_sink_a_ship"
            else f"Engage the {len(spec['objects'])} governed {spec['objectPlural']} through their {len(regions)} printed aiming circles. SCZN3 reports every circle hit, every object contacted, and every shot outside the governed play areas."
        ),
        "authorityLimitations": spec["authority"]["limitations"],
        "supportedExperience": "Object and aiming-circle distribution, unique-object contact, outside misses, complete tap reconciliation, RESULT, SEC, Vault, and exact reopen. No invented numeric score.",
    })
    product["shooterExperience"]["provenance"]["issue"] = "https://github.com/sczn313-stack/v-2-tap-n-score/issues/4"
    product["shooterExperience"]["provenance"]["connectedAt"] = "2026-10-13"

    contract["components"]["geometry"]["definition"] = geometry
    contract["components"]["scoring"]["definition"] = scoring
    contract["components"]["mission"]["definition"] = mission
    contract["missionFamily"] = "targetScoring"
    contract["resultPackageType"] = "targetScoreResult"
    contract["executor"] = {"id": "declarative-target-score", "version": "1"}
    contract["secAdapter"] = {"id": "target-scoring-family", "version": "1", "scoringPresentationFamily": "object_distribution"}
    contract["preservationValidator"] = {"id": "target-scoring-preservation", "version": "1"}
    contract["session"]["capabilityStates"] = deepcopy(capabilities)
    contract["unsupportedUses"] = [
        "zeroing_correction", "qualification_or_certification", "pixel_derived_physical_authority",
        "numeric_score_without_authority", "automatic_sunk_or_winner_claim_without_governed_play_state",
    ]
    for component in contract["components"].values():
        component["digest"] = component_digest(component)
    contract.pop("contractFingerprint", None)

    evidence = {
        "schemaVersion": "sczn3-ugo-physical-authority-v1",
        "authorityId": geometry["ugoAuthority"],
        "issue": "https://github.com/sczn313-stack/v-2-tap-n-score/issues/4",
        "targetProfileId": contract["targetProfile"]["id"],
        "masterNumber": spec["masterNumber"],
        "sku": contract["targetProfile"]["product"]["sku"],
        "physicalTarget": {"width": width, "height": height, "unit": "inch"},
        "authorityChain": [
            "identified GunFun physical target and published dimensions",
            "preserved printed target rules where available",
            "UGO translation of physical circle centers and extents to Backend Authority",
            "normalized coordinates compiled only as runtime representation",
        ],
        "pixelAuthorityProhibited": True,
        "objectCount": len(spec["objects"]),
        "aimCircleCount": len(regions),
        "physicalRegions": physical_regions,
        "runtimeRepresentation": {"coordinateSystem": geometry["coordinateSystem"], "regions": regions},
        "boundaryAcceptance": {
            "rule": "inside → printed-line touch → outside",
            "requiredForEveryRegion": True,
            "lineTouchExpected": "HIT",
            "outsideExpected": "MISS",
        },
        "limitations": spec["authority"]["limitations"],
    }
    if spec.get("ugoTranslation"):
        evidence["translationAudit"] = deepcopy(spec["ugoTranslation"])
    return contract, evidence


def main() -> None:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    for target_id, spec in SPECS.items():
        path = CONTRACTS / spec["contract"]
        original = json.loads(path.read_text())
        if original["targetProfile"]["id"] != target_id:
            raise RuntimeError(f"identity_mismatch:{target_id}")
        contract, evidence = build(spec, original)
        path.write_text(json.dumps(contract, indent=2) + "\n")
        (EVIDENCE / f"UGO_{spec['masterNumber']}_{spec['name'].upper().replace('-', '_').replace(' ', '_')}_V1.json").write_text(json.dumps(evidence, indent=2) + "\n")
        print(f"{target_id}: {evidence['objectCount']} objects / {evidence['aimCircleCount']} aim circles")


if __name__ == "__main__":
    main()
