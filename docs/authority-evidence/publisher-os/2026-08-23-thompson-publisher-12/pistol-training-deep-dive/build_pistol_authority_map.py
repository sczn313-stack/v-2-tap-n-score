#!/usr/bin/env python3
"""Build the Thompson pistol-training authority map from preserved Publisher #12 data."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PUBLISHER_ROOT = ROOT.parent
CATALOG = json.loads((PUBLISHER_ROOT / "THOMPSON_CATALOG.json").read_text())
OUTPUT = ROOT / "THOMPSON_PISTOL_AUTHORITY_MAP.json"


KNOWLEDGE = {
    "R-9200": {
        "role": "diagnosis",
        "authorityGrade": "publisher meaning visible; exact licensed production transcription required",
        "publisherKnowledge": {
            "method": "Locate a shot or group in a target sector, then follow that sector to Thompson's printed problem and correction.",
            "handedness": "Distinct right- and left-handed guidance is printed.",
            "namedPatterns": ["jumping the gun", "the heel", "post-trigger release", "lazy finger", "all thumbs", "jerking the trigger", "over gripping", "breaking the wrist up", "breaking the wrist down"],
            "fundamentals": ["position", "grip", "breath control", "sight alignment", "trigger squeeze", "follow through"],
        },
        "sczn3CurrentTruth": "May preserve observations and match exact governed publisher regions/labels. Current Diagnostic V1 may not infer a dominant group diagnosis or emit corrective advice.",
        "minimumAdditionalAuthorityOrCapability": "Licensed versioned region/handedness/guidance profile plus Founder-approved Diagnostic extension for publisher-authored guidance presentation.",
    },
    "R-2550": {
        "role": "diagnosis",
        "authorityGrade": "publisher meaning visible; exact licensed production transcription required",
        "publisherKnowledge": {
            "method": "Compare the shooter's grouping with eight printed example groupings and use Thompson's associated guidance.",
            "aimAreas": 4,
            "grid": "1 inch",
            "handedness": "Designed for right- and left-handed shooters.",
            "publishedDistance": "15 feet to 200 yards",
            "namedPatterns": ["the jerk", "jumping the gun", "all thumbs", "the heel", "lobster grip", "lazy finger", "wrist breaker", "green-horn"],
            "fundamentals": ["body position", "grip", "breath control", "sight alignment", "trigger squeeze", "follow through"],
        },
        "sczn3CurrentTruth": "Can show impacts and preserve evidence. Automatic group-pattern comparison/correction is outside locked Diagnostic V1.",
        "minimumAdditionalAuthorityOrCapability": "Licensed diagram geometry, group-match criteria, ambiguity policy, handedness profiles and publisher-guidance presentation extension.",
    },
    "R-2551-10": {
        "role": "diagnosis",
        "authorityGrade": "publisher meaning visible; exact licensed production transcription required",
        "publisherKnowledge": {
            "method": "Same eight example-grouping comparison as the larger Trouble-Shooter, on four 6-inch aim areas.",
            "aimAreas": 4,
            "grid": "1 inch",
            "handedness": "Designed for right- and left-handed shooters.",
            "publishedDistance": "15 feet to 200 yards",
            "namedPatterns": ["the jerk", "jumping the gun", "all thumbs", "the heel", "lobster grip", "lazy finger", "wrist breaker", "green-horn"],
        },
        "sczn3CurrentTruth": "Evidence and target identity are available; group diagnosis and correction remain unavailable in Diagnostic V1.",
        "minimumAdditionalAuthorityOrCapability": "Same reusable licensed diagnostic profile type as R-2550 with distinct product geometry.",
    },
    "R-2552-12": {
        "role": "fundamentals_reference",
        "authorityGrade": "publisher fundamentals visible; no automatic diagnostic rule established",
        "publisherKnowledge": {
            "method": "Shoot one central aim area while referring to Thompson's printed fundamentals.",
            "aimAreas": 1,
            "grid": "1 inch",
            "publishedDistance": "15 feet to 200 yards",
            "fundamentals": ["body position", "grip", "breath control", "sight alignment", "trigger squeeze", "follow through"],
        },
        "sczn3CurrentTruth": "Can provide publisher-attributed Listen guidance and preserve evidence; the target itself does not establish an automatic after-shot diagnosis.",
        "minimumAdditionalAuthorityOrCapability": "Licensed text/media packaging only for guidance; scoring/diagnosis needs separate exact authority.",
    },
    "R-4613": {
        "role": "diagnosis",
        "authorityGrade": "publisher pattern chart visible; exact licensed production transcription required",
        "publisherKnowledge": {
            "method": "Compare shot placement with an eight-pattern chart printed for both right- and left-handed shooters.",
            "namedPatterns": ["the jerk", "jumping the gun", "all thumbs", "the heel", "lobster grip", "lazy finger", "wrist breaker", "green-horn"],
            "physicalFeedback": "Reactive impact marks aid observation but create no digital diagnosis authority.",
        },
        "sczn3CurrentTruth": "Can capture visible reactive impacts and return publisher labels only where an exact governed region match exists.",
        "minimumAdditionalAuthorityOrCapability": "Licensed handedness/region profile and the same publisher-guidance extension; no HALO-specific application owner.",
    },
    "R-4646": {
        "role": "diagnosis",
        "authorityGrade": "publisher pattern chart visible; exact licensed production transcription required",
        "publisherKnowledge": {
            "method": "Use five aim areas and the same eight named publisher patterns for right- or left-handed comparison.",
            "aimAreas": 5,
            "grid": "1 inch",
            "namedPatterns": ["the jerk", "jumping the gun", "all thumbs", "the heel", "lobster grip", "lazy finger", "wrist breaker", "green-horn"],
            "physicalFeedback": "HALO reactive marking is a visibility trait.",
        },
        "sczn3CurrentTruth": "Can capture impacts; automatic group diagnosis/correction remains outside Diagnostic V1.",
        "minimumAdditionalAuthorityOrCapability": "Reusable diagnostic profile with this product's UGO and licensed publisher guidance.",
    },
    "R-2704": {
        "role": "guided_drill",
        "authorityGrade": "public publisher Cue Card establishes the drill; target UGO/licensing and timing evidence still govern execution claims",
        "publisherKnowledge": {
            "participants": "At least two as designed: shooter and partner/caller; solo practice is described separately.",
            "recommendedShotCount": "10 to 20",
            "recommendedDistance": {"pistol": "3 to 5 yards", "rifle": "5 to 10 yards"},
            "startPosition": "Low ready",
            "cueVocabulary": {
                "colors": ["black", "blue", "red", "violet"],
                "shapes": ["X", "square", "diamond", "circle"],
                "phoneticLetters": ["Tango", "Yankee", "Alpha", "Echo"],
            },
            "cueSets": 10,
            "cuesPerSet": 20,
            "sequence": [
                "Choose shot count and one published cue set; designate the partner/caller and timer operator.",
                "Start in low ready; start the timer with the first cue; engage the corresponding torso.",
                "After every shot return to low ready; the partner then gives the next cue.",
                "After the final shot stop time, secure the firearm, score the target, and divide total score by elapsed seconds for Time Factor Score.",
            ],
            "scoringZones": [5, 3, 1],
            "timeFactorFormula": "total score divided by elapsed seconds",
            "nextStep": "The Cue Card says the next shooter may fix a target downrange and repeat the drill.",
        },
        "sczn3CurrentTruth": "Cue/Drill can own cue selection, sequence, backend event state and terminal SEC. It cannot represent manual impact entry as physical shot timing.",
        "minimumAdditionalAuthorityOrCapability": "Exact target UGO, Cue Card licensing/version, admitted clock/timer provenance and response-to-cue reconciliation. No new family required.",
    },
    "R-4655": {
        "role": "guided_scenario_game",
        "authorityGrade": "publisher rules and printed values visible; exact scenario/region geometry required",
        "publisherKnowledge": {
            "players": "One or more",
            "shotCount": 10,
            "rule": "Positive points come from red threat scoring areas; black innocent/negative areas subtract points.",
            "bonus": 20,
            "bonusCondition": "Score on all threats.",
            "winner": "Highest score",
            "scenarioPanels": 4,
            "optionalDifficulty": "Publisher suggests moving farther away or adding a timer.",
        },
        "sczn3CurrentTruth": "Recreational Challenge can score governed zones; Decision may be offered separately. Artwork cannot itself establish threat or tactical truth.",
        "minimumAdditionalAuthorityOrCapability": "Exact four-panel UGO, value map and clarification whether/how the four panels are sequenced. Pistol-specific applicability is not established by the reviewed page.",
    },
    "R-6502": {
        "role": "progression",
        "authorityGrade": "publisher establishes ordinal stages but no performance-based advancement threshold",
        "publisherKnowledge": {
            "quantity": "20 each of three target identities",
            "stages": [
                {"order": 1, "product": "Group-Shooter Handgun", "baseSku": "R-9200", "purpose": "fundamentals and feedback based on group location"},
                {"order": 2, "product": "Trouble-Shooter Handgun 19x25", "baseSku": "R-2550", "purpose": "multiple smaller aim areas and reminders for misplaced groups"},
                {"order": 3, "product": "TAC", "baseSku": "R-2704", "purpose": "audible-cue drill and optional Time Factor Score"},
            ],
            "advancementRule": None,
        },
        "sczn3CurrentTruth": "May truthfully present Thompson's next ordinal stage. It may not claim the shooter is ready to advance or has completed a level without publisher criteria. Cross-session progress additionally requires governed subject continuity.",
        "minimumAdditionalAuthorityOrCapability": "Versioned program profile, licensed component guidance, consumption/repetition policy, advancement criteria if Thompson supplies them, and backend subject continuity for longitudinal claims.",
    },
    "R-1301": {
        "role": "curated_collection",
        "authorityGrade": "publisher establishes included products, not an ordered course",
        "publisherKnowledge": {
            "quantity": "20 each of six target identities; 120 total",
            "components": ["Group-Shooter Handgun", "Sight-Seer Red", "Trouble-Shooter Handgun 19x25", "Center-Fire Life Size Silhouette", "B27-IMZ Upper Torso", "HALO Life Size Silhouette"],
            "sequence": None,
        },
        "sczn3CurrentTruth": "Can expose applicable experiences for each registered component; the bundle is not a progression program.",
        "minimumAdditionalAuthorityOrCapability": "Component registration/profile data only; no sequence should be invented.",
    },
}


def find_product(base_sku: str) -> dict:
    matches = [product for product in CATALOG["products"] if product["baseSku"] == base_sku]
    if len(matches) != 1:
        raise ValueError(f"Expected one product for {base_sku}, found {len(matches)}")
    return matches[0]


def main() -> None:
    records = []
    for base_sku, knowledge in KNOWLEDGE.items():
        product = find_product(base_sku)
        records.append({
            "publisher": "Thompson Target Inc.",
            "productName": product["productName"],
            "baseSku": base_sku,
            "commercialSkus": [variant["sku"] for variant in product["commercialVariants"]] or [base_sku],
            "productUrl": product["productUrl"],
            "publishedDimensions": product["publishedDimensions"],
            "primaryImage": product["primaryImage"],
            **knowledge,
        })
    output = {
        "schemaVersion": "1.0",
        "observedAt": "2026-08-23",
        "question": "What publisher-authored knowledge inside Thompson pistol targets can SCZN3 turn into useful after-shot guidance without inventing instruction?",
        "population": {
            "instructionalPistolProductIdentities": 8,
            "publisherProgramOrCollectionOfferings": 2,
            "records": len(records),
            "boundary": "Six diagnostic identities, TAC, and Threat Code RED carry target-level instructional meaning; Progressive Pistol and Premium Handgun are commercial compositions.",
        },
        "result": {
            "newBehavioralFamiliesRequired": 0,
            "authorityCompleteForProduction": 0,
            "reason": "Public evidence proves the knowledge exists, but production use still requires exact licensed authority packaging; some experiences also need UGO, timing provenance, subject continuity, or new Founder approval for corrective guidance.",
        },
        "records": records,
    }
    OUTPUT.write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps(output["population"], indent=2))


if __name__ == "__main__":
    main()
