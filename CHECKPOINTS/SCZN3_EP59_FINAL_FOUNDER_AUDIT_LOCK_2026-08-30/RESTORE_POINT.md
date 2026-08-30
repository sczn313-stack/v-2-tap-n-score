# Restore Point

Use Keepsake #8 from the Master Keepsake Vault.

1. Verify the ZIP against the SHA-256 in this record and the Keepsake Vault Index.
2. Extract into a fresh directory.
3. Run `START_BAKER_REVIEW.sh` from the extracted deposit.
4. Verify `/health` and `shoot.html`.
5. Use the embedded complete Git bundle to restore source history at `f2ece88a0793a4fad5bc7ea40c2c4e92d4087ec4`.

> **KNOWN GOOD → FIND IN INDEX → RETRIEVE FROM MASTER VAULT → RESTORE → VERIFY → BUILD FORWARD**

Canonical archive:

`/Users/ronnieseay/Documents/ChatGPT/Shortest mental model/Keepsake Vault/SCZN3_KEEP_008_BAKER_TALKING_SMART_TARGET_FINAL_AUDIT_f2ece88.zip`

SHA-256:

`646c9edf795a6ef8a8693e491985f7e97cbb19c8b30e5a977d35c3765b272797`

Final fresh extraction: **PASS** — complete Git bundle verified and cloned to the product commit, all five focused contracts passed, restored authority health passed, and `shoot.html` returned HTTP 200.
