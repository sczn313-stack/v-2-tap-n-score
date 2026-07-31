from .authority_service import build_authority_package


def point(x, y, shot_id=None):
    value = {"xPercent": x, "yPercent": y}
    if shot_id:
        value["shotId"] = shot_id
    return value


M4_IRON_AUTHORITY_ID = "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28"


def package(impacts, aim=None, phase="initial", proven_mechanics=False):
    payload = {
        "aimCoordinate": aim or point(50, 48.7),
        "impactCoordinates": impacts,
        "distance": {"value": 25, "unit": "m"},
        "targetAuthorityGeometry": {
            "bullCoordinate": {
                "xPercent": 50,
                "yPercent": 50,
                "source": "client-supplied-invalid-override",
            }
        },
        "shooterSetup": {
            "opticType": "Iron Sights",
            "adjustmentSystem": "M4_IRON_DCH_FSP" if proven_mechanics else "M4_IRON",
        },
        "phase": phase,
    }
    if proven_mechanics:
        payload["equipmentAuthorityRecordId"] = M4_IRON_AUTHORITY_ID
        payload["shooterSetup"]["equipmentAuthorityRecordId"] = M4_IRON_AUTHORITY_ID
    return build_authority_package(payload)


def group(x, y, prefix):
    return [
        point(x - 0.2, y, f"{prefix}-1"),
        point(x + 0.2, y, f"{prefix}-2"),
        point(x, y, f"{prefix}-3"),
    ]


def test_poib_is_calculated_only_from_confirmed_impacts():
    impacts = [point(40, 42, "one"), point(50, 48, "two"), point(60, 60, "three")]
    result = package(impacts, aim=point(5, 95))
    assert result["poib"] == {"xPercent": 50.0, "yPercent": 50.0}
    assert result["lineage"]["poibDerivedFrom"] == ["one", "two", "three"]


def test_confirmed_aim_is_session_authority_and_bull_remains_geometry():
    first = package(group(40, 40, "first"), aim=point(12, 88))
    second = package(group(60, 60, "second"), aim=point(88, 12))
    assert first["vectors"]["poibToConfirmedAim"]["end"]["xPercent"] == 12.0
    assert first["vectors"]["poibToConfirmedAim"]["end"]["yPercent"] == 88.0
    assert second["vectors"]["poibToConfirmedAim"]["end"]["xPercent"] == 88.0
    assert second["vectors"]["poibToConfirmedAim"]["end"]["yPercent"] == 12.0
    assert first["renderCoordinates"]["bull"]["xPercent"] == 50.0
    assert first["renderCoordinates"]["bull"]["yPercent"] == 48.7
    assert first["lineage"]["correctionDerivedFrom"] == ["confirmed-aim-point", "poib"]
    assert first["confirmedAimPointAuthority"]["status"] == "confirmed"
    assert first["aimPointDiscrepancy"]["status"] == "measured"
    assert first["aimPointDiscrepancy"]["judgment"] == "unavailable"


def test_required_group_positions():
    cases = {
        "high-left": (40, 40, "RIGHT", "DOWN"),
        "high-right": (60, 40, "LEFT", "DOWN"),
        "low-left": (40, 60, "RIGHT", "UP"),
        "low-right": (60, 60, "LEFT", "UP"),
    }
    for name, (x, y, windage, elevation) in cases.items():
        result = package(group(x, y, name))
        assert result["correction"]["windageDirection"] == windage
        assert result["correction"]["elevationDirection"] == elevation
        assert result["geometryValidation"]["status"] == "calculated"
        assert result["geometryValidation"]["vectorStart"] == "POIB"
        assert result["geometryValidation"]["vectorEnd"] == "CONFIRMED_AIM_POINT"


def test_on_confirmed_aim_is_near_zero_and_confirmation_ready():
    result = package(group(50, 48.7, "bull"), phase="confirmation")
    assert result["geometryValidation"]["magnitudeInches"] == 0
    assert result["correction"]["aimMinusPOIBInches"] == {"x": 0.0, "y": 0.0}
    assert result["clicks"] is None
    assert result["validation"]["outcome"] == "CONFIRMED"


def test_confirmed_aim_not_bull_controls_zero_and_confirmation():
    aim = point(62, 35, "confirmed-aim")
    result = package(group(62, 35, "aim"), aim=aim, phase="confirmation")
    assert result["geometryValidation"]["magnitudeInches"] == 0
    assert result["correction"]["aimMinusPOIBInches"] == {"x": 0.0, "y": 0.0}
    assert result["renderCoordinates"]["vector"]["end"] == result["inputs"]["confirmedAimPoint"]
    assert result["renderCoordinates"]["vector"]["end"] != result["inputs"]["registeredBullCoordinate"]
    assert result["validation"]["outcome"] == "CONFIRMED"


def test_geometry_is_available_while_unproven_mechanics_are_withheld():
    result = package(group(55, 45, "unproven"))
    assert result["angular"]["windageMOA"] > 0
    assert result["angular"]["windageMRAD"] > 0
    assert result["geometryValidation"]["status"] == "calculated"
    assert result["mechanicalValidation"]["status"] == "unavailable"
    assert result["clicks"] is None
    assert result["correction"]["windage"] is None


def test_proven_weapon_library_record_returns_axis_specific_clicks():
    result = package(group(55, 45, "proven"), proven_mechanics=True)
    assert result["mechanicalValidation"]["status"] == "calculated"
    assert result["clicks"]["model"]["windagePerClick"] == 0.75
    assert result["clicks"]["model"]["elevationPerClick"] == 1.5
    assert result["clicks"]["model"]["authorityId"] == M4_IRON_AUTHORITY_ID
    assert result["mechanicalSightAuthority"]["recordId"] == M4_IRON_AUTHORITY_ID
    assert result["mechanicalSightAuthority"]["status"] == "proven"
    assert result["clicks"]["windageTurnDirection"] in ("CLOCKWISE", "COUNTERCLOCKWISE")
    assert result["clicks"]["elevationTurnDirection"] in ("CLOCKWISE", "COUNTERCLOCKWISE")
    assert result["clicks"]["windageClicks"] != result["clicks"]["elevationClicks"]


def test_full_click_chain_reconciles_26_44_moa_to_35_left():
    result = package(group(94.2, 48.7, "reconcile"), proven_mechanics=True)
    trace = result["calculationReconciliation"]
    windage = trace["axes"]["windage"]
    assert result["correction"]["windageDirection"] == "LEFT"
    assert result["angular"]["windageMOA"] == 26.4406
    assert windage["displayedAngularValue"] == 26.44
    assert windage["clickConstant"] == 0.75
    assert windage["rawClicks"] == 35.2541
    assert windage["roundingRule"] == "nearest-whole-click-half-to-even"
    assert windage["expectedClicks"] == 35
    assert windage["displayedExpectedClicks"] == 35
    assert windage["displayedClicks"] == 35
    assert result["clicks"]["windageClicks"] == 35
    assert trace["status"] == "reconciled"
    assert result["mechanicalValidation"]["calculationReconciliation"] == "reconciled"


def test_client_claim_cannot_create_m4_mechanical_authority():
    result = build_authority_package({
        "aimCoordinate": point(50, 48.7),
        "impactCoordinates": group(55, 45, "injected"),
        "distance": {"value": 25, "unit": "m"},
        "mechanicalAuthority": {
            "status": "proven",
            "source": "client-injected",
            "turnDirections": {"windage": "fabricated", "elevation": "fabricated"},
        },
        "shooterSetup": {
            "opticType": "Iron Sights",
            "adjustmentSystem": "M4_IRON",
            "windageClickMOA": 0.5,
            "elevationClickMOA": 1.25,
        },
    })
    assert result["mechanicalValidation"]["status"] == "unavailable"
    assert result["clicks"] is None


def test_traceability_and_hash():
    result = package([point(50, 48.7, "alpha"), point(51, 48.7, "bravo")])
    assert result["lineage"]["sourceShotIds"] == ["alpha", "bravo"]
    assert result["bullCoordinateAuthority"]["status"] == "founder-approved"
    assert result["bullCoordinateAuthority"]["authorityId"] == "M4-BULL-COORDINATE-AUTHORITY-2026-07-28"
    assert result["geometryMetadata"]["bullCoordinate"]["source"] == "M4-BULL-COORDINATE-AUTHORITY-2026-07-28"
    assert len(result["evidenceHash"]) == 64


if __name__ == "__main__":
    tests = [value for name, value in globals().copy().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS {test.__name__}")
    print(f"PASS {len(tests)} M4 authority tests")
