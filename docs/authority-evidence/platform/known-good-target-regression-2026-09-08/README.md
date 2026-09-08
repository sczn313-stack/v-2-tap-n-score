# Known-Good Target Regression Standard

These are completed SCZN3 production experiences, not disposable fixtures. Their existing target-to-result-to-SEC-to-Ballistic-Vault-to-exact-reopen behavior is the regression standard for scale work.

The machine-readable inventory is `KNOWN_GOOD_TARGETS.json`. Each record names the exact target identity, production route, result contract, preservation behavior, and the existing automated regression that proves it.

The suite entry point is:

```sh
node production/known_good_target_regression_contract_test.mjs
```

The contract suite validates the inventory, the exact production routes and adapters, the existing regression sources, the shared SEC/Vault naming contract, and the Batch #1 inheritance connections. The exact browser regressions named in the inventory remain the behavioral acceptance proofs; this manifest prevents later scale work from silently replacing their routes with a generic substitute.

The governing rule is: if SCZN3 already paid to learn it, preserve it; if SCZN3 already built it, reuse it; if SCZN3 already proved it, regression-test it.
