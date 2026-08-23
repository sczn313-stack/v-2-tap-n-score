# Thompson Publisher #12 — Source Ledger

Observation date: 2026-08-23

## Primary publisher evidence

| Source | Evidence preserved / used | Grade | Local preservation |
|---|---|---|---|
| [Thompson Target home](https://www.thompsontarget.com/) | Publisher brand, current family navigation, direct-sale catalog, retail prices, product families, Ohio-made claim | A — publisher primary | `sources/external/thompson-homepage.html` |
| [Thompson contact](https://www.thompsontarget.com/page_contact_form/) | Exact corporate identity/address: Thompson Target Inc., 3651 Apache St NW, Uniontown, OH 44685; office/warehouse; wholesale contact; Ohio manufacturing statement | A — publisher primary | `sources/external/thompson-contact.html` |
| [Thompson dealer portal](https://thompson.accelgrid.com/) | Family-owned identity, industrial building/warehouse, nationwide sporting-goods/gun-shop/range distribution, retail and bulk/dealer channels | A — publisher primary | `sources/external/thompson-dealer-portal.html` |
| [Public product sitemap](https://www.thompsontarget.com/xmlsitemap.php?type=products&page=1) | Complete observed public product-page population (129 canonical pages) | A — publisher primary | `sources/product-sitemap.xml` |
| 129 canonical Thompson product pages | Exact names, canonical URLs, descriptions/instructions, dimensions where in title, images, base identifiers and retail prices | A — publisher primary | `sources/products/*.html`; SHA-256 in `sources/download-manifest.json` |
| Public BigCommerce storefront option endpoint for each package choice | Exact package label, variant SKU, exposed UPC/MPN, price and stock response for 280 option combinations | A — publisher storefront primary | `sources/variants/*.json`; request/evidence mapping in `sources/variant-manifest.json` |

## Independent / organization evidence

| Source | Evidence preserved / used | Grade | Limitation |
|---|---|---|---|
| [SIG SAUER 12.5 x 19 training target, 25-pack](https://www.sigsauer.com/training-target-12-5-x-19-25pack.html) | SIG identifies a target designed in collaboration with Thompson; 25-pack, SIG SKU 8300884, $14.99 observed | A — counterpart primary | Establishes this product collaboration, not a catalog-wide partnership or Thompson annual volume. |
| [USPSA official vendors](https://uspsa.org/official-vendors) | Organization-side check for the Thompson-labeled IPSC/USPSA product | A — organization primary | No Thompson relationship was established by the public directory reviewed. Absence from one directory is not proof that no license/relationship exists. |
| [Runnings Thompson Target brand page](https://www.runnings.com/brand/thompson-target) | Current multi-product retailer presence and package examples | B — retailer primary | Availability is a channel indicator, not manufacturer unit sales. |
| [Vance Outdoors Thompson Target assortment](https://www.vanceoutdoors.com/category.cfm/outdoors/firearm-targets/brand/thompson-target) | Current specialty retailer assortment | B — retailer primary | Assortment does not reveal annual velocity. |

## Evidence discipline

- No audited annual Thompson unit sales, paper-target revenue, production
  throughput, dealer sell-through, or package-weighted sales mix was found.
- Public retail/bulk prices are preserved. Dealer access exists, but public pages
  do not expose negotiated dealer/wholesale terms; none are invented.
- `IPSC/USPSA`, `B27Q`, `qualification`, `law enforcement`, and similar product
  labeling are retained as publisher claims/product relationships. They are not
  silently promoted into organization endorsement, current course authority, or
  official qualification authority.
- Product images are recognition-ready evidence; that does not claim photo
  recognition has been implemented.
- Observation history is dated. Prices, availability, pages and organization
  listings can change.

## Update procedure

1. Re-run `collect_thompson_catalog.py` to refresh canonical product pages and
   their hash manifest.
2. Re-run `collect_thompson_variants.py` to refresh public variant responses.
3. Re-run `normalize_thompson_catalog.py` and inspect denominator changes.
4. Re-run `build_thompson_models.py` without changing the preserved 11-publisher
   baseline.
5. Re-run `validate_thompson.py`; investigate any fail-closed mismatch before
   publishing new totals.
