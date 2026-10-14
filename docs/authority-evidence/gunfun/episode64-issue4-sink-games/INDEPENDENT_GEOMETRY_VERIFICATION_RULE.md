# Independent geometry verification rule

The Sink-A-Ship correction established a permanent verification constraint for governed target geometry.

## Rule

A candidate geometry model may not prove its own physical accuracy by generating test observations or expected classifications from itself. Result-affecting geometry requires an independent governed fixture, such as preserved Founder observations or an independent physical measurement record.

The fixture must remain unchanged while the candidate geometry is evaluated. Tests must compare the candidate's classifications against that independent expectation, including adversarial inside, edge, and outside observations where applicable.

## Episode 64 regression

`FOUNDER_193_14_TAP_REGRESSION.json` preserves the independent Founder coordinates for Sink-A-Ship. Taps 1, 2, and 3 are permanent regressions because the earlier circular test passed while those real observations were misclassified. The Issue #4 unit test executes the preserved coordinates against the production contract and preserves the resulting ledger through SEC, Vault, and exact reopen.

Passing a candidate-derived center-point sweep proves internal consistency only. It does not prove physical correspondence.
