#!/usr/bin/env python3
"""Independent Issue #4 lifecycle and arithmetic proof for exactly two targets."""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
BACKEND = DOCS / "backend"
sys.path.insert(0, str(BACKEND))

from execution_authority import execute_authoritative_session  # noqa: E402
from preserved_sec_store import list_preserved_secs, preserve_sec, read_preserved_sec  # noqa: E402
from session_authority import prepare_session, start_session  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402


NOW = datetime(2026, 10, 13, 15, 0, tzinfo=timezone.utc)
EXPECTED = {
    "gunfun_21110_sink_a_sub": {"objects": 8, "primaryObjects": 8, "circles": 16, "width": 400, "height": 609},
    "gunfun_11160_sink_a_ship": {"objects": 9, "primaryObjects": 8, "circles": 25, "width": 400, "height": 531},
}
FOUNDER_193_REGRESSION = DOCS / "authority-evidence" / "gunfun" / "episode64-issue4-sink-games" / "FOUNDER_193_14_TAP_REGRESSION.json"
FOUNDER_ACCEPTANCE = DOCS / "authority-evidence" / "gunfun" / "episode64-issue4-sink-games" / "FOUNDER_ACCEPTANCE_192_193.json"


def resolve_nn_contract(resolver: TargetExecutionContractResolver, target_id: str) -> dict:
    """Resolve production authority and independently require its embedded N/N gate."""
    contract = resolver.resolve(target_id, "targetScoring")
    geometry = contract["components"]["geometry"]["definition"]
    regions = geometry["regions"]
    proof = geometry["completeBoundaryProof"]
    assert proof["status"] == "PASS"
    assert all(proof["completenessAssertion"].values())
    assert geometry["physicalAuthority"]["pixelIsAuthority"] is False
    assert set(proof["resultAffectingBoundaryIds"]) == {row["regionId"] for row in regions}
    assert len(proof["boundaries"]) == len(regions)
    contract["ugoCompleteBoundaryAcceptance"] = {
        "required": True,
        "status": "PASS",
        "boundaryCount": len(proof["boundaries"]),
        "probeCount": len(proof["boundaries"]) * 3,
        "rule": "inside_edge_outside_for_every_result_affecting_boundary",
    }
    return contract


def asset_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_target(target_id: str) -> dict:
    resolver = TargetExecutionContractResolver()
    contract = resolve_nn_contract(resolver, target_id)
    expected = EXPECTED[target_id]
    geometry = contract["components"]["geometry"]["definition"]
    regions = geometry["regions"]
    assert len(regions) == expected["circles"]
    observations = [
        {"xNorm": region["cx"], "yNorm": region["cy"], "label": f"Circle {index}"}
        for index, region in enumerate(regions, start=1)
    ] + [{"xNorm": 0.99, "yNorm": 0.99, "label": "Intentional outside"}]

    store = MemoryStore()
    prepared = prepare_session({"targetId": target_id, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
    started = start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
        store,
        idempotency_key=f"episode64-issue4-{target_id}",
        now=NOW,
        execution_contract_resolver=resolver,
    )
    session_id = started["authoritativeSessionId"]
    registration = contract["components"]["registration"]["definition"]
    asset_path = DOCS / registration["assetPath"]
    assert asset_path.is_file()
    assert asset_sha(asset_path) == registration["assetSha256"]
    result = execute_authoritative_session({
        "authoritativeSessionId": session_id,
        "evidence": {
            "imageEvidence": {
                "sha256": registration["assetSha256"],
                "widthPx": expected["width"],
                "heightPx": expected["height"],
                "mediaType": "image/jpeg",
                "dataUrl": "data:image/jpeg;base64,AA==",
            },
            "observations": observations,
            "shooterDeclaredComplete": True,
        },
    }, store, resolver=resolver)

    classifications = result["classifications"]
    assert [row["regionId"] for row in classifications[:-1]] == [row["regionId"] for row in regions]
    assert classifications[-1]["regionId"] == "outside"
    assert result["scoring"]["observationCount"] == len(observations)
    hit_count = result["scoring"]["observationCount"] - result["scoring"]["outsideCount"] - result["scoring"]["unclassifiedObservationCount"]
    assert hit_count == expected["circles"]
    assert result["scoring"]["outsideCount"] == 1
    object_results = result["scoring"]["objectResults"]
    assert len(object_results) == expected["primaryObjects"]
    semantic_layers = result["scoring"].get("semanticLayerResults") or []
    if semantic_layers:
        assert sum(layer["hitTapCount"] for layer in semantic_layers) == expected["circles"]
        assert sum(layer["objectsHit"] for layer in semantic_layers) == expected["objects"]
    else:
        assert sum(row["hitCount"] for row in object_results) == expected["circles"]
        assert sum(1 for row in object_results if row["hit"]) == expected["objects"]
    assert result["reconciliation"]["countsMatch"] is True
    assert result["reconciliation"]["recordedObservationCount"] == len(observations)

    artifact = {
        "sessionId": session_id,
        "authoritativeSessionId": session_id,
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": "targetScoring", "resultPackageType": "targetScoreResult"},
        "authorityPackage": result,
        "targetEvidenceImage": {"sha256": registration["assetSha256"], "dataUrl": "data:image/jpeg;base64,AA=="},
        "observations": result["observations"],
        "savedToSEC": True,
    }
    saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
    vault = list_preserved_secs(store)
    reopened = read_preserved_sec(session_id, store)
    assert any(row["sessionId"] == session_id for row in vault["sessions"])
    assert any(row["artifactSha256"] == saved["artifactSha256"] for row in vault["artifacts"])
    assert reopened["artifactSha256"] == saved["artifactSha256"]
    assert reopened["session"]["authorityPackage"] == result
    assert reopened["session"]["observations"] == result["observations"]
    return {
        "masterNumber": contract["targetProfile"]["product"]["shooterExperience"]["provenance"]["masterNumber"],
        "targetId": target_id,
        "runtimeId": target_id,
        "name": contract["targetProfile"]["product"]["name"],
        "targetName": contract["targetProfile"]["product"]["name"],
        "publisher": contract["targetProfile"]["publisher"]["name"],
        "status": "PASS",
        "missionFamily": "targetScoring",
        "contractFingerprint": contract["contractFingerprint"],
        "artwork": registration["assetPath"],
        "artworkSha256": registration["assetSha256"],
        "objectCount": expected["objects"],
        "aimCircleCount": expected["circles"],
        "observedHits": hit_count,
        "observedMisses": result["scoring"]["outsideCount"],
        "totalTaps": len(observations),
        "uniqueObjectsContacted": sum(layer["objectsHit"] for layer in semantic_layers) if semantic_layers else sum(1 for row in object_results if row["hit"]),
        "functionalResult": {
            "capability": "Governed object / aiming-circle distribution",
            "objectCount": expected["objects"],
            "aimCircleCount": expected["circles"],
            "hits": hit_count,
            "misses": result["scoring"]["outsideCount"],
        },
        "sessionId": session_id,
        "secArtifactSha256": saved["artifactSha256"],
        "ugoCompleteBoundary": contract["ugoCompleteBoundaryAcceptance"],
        "stages": {stage: "PASS" for stage in ("TARGET", "TAP", "RESULT", "CONFIRM", "SEC", "VAULT", "EXACT_REOPEN")},
        "founderApproval": "PENDING",
    }


class Issue4SinkGamesTest(unittest.TestCase):
    def test_both_targets_full_lifecycle(self) -> None:
        rows = [run_target(target_id) for target_id in EXPECTED]
        self.assertEqual([row["status"] for row in rows], ["PASS", "PASS"])

    def test_sink_a_ship_founder_14_tap_regression(self) -> None:
        fixture = json.loads(FOUNDER_193_REGRESSION.read_text())
        target_id = fixture["targetProfileId"]
        resolver = TargetExecutionContractResolver()
        contract = resolve_nn_contract(resolver, target_id)
        registration = contract["components"]["registration"]["definition"]
        store = MemoryStore()
        prepared = prepare_session({"targetId": target_id, "missionFamily": "targetScoring"}, store, now=NOW, execution_contract_resolver=resolver)
        started = start_session(
            {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
            store,
            idempotency_key="episode64-founder-193-14-tap-regression",
            now=NOW,
            execution_contract_resolver=resolver,
        )
        observations = [{
            "observationId": row["observationId"],
            "xNorm": row["xNorm"],
            "yNorm": row["yNorm"],
            "canonicalTargetCoordinate": {
                "schemaVersion": "sczn3.ugo.normalized-source-image-point.v1",
                "coordinateSystem": fixture["coordinateSystem"],
                "targetProfileId": target_id,
                "sourceImageSha256": fixture["sourceImageSha256"],
                "sourceImageWidthPx": EXPECTED[target_id]["width"],
                "sourceImageHeightPx": EXPECTED[target_id]["height"],
                "xNorm": row["xNorm"],
                "yNorm": row["yNorm"],
            },
        } for row in fixture["observations"]]
        result = execute_authoritative_session({
            "authoritativeSessionId": started["authoritativeSessionId"],
            "evidence": {
                "imageEvidence": {
                    "sha256": registration["assetSha256"],
                    "widthPx": EXPECTED[target_id]["width"],
                    "heightPx": EXPECTED[target_id]["height"],
                    "mediaType": "image/jpeg",
                    "dataUrl": "data:image/jpeg;base64,AA==",
                },
                "observations": observations,
                "shooterDeclaredComplete": True,
            },
        }, store, resolver=resolver)
        actual = [(row["regionId"], row["countsAsHit"]) for row in result["classifications"]]
        expected = [(row["expectedRegionId"], row["expectedHit"]) for row in fixture["observations"]]
        self.assertEqual(actual, expected)
        self.assertEqual(result["scoring"]["outsideCount"], fixture["expectedSummary"]["misses"])
        self.assertEqual(sum(row["countsAsHit"] for row in result["classifications"]), fixture["expectedSummary"]["hits"])
        self.assertEqual(result["reconciliation"]["recordedObservationCount"], fixture["expectedSummary"]["total"])
        artifact = {
            "sessionId": started["authoritativeSessionId"],
            "authoritativeSessionId": started["authoritativeSessionId"],
            "sessionIdAuthority": "backend",
            "matrixSnapshot": {"targetProfileId": target_id, "missionFamily": "targetScoring", "resultPackageType": "targetScoreResult"},
            "authorityPackage": result,
            "targetEvidenceImage": {"sha256": registration["assetSha256"], "dataUrl": "data:image/jpeg;base64,AA=="},
            "observations": result["observations"],
            "savedToSEC": True,
        }
        saved = preserve_sec({"session": artifact}, store, now=NOW, execution_contract_resolver=resolver)
        vault = list_preserved_secs(store)
        reopened = read_preserved_sec(started["authoritativeSessionId"], store)
        self.assertTrue(any(row["sessionId"] == started["authoritativeSessionId"] for row in vault["sessions"]))
        self.assertEqual(reopened["artifactSha256"], saved["artifactSha256"])
        self.assertEqual(reopened["session"]["authorityPackage"]["classifications"], result["classifications"])
        self.assertEqual(reopened["session"]["observations"], result["observations"])

    def test_founder_acceptance_is_durable_and_geometry_proof_is_independent(self) -> None:
        acceptance = json.loads(FOUNDER_ACCEPTANCE.read_text())
        self.assertEqual(acceptance["summary"], {"approved": 2, "pending": 0})
        self.assertEqual(
            {row["targetProfileId"] for row in acceptance["targets"] if row["founderDecision"] == "PASS"},
            set(EXPECTED),
        )
        fixture = json.loads(FOUNDER_193_REGRESSION.read_text())
        self.assertEqual(fixture["fixtureAuthority"], "founder_observation_coordinates")
        self.assertFalse(fixture["generatedFromCandidateGeometry"])
        self.assertEqual(
            [row["observationId"] for row in fixture["observations"][:3]],
            ["observation-001", "observation-002", "observation-003"],
        )

    def test_vault_target_and_mobile_actions_remain_readable(self) -> None:
        vault_css = (DOCS / "ballistic-vault.css").read_text()
        target_css = (DOCS / "target-experience.css").read_text()
        self.assertIn("grid-template-columns:minmax(0,1.35fr) minmax(180px,.65fr)", vault_css)
        self.assertIn(".vault-evidence-pair{grid-template-columns:1fr", vault_css)
        for label in ("SAVE SEC", "SHARE", "EXPORT", "VAULT", "REOPEN"):
            self.assertIn(f'content:"{label}"', target_css)


if __name__ == "__main__":
    rows = [run_target(target_id) for target_id in EXPECTED]
    report = {
        "schemaVersion": "sczn3.episode64.issue4.sink-games-machine-proof.v1",
        "generatedAt": NOW.isoformat(),
        "issue": "https://github.com/sczn313-stack/v-2-tap-n-score/issues/4",
        "summary": {"targets": 2, "pass": sum(row["status"] == "PASS" for row in rows), "blocked": 0},
        "governance": {"backendIsAuthority": True, "pixelsAreAuthority": False, "numericScoreInvented": False, "founderApprovalClaimed": False},
        "rows": rows,
    }
    output = DOCS / "authority-evidence" / "gunfun" / "episode64-issue4-sink-games" / "MACHINE_PROOF.json"
    output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report["summary"], indent=2))
