(function initializeVaultSECLifecycle(global) {
  "use strict";

  function clean(value) { return String(value || "").trim(); }

  function localState(session) {
    const sessionId = clean(session?.sessionId || session?.authoritativeSessionId);
    if (!sessionId) return { state: "unavailable", reason: "session_identity_unavailable" };
    if (session?.savedToSEC !== true) return { state: "draft", reason: "not_preserved_to_sec" };
    if (session?.sessionIdAuthority !== "backend") {
      return { state: "unavailable", reason: "backend_session_identity_required" };
    }
    return { state: "candidate", reason: "authoritative_confirmation_required" };
  }

  async function resolve(endpoint, session, reopenAuthority = global.SCZN3SECReopenAuthority) {
    const local = localState(session);
    if (local.state !== "candidate") return { ...local, session };
    if (!reopenAuthority || typeof reopenAuthority.reopen !== "function") {
      return { state: "unavailable", reason: "sec_reopen_authority_unavailable", session };
    }
    try {
      const payload = await reopenAuthority.reopen(endpoint, clean(session.sessionId), session);
      const preserved = payload?.session;
      if (
        !payload?.ok
        || payload?.status !== "preserved"
        || clean(preserved?.sessionId) !== clean(session.sessionId)
        || preserved?.savedToSEC !== true
      ) {
        return { state: "unavailable", reason: "preserved_sec_identity_mismatch", session };
      }
      return { state: "preserved", reason: "exact_reopen_available", session: preserved, packageData: payload };
    } catch (error) {
      return { state: "unavailable", reason: clean(error?.message) || "preserved_sec_reopen_denied", session };
    }
  }

  global.SCZN3VaultSECLifecycle = Object.freeze({ localState, resolve });
})(window);
