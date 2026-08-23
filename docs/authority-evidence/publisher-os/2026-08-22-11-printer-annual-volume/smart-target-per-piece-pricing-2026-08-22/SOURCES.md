# Pricing Source Ledger

Observed 2026-08-22. Primary publisher pages and preserved P-OS records control
package counts and current observed prices. Search indexes and third-party
retailers are not used to override publisher evidence.

| Ref | Source | Use |
|---|---|---|
| V-01 | [Parent annual-volume model](../MODEL.json) | Exact 12.05M / 24.55M / 45.00M annual physical-piece cases. |
| P-01 | [P-OS 11-publisher master summary](../../PUBLISHER_OS_11_PUBLISHER_MASTER_SUMMARY_2026-08-21.md) | Eleven-publisher catalog denominator. |
| B-01 | [Baker wholesale catalog](https://bakertargets.com/product-tag/wholesale-targets/) | Current 250-piece package prices across standard, large, specialty, and qualification targets. |
| B-02 | [Baker 250-pack example](https://bakertargets.com/product/easter-shoot-target-250-pack/) | Supported 250/500/750/1,000 tiers and current prices. |
| G-01 | [Preserved GunFun Batch 2 product pages](../../../gunfun/episode56/batch2/publisher-pages/) | Twelve exact publisher unit prices, SKUs, and descriptions. |
| G-02 | [GunFun Shotgun SKU 53620 preserved page](../../../gunfun/episode56/batch2/publisher-pages/53620.html) | $0.52 publisher unit price; sold in multiples of 250. |
| S-01 | [Preserved Splatterburst catalog](../../2026-08-20-five-publisher-batch/normalized/splatterburst.json) | Direct prices, product names, and variable package quantities. |
| S-02 | [Splatterburst dealer program](https://splatterburstdealer.com/) | Dealer case counts and prices for 250- and 600-piece cases. |
| H-01 | [Highwild paper-target collection](https://www.highwildoutdoors.com/collections/non-splatter-targets) | Current direct paper-target packages, regular/sale prices, and sizes. |
| H-02 | [Highwild 50-pack cardboard](https://www.highwildoutdoors.com/products/13-x-16-cardboard-targets-pack-of-50) | $36.99 / 50 supported cardboard example. |
| BC-01 | [Birchwood Casey Shoot-N-C collection](https://www.birchwoodcasey.com/targets/shoot-n-c-targets/) | Direct current multi-pack counts and prices. |
| BC-02 | [Birchwood Casey reactive collection](https://www.birchwoodcasey.com/reactive/) | Current Dirty Bird, PREGAME, and Shoot-N-C package/price examples. |
| BC-03 | [Shoot-N-C 132-target pack](https://www.birchwoodcasey.com/products/shoot-n-c-variety-pack-132-targets.html) | $7.99 / 132 and published bulk discount tiers. |
| E-01 | [Official EZ Aim collection](https://byallen.com/collections/ezaim) | Current direct paper, reactive, corrugated, and other target prices/counts. |
| E-02 | [EZ Aim 100-pack standard paper](https://byallen.com/ez-aim-paper-shooting-targets-sight-in-grid-peel-away-target-pad-12-square-100-pack-orange-black-white-15333-100) | $17.99 / 100 exact SKU example. |
| C-01 | [Champion paper targets](https://www.championtarget.com/targets-and-range-gear/paper/) | Current direct paper-family price ranges. |
| C-02 | [Champion current product guide](https://www.championtarget.com/on/demandware.static/-/Library-Sites-HuntShootAccessoriesSharedLibrary/default/v788a6d596bfe59e91bd2cfc1f23452c50a0eeeb9/championtarget/pdf/CH-2024_Champion_ProductGuide_Catalog_V4.pdf) | Package quantities by paper SKU/family. |
| A-01 | [Preserved American Target normalized catalog](../../2026-08-21-nra-four-publisher-expansion/normalized/american-target.json) | 518 exact package/price pairs and corpus distribution. |
| A-02 | [American Target small-bore catalog](https://www.americantargetcompany.com/small_bore_rifle_targets.asp) | Current 500/1,000-piece published prices. |
| N-01 | [Preserved National Target normalized catalog](../../2026-08-21-nra-four-publisher-expansion/normalized/national-target.json) | Exact normalized package-price pairs. |
| N-02 | [National TQ-7](https://nationaltarget.com/shop/tq-7/) | $7.15 / 100 exact inexpensive qualification-paper example. |
| N-03 | [National A-7/5](https://nationaltarget.com/shop/a-7-5/) | $16.23 / 100 exact standard paper example. |
| N-04 | [National B-27](https://nationaltarget.com/shop/b-27-24/) | $60.50 / 100 large-format silhouette example. |
| SP-01 | [Preserved Speedwell normalized catalog](../../2026-08-21-nra-four-publisher-expansion/normalized/speedwell.json) | 146 exact shootable package-price pairs. |
| SP-02 | [Speedwell SKU 601](https://www.speedwelltargets.com/Hostile-Man-With-Gun-p/601.htm) | $99 / 100 exact specialty example. |
| US-01 | [U.S. Target silhouette catalog](https://ustargetinc.com/silhouette/) | Current 100-piece counts, direct prices, and volume-discount availability. |
| US-02 | [Preserved U.S. Target normalized catalog](../../2026-08-21-nra-four-publisher-expansion/normalized/us-target.json) | Product identities and observed prices; package parsing limitation documented. |

## Evidence limitations

- Publisher list/direct prices are not publisher net realized prices after
  dealer, distributor, institutional, promotional, or freight economics.
- No publisher provides sales weights by SKU, so the medians are catalog/sample
  medians rather than weighted selling-price averages.
- Sale prices can change. They remain dated observations.
- The proposed 10% guardrail therefore requires contract reporting based on
  auditable net invoice price classes, not the public catalog median.

