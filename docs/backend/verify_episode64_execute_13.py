#!/usr/bin/env python3
"""Independent execution proof for the fixed Episode 64 PKF 13 cohort.

The verifier consumes the published cohort without reselecting targets. It
proves every runtime binding through the authoritative Backend lifecycle and
refuses to treat a contract/capability mismatch as a pass.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
BACKEND = DOCS / "backend"
OUTPUT = DOCS / (
    "authority-evidence/platform/episode64-execute-the-13-2026-10-12/"
    "SCZN3_EP64_EXECUTE_13_RUNTIME_PROOF.json"
)
sys.path.insert(0, str(BACKEND))

from execution_authority import execute_authoritative_session  # noqa: E402
from preserved_sec_store import list_preserved_secs, preserve_sec, read_preserved_sec  # noqa: E402
from session_authority import prepare_session, start_session  # noqa: E402
from target_execution_contract import TargetExecutionContractResolver, validate_contract_for_nn  # noqa: E402
from test_target_execution_scale_architecture import MemoryStore  # noqa: E402


SOURCE_PKF_COMMIT = "3472480e050680b917002d20a22480ea53eea55f"
SOURCE_HANDOFF = "records/episode64/2026-10-12-clean-fa-candidate-pool/PROPOSED_13_CODY_HANDOFF.json"
BASE_TIME = datetime(2026, 10, 12, 14, 0, tzinfo=timezone.utc)
REVIEW_ORIGIN = "http://127.0.0.1:8212"
REVIEW_VERSION = "episode64-execute-the-13-2026-10-12"

COHORT = (
    {"master": 25, "printer": "Baker Targets", "name": "Cancer Awareness Target", "canonicalFaceId": "d2104b371e292ed6852228528793af0166801b5483bdb0c656b8ba2bc28e94c1", "runtimeIds": ("blocker_baker_targets_gf_cancerawareness",)},
    {"master": 501, "printer": "Birchwood Casey", "name": "12\" X 18\" Gunslinger Silhouette Dirty Bird Target", "canonicalFaceId": "5c87e0a048d4106c9f4d20ab0ac557e767ea4c53906abd42acfa7b3634a7ec57", "runtimeIds": ("blocker_birchwood_casey_bc_35770",)},
    {"master": 1345, "printer": "Champion Targets / Primos", "name": "Shotkeeper Targets - Large / 5-Bull / Orange/White", "canonicalFaceId": "95bf2d943a0487dbd03f4cb8bf1099421b18e5c424547ce4e2835f49b517c3b4", "runtimeIds": ("blocker_champion_targets_primos_45559",)},
    {"master": 158, "printer": "EZ Aim / Allen Company", "name": "EZ Aim Fun Group Paper Shooting Targets, 12W x 18H", "canonicalFaceId": "7378f7a3ac8f69f1646773c40797a7cefd6151372bcb76ae66eb8d67c997b497", "runtimeIds": ("connect_ez_aim_allen_15643",)},
    {"master": 170, "printer": "GunFun", "name": "Big Balloons (21100)", "canonicalFaceId": "255438d8228dec789c84ad66e0334e8551b3e729032fee842ac3c077deedb227", "runtimeIds": ("gunfun_21100_big_balloons",)},
    {"master": 171, "printer": "GunFun", "name": "Birthday Balloons (11190)", "canonicalFaceId": "c55f902d698bef40a325f86a74b028858d22fb53a89288cba03c703321d27a17", "runtimeIds": ("gunfun_11190_birthday_balloons",)},
    {"master": 688, "printer": "Speedwell Targets", "name": "B 27 E HV", "canonicalFaceId": "6b95fa191fd96db55e2ffa3c16487d37859f326a30d6357bbe25943fec1c2e6f", "runtimeIds": ("evidence_speedwell_targets_b27e_hv",)},
    {"master": 214, "printer": "The National Target Company", "name": "Black Bear Lifesize Game Target", "canonicalFaceId": "ce93eb517dcd4e0e3da36d5da9cba6fe0179317e5218df24dff99e6f876aaedf", "runtimeIds": ("evidence_the_national_target_company_nra_bear",)},
    {"master": 230, "printer": "Thompson Target Inc.", "name": "Bad Ol' Boys Zombie Shooting Targets - 25x38", "canonicalFaceId": "e6798f49d29c0d53af0b13f5bd1ecccdfe5749e18fb007c1e40aeb53ff5b0a35", "runtimeIds": ("blocker_thompson_target_inc_thompson_bad_ol_boys_zombie_shooting_targets_25x38",)},
    {"master": 242, "printer": "U.S. Target Inc.", "name": "Bowling Pins", "canonicalFaceId": "0a6ccf88f03d0714362813174b4f10a158e620b9e52fe7ddbba6c3728381dfdd", "runtimeIds": ("evidence_u_s_target_inc_378",)},
    {"master": 248, "printer": "American Target Company", "name": "3-TB-21-E", "canonicalFaceId": "7298e2e8d505590131bab65ec106ef6f0d6c00e236359a3c33975c4f3f5cf777", "runtimeIds": ("evidence_american_target_company_law_enforcement_20_q100", "evidence_american_target_company_law_enforcement_20_q1000", "evidence_american_target_company_law_enforcement_20_q500")},
    {"master": 669, "printer": "Highwild", "name": "23X35 Inch Shooting Range Silhouette Paper Target", "canonicalFaceId": "f997784d588f02e2d064ac36ecf6de6e2390ffc8c51a1b8efd6ccb86c2b053e1", "runtimeIds": ("blocker_highwild_bfz_2335_20xfgsp",)},
    {"master": 814, "printer": "Splatterburst Targets", "name": "12 x 18 Bad Guy Splatter Target", "canonicalFaceId": "ebce2b3a6ad3e27987ca4a7e33a65b317fffa83af89e15a5b4094076d2dcb640", "runtimeIds": ("blocker_splatterburst_targets_1364",)},
)

SCORING_FIXTURES = {
    "gunfun_21100_big_balloons": {
        "observations": ((0.30, 0.395), (0.349, 0.395), (0.55, 0.275), (0.98, 0.98)),
        "regions": ("red_balloon_x10", "red_balloon_8", "green_balloon_x10", "outside"),
        "score": 28,
    },
    "evidence_u_s_target_inc_378": {
        "observations": ((0.28385714285714286, 0.48857142857142855), (0.28, 0.56), (0.6707142857142856, 0.48857142857142855), (0.95, 0.05)),
        "regions": ("left_pin", "left_pin", "right_pin", "outside"),
        "score": None,
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_evidence(contract: dict[str, Any]) -> dict[str, Any]:
    registration = contract["components"]["registration"]["definition"]
    suffix = Path(registration["assetPath"]).suffix.lower()
    media_type = "image/png" if suffix == ".png" else "image/webp" if suffix == ".webp" else "image/jpeg"
    return {
        "sha256": registration["assetSha256"],
        "widthPx": int(registration.get("sourceImageWidthPx") or 1000),
        "heightPx": int(registration.get("sourceImageHeightPx") or 1000),
        "mediaType": media_type,
        "dataUrl": f"data:{media_type};base64,AA==",
    }


def preserve_result(result: dict[str, Any], session_id: str, contract: dict[str, Any], store: MemoryStore, now: datetime, resolver: TargetExecutionContractResolver) -> tuple[dict[str, Any], dict[str, Any]]:
    artifact = {
        "sessionId": session_id,
        "authoritativeSessionId": session_id,
        "sessionIdAuthority": "backend",
        "matrixSnapshot": {
            "targetProfileId": result["target"]["id"],
            "missionFamily": result["missionFamily"],
            "resultPackageType": result["resultPackageType"],
        },
        "authorityPackage": result,
        "targetEvidenceImage": image_evidence(contract),
        "observations": result["observations"],
        "savedToSEC": True,
    }
    saved = preserve_sec({"session": artifact}, store, now=now, execution_contract_resolver=resolver)
    vault = list_preserved_secs(store)
    assert any(item["sessionId"] == session_id for item in vault["sessions"]), "vault_session_missing"
    assert any(item["sessionId"] == session_id and item["artifactSha256"] == saved["artifactSha256"] for item in vault["artifacts"]), "vault_artifact_missing"
    reopened = read_preserved_sec(session_id, store)
    assert reopened["artifactSha256"] == saved["artifactSha256"], "exact_reopen_hash_drift"
    assert reopened["session"]["authorityPackage"] == result, "exact_reopen_result_drift"
    assert reopened["session"]["observations"] == result["observations"], "exact_reopen_observation_drift"
    return saved, reopened


def run_binding(runtime_id: str, canonical_face_id: str, ordinal: int, resolver: TargetExecutionContractResolver) -> dict[str, Any]:
    stages = {stage: "NOT_RUN" for stage in ("LOAD", "TAP", "RESULT", "CONFIRM", "SEC", "VAULT", "EXACT_REOPEN")}
    now = BASE_TIME + timedelta(minutes=ordinal)
    store = MemoryStore()
    contract = resolver.resolve(runtime_id)
    registration = contract["components"]["registration"]["definition"]
    geometry = contract["components"]["geometry"]["definition"]
    scoring = contract["components"]["scoring"]["definition"]
    asset_path = DOCS / registration["assetPath"]
    assert contract["targetProfile"]["id"] == runtime_id, "contract_target_identity_drift"
    assert asset_path.is_file(), "registered_artwork_missing"
    assert registration["assetSha256"] == canonical_face_id, "registered_artwork_not_canonical_face"
    assert sha256(asset_path) == canonical_face_id, "registered_artwork_digest_mismatch"
    stages["LOAD"] = "PASS"

    mission_family = contract["missionFamily"]
    if mission_family == "smartEvidenceCapture":
        assert contract["executor"]["id"] == "smart-evidence-capture"
        assert scoring.get("status") == "not_applicable", "evidence_only_contract_claims_scoring"
        assert not geometry.get("regions"), "evidence_only_contract_claims_regions"
        observations = [{"xNorm": 0.25, "yNorm": 0.25}, {"xNorm": 0.50, "yNorm": 0.50}, {"xNorm": 0.75, "yNorm": 0.75}]
        expected_capability = "Evidence Only"
    elif mission_family == "targetScoring":
        if scoring.get("status") != "complete" or not geometry.get("regions"):
            return {
                "runtimeId": runtime_id,
                "status": "BLOCKED",
                "capability": "Evidence Only ceiling in authority; active contract incorrectly routes through targetScoring",
                "blocker": "CONTRACT_CAPABILITY_MISMATCH: targetScoring executor has no governed scoring regions or complete scoring authority",
                "contractId": contract["contractId"],
                "registeredArtwork": registration["assetPath"],
                "artworkSha256": canonical_face_id,
                "stages": stages,
            }
        contract = validate_contract_for_nn(contract)
        fixture = SCORING_FIXTURES.get(runtime_id)
        assert fixture is not None, "missing_independent_scoring_fixture"
        observations = [{"xNorm": x, "yNorm": y} for x, y in fixture["observations"]]
        expected_capability = "Scoring" if fixture["score"] is not None else "Zone Counting"
    else:
        raise AssertionError(f"unsupported_mission_family:{mission_family}")

    prepared = prepare_session({"targetId": runtime_id, "missionFamily": mission_family}, store, now=now, execution_contract_resolver=resolver)
    started = start_session(
        {"preparationToken": prepared["preparationToken"], "selectedEquipment": prepared["standardSetup"]},
        store,
        idempotency_key=f"ep64-execute-13-{ordinal:02d}",
        now=now,
        execution_contract_resolver=resolver,
    )
    session_id = started["authoritativeSessionId"]
    stages["TAP"] = "PASS"
    result = execute_authoritative_session(
        {
            "authoritativeSessionId": session_id,
            "evidence": {"imageEvidence": image_evidence(contract), "observations": observations, "shooterDeclaredComplete": True},
        },
        store,
        resolver=resolver,
    )
    assert result["target"]["id"] == runtime_id, "result_target_identity_drift"
    assert len(result["observations"]) == len(observations), "result_observation_loss"
    stages["RESULT"] = "PASS"

    if mission_family == "smartEvidenceCapture":
        assert result.get("supportedAnalysis") == {"impactCount": len(observations)}, "evidence_count_incorrect"
        assert result.get("scoring", {}).get("status") == "not_applicable", "evidence_result_invented_scoring"
        assert result.get("reconciliation") == {"capturedObservationCount": len(observations), "acceptedObservationCount": len(observations), "countsMatch": True}, "evidence_reconciliation_failed"
        functional_result = {"impactCount": len(observations), "hitMissAccounting": "NOT_APPLICABLE_TO_EVIDENCE_ONLY"}
    else:
        fixture = SCORING_FIXTURES[runtime_id]
        classifications = [item.get("regionId") or "outside" for item in result["classifications"]]
        assert classifications == list(fixture["regions"]), (fixture["regions"], classifications)
        scoring_result = result["scoring"]
        assert int(scoring_result["observationCount"]) == len(observations), "scoring_total_taps_incorrect"
        assert int(scoring_result["outsideCount"]) == 1, "scoring_miss_count_incorrect"
        if fixture["score"] is not None:
            assert scoring_result.get("total") == fixture["score"], "publisher_score_incorrect"
        functional_result = {"regions": classifications, "hitTaps": len(observations) - 1, "misses": 1, "totalTaps": len(observations), "score": scoring_result.get("total")}
    stages["CONFIRM"] = "PASS"

    saved, _ = preserve_result(result, session_id, contract, store, now, resolver)
    stages["SEC"] = "PASS"
    stages["VAULT"] = "PASS"
    stages["EXACT_REOPEN"] = "PASS"
    return {
        "runtimeId": runtime_id,
        "status": "PASS",
        "capability": expected_capability,
        "contractId": contract["contractId"],
        "contractVersion": contract["contractVersion"],
        "executor": contract["executor"]["id"],
        "registeredArtwork": registration["assetPath"],
        "artworkSha256": canonical_face_id,
        "governedRegionCount": len(geometry.get("regions", [])),
        "publisherAuthority": scoring.get("publisherRuleAuthority"),
        "observations": observations,
        "functionalResult": functional_result,
        "sessionId": session_id,
        "artifactSha256": saved["artifactSha256"],
        "stages": stages,
    }


def main() -> None:
    resolver = TargetExecutionContractResolver()
    rows: list[dict[str, Any]] = []
    ordinal = 0
    for face in COHORT:
        bindings: list[dict[str, Any]] = []
        for runtime_id in face["runtimeIds"]:
            ordinal += 1
            try:
                bindings.append(run_binding(runtime_id, face["canonicalFaceId"], ordinal, resolver))
            except Exception as error:
                bindings.append({"runtimeId": runtime_id, "status": "BLOCKED", "blocker": f"{type(error).__name__}:{error}"})
        row_status = "PASS" if all(item["status"] == "PASS" for item in bindings) else "BLOCKED"
        primary_runtime_id = face["runtimeIds"][0]
        primary_contract = resolver.resolve(primary_runtime_id)
        founder_walk_ordinal = len(rows) + 1
        launch_url = (
            f"{REVIEW_ORIGIN}/target-experience.html"
            f"?missionFamily={primary_contract['missionFamily']}"
            f"&target={primary_runtime_id}"
            f"&source=registered&founderWalk=1&fw={founder_walk_ordinal}"
            f"&authorityPort=8212&v={REVIEW_VERSION}"
        )
        rows.append({**face, "status": row_status, "launchUrl": launch_url, "runtimeProofs": bindings})

    passing_rows = sum(row["status"] == "PASS" for row in rows)
    passing_bindings = sum(item["status"] == "PASS" for row in rows for item in row["runtimeProofs"])
    blocked_bindings = sum(item["status"] == "BLOCKED" for row in rows for item in row["runtimeProofs"])
    payload = {
        "schemaVersion": "sczn3.episode64.execute-13-runtime-proof.v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {"pkfCommit": SOURCE_PKF_COMMIT, "handoffPath": SOURCE_HANDOFF},
        "governance": {
            "backendIsAuthority": True,
            "pixelIsAuthority": False,
            "founderAcceptanceClaimed": False,
            "selectionRepeated": False,
            "unsupportedSemanticsInvented": False,
        },
        "summary": {
            "faces": len(rows),
            "passingFaces": passing_rows,
            "blockedFaces": len(rows) - passing_rows,
            "runtimeBindings": ordinal,
            "passingRuntimeBindings": passing_bindings,
            "blockedRuntimeBindings": blocked_bindings,
        },
        "rows": rows,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))
    if passing_rows + (len(rows) - passing_rows) != 13:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
