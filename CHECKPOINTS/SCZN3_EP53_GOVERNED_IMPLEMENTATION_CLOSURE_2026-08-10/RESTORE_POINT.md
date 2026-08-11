# Episode 53 Restore Point

## Restore identity

This restore point returns SCZN3 to the stable production and governance boundary established after governed Items 1–3.

- Production source commit: `d60d2f87948b72db05e687a06288e5bbe16fc371`
- Governed release branch closeout commit: `5d58ccda14fed62318fe616726467bbf2c24ee50`
- Production URL: `https://tap-n-score.com`
- Netlify deploy ID: `6a7a68ec32bc8f782157d213`
- Render deploy ID: `dep-d9t6hom7bikc738pnv50`

## Restored state

Returning here restores:

- Stable production
- Stable governance
- Stable authority architecture
- Stable presentation governance
- Stable implementation lifecycle
- Items 1–3 closed
- Open implementation items equal zero

## Restore from Git

1. Clone `https://github.com/sczn313-stack/v-2-tap-n-score.git`.
2. Create a recovery branch at production source commit `d60d2f87948b72db05e687a06288e5bbe16fc371` to restore the exact deployed application source.
3. Build the frontend from `docs/` with `npm run build:netlify`.
4. Verify that `docs/_redirects`, `docs/netlify.toml`, and `render.yaml` are present.
5. Run the authority, Session Authority, parity, integration, Zeroing SOP, GSSF, SEC, Vault, persistence, and identity tests.
6. Deployment or rollback requires separate Founder authorization.

## Restore from ZIP

1. Verify `SCZN3_EP53_GOVERNED_IMPLEMENTATION_CLOSURE_2026-08-10.zip.sha256`.
2. Extract the ZIP into an empty directory.
3. Read the packaged `README.md`, `SYSTEM_IDENTITY.md`, and `FILE_SHA256SUMS.txt`.
4. Verify the packaged Git bundle.
5. Verify the production build and source snapshot before any separately authorized deployment.

## Rollback boundary

This restore point documents recovery; it does not itself authorize a production rollback, DNS change, or deployment.
