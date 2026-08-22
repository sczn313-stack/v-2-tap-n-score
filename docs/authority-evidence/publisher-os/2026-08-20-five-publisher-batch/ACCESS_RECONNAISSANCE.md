# Five-Publisher Batch — Access / Dependency Reconnaissance

## Result

**CLEAR — no Founder action required.**

The opening reconnaissance reviewed the five publisher catalogs, the existing Baker/GunFun P-OS model, the Episode 56 capability owners, and the likely source paths before deep ingestion. No credential, paid source, external account, repository permission, or new governance authorization was required.

## Publisher access

| Publisher | Primary public source | Result | Dependency disposition |
|---|---|---|---|
| Splatterburst Targets | Publisher WooCommerce/WordPress catalog | Public catalog and offered-for-sale facts available | Proceeded |
| Highwild | Publisher Shopify catalog | Public catalog, variants, SKUs, descriptions, prices, stock state, and images available | Proceeded |
| Birchwood Casey | Publisher live target catalog plus branded catalog PDF | Direct command-line request rejected with HTTP 403 by Imperva; the live catalog was accessible in the in-app browser. A public branded catalog supplied supplemental historical context. | Not a Founder gate; proceeded through browser authority capture |
| EZ Aim / Allen Company | Publisher Shopify EZ Aim collection | Public catalog, variants, SKUs, descriptions, prices, stock state, and images available | Proceeded |
| Champion Targets | Current Champion collection on Primos/GSM publisher storefront | Current public catalog available. A legacy product-guide download returned an access page rather than a PDF and was not used. | Not a Founder gate; proceeded with current publisher catalog |

## Friction recorded

- Public network retrieval initially required the normal environment permission path. The permitted public downloads then completed.
- Birchwood Casey rejects direct automated requests to its target catalog. The live browser remained available and was used to capture all six visible catalog pages and each discovered product page.
- The Champion legacy PDF route was unusable. Its response body was discarded; the successful current publisher catalog is the authority source used in normalization.
- Captured HTTP headers were sanitized to remove cookies and unrelated session identifiers.

No blocked publisher stopped another publisher, and no assumption was substituted for required authority.

