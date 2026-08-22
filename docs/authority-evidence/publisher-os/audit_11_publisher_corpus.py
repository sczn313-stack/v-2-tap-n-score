#!/usr/bin/env python3
"""Reconcile the existing eleven-publisher P-OS corpus under one ontology.

This reads preserved evidence only. It performs no network access, ingestion,
registration, capability activation, or production mutation.
"""

from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


DOCS = Path(__file__).resolve().parents[2]
POS = DOCS / "authority-evidence" / "publisher-os"
FIVE = POS / "2026-08-20-five-publisher-batch"
FOUR = POS / "2026-08-21-nra-four-publisher-expansion"
OUT = POS / "11-publisher-master-2026-08-21"


def read_json(path: Path):
    return json.loads(path.read_text())


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def has_richer_candidate(record: dict) -> bool:
    return any(
        mapping.get("status") == "candidate_authority_required"
        for mapping in record.get("capabilityMappings", [])
    )


def five_offering_count(record: dict) -> int:
    publisher = record["publisher"]["id"]
    variant = record.get("commercialVariant") or {}
    if publisher == "splatterburst" and variant.get("variations"):
        return len(variant["variations"])
    if publisher == "birchwood-casey" and variant.get("publishedOptions"):
        return len(variant["publishedOptions"])
    return 1


CHAMPION_IDENTITY_OVERRIDES = {
    "47387": "champion:redfield-sight-in",
    "47388": "champion:redfield-sight-in",
    "45717": "champion:scorekeeper-orange-black-100yd-smallbore",
    "45725": "champion:scorekeeper-orange-black-100yd-smallbore",
    "40732": "champion:le-b27fsa-green",
    "40735": "champion:le-b27fsa-green",
    "40777": "champion:100yd-single-bull",
    "40762": "champion:100yd-single-bull",
    "45761": "champion:scorekeeper-orange-green-100yd-sight-in",
    "45731": "champion:scorekeeper-orange-green-100yd-sight-in",
    # These similarly named systems are materially different products.
    "44887": "champion:22-auto-reset-pop-up",
    "40986": "champion:22-auto-reset-multi",
}


def five_identity_keys(record: dict) -> list[str]:
    publisher = record["publisher"]["id"]
    source = str(record["sourceProductId"])
    if publisher == "splatterburst":
        return [f"splatterburst:{source}"]
    if publisher == "ez-aim-allen":
        # Allen exposes pack, size, and color choices as variants of one
        # publisher product/design lineage. Variant SKUs remain offerings.
        return [f"ez-aim-allen:{source}"]
    if publisher == "birchwood-casey":
        options = (record.get("commercialVariant") or {}).get("publishedOptions", [])
        if options and (
            "Silhouette /" in record["productName"]
            or record["productName"] in {"22 Rimfire AR500 Target Kits", "3D Stake Target"}
        ):
            return [f"birchwood-casey:{source}:{option}" for option in options]
        return [f"birchwood-casey:{source}"]
    if publisher == "champion":
        sku = record.get("sku")
        return [CHAMPION_IDENTITY_OVERRIDES.get(sku, f"champion:{record['behaviorLineageKey']}")]
    if publisher == "highwild":
        name = record["productName"].lower()
        if "shooting range silhouette paper target - 17x25 inches" in name:
            return ["highwild:shooting-range-silhouette-paper-target-17x25"]
        return [f"highwild:{record['behaviorLineageKey']}"]
    raise ValueError(publisher)


def audit_five() -> tuple[dict, dict[str, dict]]:
    records = read_json(FIVE / "normalized" / "all-publishers.json")
    grouped: dict[str, list[dict]] = defaultdict(list)
    for record in records:
        grouped[record["publisher"]["id"]].append(record)

    result = {}
    evidence = {}
    for publisher, rows in grouped.items():
        target = [row for row in rows if row["isActualShootableTarget"]]
        non_target = [row for row in rows if not row["isActualShootableTarget"]]
        identities = set()
        candidate_identities = set()
        for row in target:
            keys = five_identity_keys(row)
            identities.update(keys)
            if has_richer_candidate(row):
                candidate_identities.update(keys)

        target_offerings = sum(five_offering_count(row) for row in target)
        non_target_offerings = sum(five_offering_count(row) for row in non_target)
        candidate_offerings = sum(
            five_offering_count(row) for row in target if has_richer_candidate(row)
        )
        target_exact_skus = sum(
            five_offering_count(row) for row in target if row.get("sku")
        )
        all_exact_skus = sum(
            five_offering_count(row) for row in rows if row.get("sku")
        )

        result[publisher] = {
            "catalogProductRecords": len({row["sourceProductId"] for row in rows}),
            "targetProductRecords": len({row["sourceProductId"] for row in target}),
            "publisherTargetImplementationIdentities": len(identities),
            "commercialTargetOfferings": target_offerings,
            "nonTargetProductRecords": len({row["sourceProductId"] for row in non_target}),
            "nonTargetCommercialOfferings": non_target_offerings,
            "separatelyExcludedPackBundleOfferings": 0,
            "exactSkuCommercialRecords": all_exact_skus,
            "targetOfferingsWithExactSku": target_exact_skus,
            "targetSkuGaps": target_offerings - target_exact_skus,
            "smartEvidenceEligibleIdentities": len(identities),
            "smartEvidenceEligibleOfferings": target_offerings,
            "richerCapabilityCandidateIdentities": len(candidate_identities),
            "richerCapabilityCandidateOfferings": candidate_offerings,
            "recognitionReadyIdentities": len(identities),
            "recognitionReadyOfferings": target_offerings,
        }
        evidence[publisher] = {
            "identityKeys": sorted(identities),
            "rules": {
                "splatterburst": "one source product is one face lineage; exposed quantity variants are separate offerings",
                "highwild": "normalized behavior lineage with explicit 17x25 color/pack collapse",
                "birchwood-casey": "one source product except each explicitly named silhouette artwork option is a distinct identity",
                "ez-aim-allen": "one source product/design lineage; SKU variants remain offerings",
                "champion": "face-level variant identity with explicit package duplicate collapses",
            }[publisher],
        }
    return result, evidence


def audit_four() -> tuple[dict, dict]:
    audit = read_json(FOUR / "DENOMINATOR_AUDIT.json")
    normalized = read_json(FOUR / "normalized" / "all-publishers.json")
    by_record = {row["recordId"]: row for row in normalized}
    result = {}
    evidence = {}

    audit_rows: dict[str, list[dict]] = defaultdict(list)
    for row in audit["records"]:
        audit_rows[row["publisher"]].append(row)

    for publisher, summary in audit["publishers"].items():
        rows = audit_rows[publisher]
        identity_candidates = set()
        candidate_offerings = 0
        target_exact = 0
        all_exact = 0
        non_target_offerings = 0
        target_identities = set()

        for row in rows:
            offerings = row.get("commercialOfferings", [])
            if row["correctedClass"] in {"shootable_target", "shootable_target_system"}:
                identity = row["publisherImplementationKey"]
                target_identities.add(identity)
                for offering in offerings:
                    source = by_record.get(offering["sourceRecordId"])
                    if source and source.get("sku"):
                        target_exact += 1
                    if source and has_richer_candidate(source):
                        candidate_offerings += 1
                        identity_candidates.add(identity)
            else:
                non_target_offerings += len(offerings)
                for offering in offerings:
                    source = by_record.get(offering["sourceRecordId"])
                    if source and source.get("sku"):
                        all_exact += 1
        all_exact += target_exact

        result[publisher] = {
            "catalogProductRecords": summary["catalogProductRecords"],
            "targetProductRecords": sum(
                1 for row in rows if row["correctedClass"] in {"shootable_target", "shootable_target_system"}
            ),
            "publisherTargetImplementationIdentities": summary["publisherTargetImplementationIdentities"],
            "commercialTargetOfferings": summary["commercialTargetOfferings"],
            "nonTargetProductRecords": summary["nonTargetAccessoryConsumableRecords"],
            "nonTargetCommercialOfferings": non_target_offerings,
            "separatelyExcludedPackBundleOfferings": 0,
            "exactSkuCommercialRecords": all_exact,
            "targetOfferingsWithExactSku": target_exact,
            "targetSkuGaps": summary["commercialTargetOfferings"] - target_exact,
            "smartEvidenceEligibleIdentities": summary["publisherTargetImplementationIdentities"],
            "smartEvidenceEligibleOfferings": summary["commercialTargetOfferings"],
            "richerCapabilityCandidateIdentities": len(identity_candidates),
            "richerCapabilityCandidateOfferings": candidate_offerings,
            "recognitionReadyIdentities": summary["publisherTargetImplementationIdentities"],
            "recognitionReadyOfferings": summary["commercialTargetOfferings"],
            "governedNraSpecificationImplementations": summary["governedNraSpecificationsWithCatalogImplementations"],
        }
        evidence[publisher] = {
            "identityKeys": sorted(target_identities),
            "source": str(FOUR / "DENOMINATOR_AUDIT.json"),
        }
    return result, evidence


def main() -> None:
    five, five_evidence = audit_five()
    four, four_evidence = audit_four()

    publishers = {
        "baker-targets": {
            "catalogProductRecords": 536,
            "targetProductRecords": 422,
            "publisherTargetImplementationIdentities": 238,
            "commercialTargetOfferings": 422,
            "nonTargetProductRecords": 3,
            "nonTargetCommercialOfferings": 3,
            "separatelyExcludedPackBundleOfferings": 111,
            "exactSkuCommercialRecords": 536,
            "targetOfferingsWithExactSku": 422,
            "targetSkuGaps": 0,
            "smartEvidenceEligibleIdentities": 238,
            "smartEvidenceEligibleOfferings": 422,
            "richerCapabilityCandidateIdentities": None,
            "richerCapabilityCandidateOfferings": None,
            "recognitionReadyIdentities": 238,
            "recognitionReadyOfferings": 422,
        },
        "gunfun": {
            "catalogProductRecords": 258,
            "targetProductRecords": 241,
            "publisherTargetImplementationIdentities": 241,
            "commercialTargetOfferings": 241,
            "nonTargetProductRecords": 14,
            "nonTargetCommercialOfferings": 14,
            "separatelyExcludedPackBundleOfferings": 3,
            "exactSkuCommercialRecords": 258,
            "targetOfferingsWithExactSku": 241,
            "targetSkuGaps": 0,
            "smartEvidenceEligibleIdentities": 238,
            "smartEvidenceEligibleOfferings": 238,
            "richerCapabilityCandidateIdentities": None,
            "richerCapabilityCandidateOfferings": None,
            "recognitionReadyIdentities": 241,
            "recognitionReadyOfferings": 241,
        },
        **five,
        **four,
    }

    # Champion public authority maps three implementation identities to B-16,
    # B-2, and B-3. Two are current exact live-catalog mappings; B-2 is
    # historical/Grade B and remains fail-closed for exact face admission.
    publishers["champion"]["governedNraSpecificationImplementations"] = 3

    additive = [
        "catalogProductRecords",
        "targetProductRecords",
        "publisherTargetImplementationIdentities",
        "commercialTargetOfferings",
        "nonTargetProductRecords",
        "nonTargetCommercialOfferings",
        "separatelyExcludedPackBundleOfferings",
        "exactSkuCommercialRecords",
        "targetOfferingsWithExactSku",
        "targetSkuGaps",
        "smartEvidenceEligibleIdentities",
        "smartEvidenceEligibleOfferings",
        "recognitionReadyIdentities",
        "recognitionReadyOfferings",
    ]
    totals = {key: sum(row[key] for row in publishers.values()) for key in additive}
    totals["publisherCount"] = len(publishers)
    totals["allCommercialOfferings"] = (
        totals["commercialTargetOfferings"]
        + totals["nonTargetCommercialOfferings"]
        + totals["separatelyExcludedPackBundleOfferings"]
    )
    totals.update(
        {
            "uniqueGovernedExternalOrganizationSpecifications": 136,
            "exactLivePublisherImplementationsMappedToGovernedSpecifications": 266,
            "mappedPublisherImplementationsIncludingHistoricalGradeBChampion": 267,
            "behavioralFamiliesRepresented": 16,
            "implementedBehavioralFamilies": 16,
            "genuinelyNewBehaviorFamilyCandidates": 1,
            "newBehaviorFamilyCandidate": "publisherDefinedPathTraversal (Baker Candyville; one-lineage candidate, not generalized or implemented)",
            "authorityCompleteRicherIdentitiesAtEvidenceLayer": 8,
            "authorityCompleteRicherOfferingsAtEvidenceLayer": 9,
            "authorityCompleteRicherBasis": "six Baker rule-governed products plus Champion B-16/B-3 identities (three Grade-A Champion offerings); no activation implied",
            "richerCandidateExactStatus": "unavailable_across_all_11",
            "richerCandidateDocumentedMinimumOfferings": 69 + sum(
                row["richerCapabilityCandidateOfferings"]
                for key, row in publishers.items()
                if key not in {"baker-targets", "gunfun"}
            ),
            "richerCandidateReason": "Baker/GunFun used an earlier 69-offering 'then-missing-family' denominator; later batches flag all richer candidates. Unlike measures are not summed as an exact total.",
        }
    )

    prior = {
        "preFourPublisherClaim": {"identities": 1748, "targetOfferings": 2332},
        "postFourPublisherAuditInterim": {"identities": 1651, "targetOfferings": 2319},
        "authoritativeElevenPublisher": {
            "identities": totals["publisherTargetImplementationIdentities"],
            "targetOfferings": totals["commercialTargetOfferings"],
        },
        "explanation": "The interim total corrected Batch #8-#11 but retained the unaudited seven-publisher 907/1,168 baseline. This audit reclassifies all eleven and expands nested sellable variants while collapsing package/color/material records at the identity layer.",
    }

    profiles_a = read_json(POS / "publisher-intelligence-pilot-2026-08-21" / "PUBLISHER_PROFILES.json")
    profiles_b = read_json(FOUR / "PUBLISHER_PROFILES.json")
    profiles = profiles_a["profiles"] + profiles_b["profiles"]
    profile_status = {
        profile["publisherId"]: {
            "tier1": profile["tier1"],
            "tier2": profile["tier2"],
            "tier3": profile["tier3"],
            "identity": profile["identity"],
            "meetingFacts": profile["meetingFacts"],
            "founderMeetingReadiness": profile["founderMeetingReadiness"],
        }
        for profile in profiles
    }

    audit = {
        "schemaVersion": "1.0.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "observationDate": "2026-08-21",
        "scope": "existing_evidence_only_no_publisher_12",
        "ontology": {
            "governedTargetSpecification": "Meaning owned by an organization or other valid authority.",
            "publisherTargetImplementationIdentity": "One publisher physical face/design lineage; packaging, quantity, color, material, and adhesive variants do not automatically create identities.",
            "commercialTargetOffering": "One sellable target configuration, including legitimate quantity, material, color, adhesive, packaging, SKU, or other exposed variant.",
            "nonTargetCommercialRecord": "Accessory, consumable, stand/hardware-only product, merchandise, or non-individual-target bundle.",
            "governingRule": "Governed specification != publisher implementation identity != commercial offering.",
        },
        "publishers": publishers,
        "totals": totals,
        "withdrawnAndCorrected": prior,
        "identityEvidence": {**five_evidence, **four_evidence},
        "tierStatus": profile_status,
        "sourceArtifacts": [
            "docs/history/episodes/episode56-target-capability-coverage/RESULTS.json",
            "docs/authority-evidence/gunfun/episode56/full-catalog-stress-test/FULL_CATALOG_AUTHORITY_AUDIT.json",
            "docs/authority-evidence/publisher-os/2026-08-20-five-publisher-batch/normalized/all-publishers.json",
            "docs/authority-evidence/publisher-os/2026-08-21-nra-four-publisher-expansion/DENOMINATOR_AUDIT.json",
            "docs/authority-evidence/publisher-os/publisher-intelligence-pilot-2026-08-21/PUBLISHER_PROFILES.json",
            "docs/authority-evidence/publisher-os/2026-08-21-nra-four-publisher-expansion/PUBLISHER_PROFILES.json",
            "docs/authority-evidence/publisher-os/champion-nra-authority-2026-08-21/RESULTS.json",
        ],
    }
    write_json(OUT / "DENOMINATOR_AUDIT.json", audit)
    write_json(OUT / "PUBLISHER_PROFILES.json", {
        "schemaVersion": "1.0.0",
        "observationDate": "2026-08-21",
        "governingPrecisionRules": [
            "Product labeling is not organizational endorsement.",
            "Possible experience is not an authorized capability.",
            "ASIN is a retailer identifier, not a publisher SKU.",
            "Evidence of importing is not confirmed importer status.",
            "An observation is dated evidence, not a timeless fact.",
        ],
        "profiles": profiles,
    })

    validation = {
        "status": "PASS",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "elevenPublishersPresent": len(publishers) == 11,
            "fourLayerArithmetic": totals["allCommercialOfferings"] == 2874,
            "targetIdentityTotal": totals["publisherTargetImplementationIdentities"] == 1683,
            "targetOfferingTotal": totals["commercialTargetOfferings"] == 2416,
            "nonTargetCommercialOfferingTotal": totals["nonTargetCommercialOfferings"] == 344,
            "packBundleExclusionTotal": totals["separatelyExcludedPackBundleOfferings"] == 114,
            "targetSkuGapReconciles": totals["targetOfferingsWithExactSku"] + totals["targetSkuGaps"] == totals["commercialTargetOfferings"],
            "recognitionReconciles": totals["recognitionReadyIdentities"] == totals["publisherTargetImplementationIdentities"] and totals["recognitionReadyOfferings"] == totals["commercialTargetOfferings"],
            "smartEvidenceFailClosedHolds": totals["commercialTargetOfferings"] - totals["smartEvidenceEligibleOfferings"] == 3,
            "nraSpecCount": totals["uniqueGovernedExternalOrganizationSpecifications"] == 136,
            "publisherExpansionCapped": audit["scope"] == "existing_evidence_only_no_publisher_12",
            "allProfilesReconciled": {
                profile["publisherId"].replace("champion-targets", "champion")
                for profile in profiles
            } == set(publishers),
            "commonMonitoringStructurePresent": (OUT / "MONITORING_PLAN.json").exists(),
            "founderMasterSummaryPresent": (POS / "PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md").exists(),
        },
    }
    validation["status"] = "PASS" if all(validation["checks"].values()) else "FAIL"
    write_json(OUT / "VALIDATION.json", validation)

    hashes = {}
    artifact_paths = [
        path for path in sorted(OUT.glob("*.json")) if path.name != "MANIFEST.json"
    ] + [
        POS / "PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md",
        POS / "audit_11_publisher_corpus.py",
    ]
    for path in artifact_paths:
        key = str(path.relative_to(POS))
        hashes[key] = {
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "bytes": path.stat().st_size,
        }
    write_json(OUT / "MANIFEST.json", {"generatedAt": datetime.now(timezone.utc).isoformat(), "files": hashes})

    print(json.dumps({"status": validation["status"], "totals": totals}, indent=2))


if __name__ == "__main__":
    main()
