#!/usr/bin/env python3
"""Founder-pending review host for the PKF-fixed Episode 64 cohort of 13."""
from __future__ import annotations

import os
from http.server import ThreadingHTTPServer

import episode64_mona_lisa_20_review_server as shared


HOST = "127.0.0.1"
PORT = int(os.environ.get("EP64_EXECUTE_13_PORT", "8212"))
COHORT = (
    ("Cancer Awareness Target", "blocker_baker_targets_gf_cancerawareness"),
    ("12 X 18 Gunslinger Silhouette Dirty Bird Target", "blocker_birchwood_casey_bc_35770"),
    ("Shotkeeper Targets - Large / 5-Bull / Orange/White", "blocker_champion_targets_primos_45559"),
    ("EZ Aim Fun Group Paper Shooting Targets", "connect_ez_aim_allen_15643"),
    ("Big Balloons (21100)", "gunfun_21100_big_balloons"),
    ("Birthday Balloons (11190)", "gunfun_11190_birthday_balloons"),
    ("B 27 E HV", "evidence_speedwell_targets_b27e_hv"),
    ("Black Bear Lifesize Game Target", "evidence_the_national_target_company_nra_bear"),
    ("Bad Ol' Boys Zombie Shooting Targets - 25x38", "blocker_thompson_target_inc_thompson_bad_ol_boys_zombie_shooting_targets_25x38"),
    ("Bowling Pins", "evidence_u_s_target_inc_378"),
    ("3-TB-21-E", "evidence_american_target_company_law_enforcement_20_q100"),
    ("23X35 Inch Shooting Range Silhouette Paper Target", "blocker_highwild_bfz_2335_20xfgsp"),
    ("12 x 18 Bad Guy Splatter Target", "blocker_splatterburst_targets_1364"),
)


def manifest() -> dict:
    targets = []
    for number, (review_name, runtime_id) in enumerate(COHORT, start=1):
        contract = shared.RESOLVER.resolve(runtime_id)
        profile = contract["targetProfile"]
        targets.append(
            {
                "founderNumber": number,
                "reviewName": review_name,
                "targetName": profile["product"].get("shooterFacingName") or profile["product"]["name"],
                "printer": profile["publisher"]["name"],
                "runtimeId": runtime_id,
                "missionFamily": contract["missionFamily"],
                "contractId": contract["contractId"],
                "contractVersion": contract["contractVersion"],
                "resultPackageType": contract["resultPackageType"],
                "founderStatus": "PENDING",
            }
        )
    return {
        "schemaVersion": "sczn3-founder-review-v1",
        "walkId": "episode64-execute-the-13-founder-pending",
        "walkSize": len(targets),
        "reviewLabel": "EPISODE 64 · EXECUTE THE 13 · FOUNDER PENDING",
        "queryVersion": "episode64-execute-the-13-2026-10-12",
        "sequencePolicy": "Fixed PKF handoff order; no Founder Acceptance claimed",
        "targets": targets,
    }


shared.HOST = HOST
shared.PORT = PORT
shared.SIGNING_KEY = "episode64-execute-the-13-founder-pending-v1"
shared.MANIFEST = manifest()


if __name__ == "__main__":
    first = shared.MANIFEST["targets"][0]
    review_url = (
        f"http://{HOST}:{PORT}/target-experience.html?missionFamily={first['missionFamily']}"
        f"&target={first['runtimeId']}&source=registered&founderWalk=1&fw=1"
        f"&authorityPort={PORT}&v={shared.MANIFEST['queryVersion']}"
    )
    print(f"Episode 64 Execute 13 review: {review_url}", flush=True)
    ThreadingHTTPServer((HOST, PORT), shared.Handler).serve_forever()
