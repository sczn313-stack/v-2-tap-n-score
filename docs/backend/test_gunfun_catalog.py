#!/usr/bin/env python3
from manufacturer_catalogs.gunfun_catalog import gunfun_catalog_package


def main():
    package = gunfun_catalog_package()
    assert package["ok"] is True
    assert package["manufacturer"]["id"] == "gunfun"
    assert package["collectionPurpose"] == ["collection_bucket", "lie_detector"]
    assert package["smartTargetPricing"]["surchargePerTargetUsd"] == 0.10
    assert len(package["records"]) == 10
    seen = set()
    for record in package["records"]:
        assert record["gunfunSku"] not in seen
        seen.add(record["gunfunSku"])
        assert record["smartTargetSku"] == f"ST-GF-{record['gunfunSku']}"
        assert round(record["proposedSmartTargetPriceUsd"] - record["publishedSingleTargetPriceUsd"], 2) == 0.10
        assert record["sourceStatus"] == "publicly_verified"
        assert record["smartTargetStatus"] == "concept_only"
        assert record["productUrl"].startswith("https://gunfun.com/")
        assert record["imageUrl"].startswith("https://gunfun.com/")
    print("GunFun manufacturer catalog tests passed")


if __name__ == "__main__":
    main()
