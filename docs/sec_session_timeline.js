(function (global) {
  "use strict";

  const LIMIT = 10;

  function clean(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function preservedRecords(payload) {
    if (!payload || payload.ok !== true) return Object.freeze([]);
    const sessions = payload.session ? [payload.session] : Array.isArray(payload.sessions) ? payload.sessions : [];
    const artifacts = payload.session
      ? [{
          sessionId: payload.session.sessionId,
          artifactSha256: payload.artifactSha256,
          preservedAt: payload.preservedAt
        }]
      : Array.isArray(payload.artifacts) ? payload.artifacts : [];
    const artifactBySession = new Map();
    for (const artifact of artifacts) {
      const sessionId = clean(artifact && artifact.sessionId);
      const preservedAt = clean(artifact && artifact.preservedAt);
      const artifactSha256 = clean(artifact && artifact.artifactSha256);
      const timestamp = Date.parse(preservedAt);
      if (!sessionId || !artifactSha256 || !Number.isFinite(timestamp)) continue;
      artifactBySession.set(sessionId, Object.freeze({ sessionId, preservedAt, artifactSha256, timestamp }));
    }
    return Object.freeze(sessions.map(session => {
      const sessionId = clean(session && session.sessionId);
      const artifact = artifactBySession.get(sessionId);
      if (!session || session.savedToSEC !== true || session.sessionIdAuthority !== "backend" || !artifact) return null;
      return Object.freeze({ session, ...artifact });
    }).filter(Boolean));
  }

  function build({ records = [], expectedIdentity = "", identityResolver, metricResolver, currentSessionId = "" } = {}) {
    if (!clean(expectedIdentity) || typeof identityResolver !== "function" || typeof metricResolver !== "function") {
      return Object.freeze({ points: Object.freeze([]), currentSessionId: clean(currentSessionId) });
    }
    const bySession = new Map();
    for (const record of records) {
      const session = record && record.session;
      const sessionId = clean(record && record.sessionId);
      const preservedAt = clean(record && record.preservedAt);
      const artifactSha256 = clean(record && record.artifactSha256);
      const timestamp = Date.parse(preservedAt);
      if (!session || session.savedToSEC !== true || session.sessionIdAuthority !== "backend") continue;
      if (!sessionId || sessionId !== clean(session.sessionId) || !artifactSha256 || !Number.isFinite(timestamp)) continue;
      if (clean(identityResolver(session)) !== clean(expectedIdentity)) continue;
      const value = metricResolver(session);
      if (!Number.isFinite(value)) continue;
      const candidate = Object.freeze({ sessionId, preservedAt, artifactSha256, timestamp, value });
      const existing = bySession.get(sessionId);
      if (!existing || candidate.timestamp > existing.timestamp) bySession.set(sessionId, candidate);
    }
    const newest = [...bySession.values()]
      .sort((a, b) => a.timestamp - b.timestamp || a.sessionId.localeCompare(b.sessionId))
      .slice(-LIMIT)
      .map(point => Object.freeze({ ...point, current: point.sessionId === clean(currentSessionId) }));
    return Object.freeze({ points: Object.freeze(newest), currentSessionId: clean(currentSessionId) });
  }

  function dateLabel(preservedAt) {
    const date = new Date(preservedAt);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function graphGeometry(points) {
    if (!points.length) return [];
    const values = points.map(point => point.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return points.map((point, index) => ({
      ...point,
      x: points.length === 1 ? 50 : 6 + (index / (points.length - 1)) * 88,
      y: minimum === maximum ? 50 : 82 - ((point.value - minimum) / (maximum - minimum)) * 64
    }));
  }

  function render(model, { title = "Last 10 Scores", valueUnit = "points", recordsHref = "records.html" } = {}) {
    const points = graphGeometry(model && Array.isArray(model.points) ? model.points : []);
    if (!points.length) {
      return `<section class="sec-session-timeline" aria-label="${escapeHtml(title)}"><h3>${escapeHtml(title)}</h3><p class="sec-session-timeline-empty">No preserved scores yet.</p></section>`;
    }
    const polyline = points.length > 1
      ? `<polyline class="sec-session-timeline-line" points="${points.map(point => `${point.x},${point.y}`).join(" ")}" vector-effect="non-scaling-stroke" />`
      : "";
    const links = points.map((point, index) => {
      const href = `${recordsHref}?session=${encodeURIComponent(point.sessionId)}&view=sec`;
      const label = `${point.value} ${valueUnit}, ${dateLabel(point.preservedAt)}${point.current ? ", current preserved SEC" : ""}`;
      return `<a class="sec-session-timeline-point${point.current ? " is-current" : ""}" href="${escapeHtml(href)}" data-session-id="${escapeHtml(point.sessionId)}" aria-label="${escapeHtml(label)}" style="--point-x:${point.x}%;--point-y:${point.y}%"><span>${escapeHtml(point.value)}</span></a>`;
    }).join("");
    return `<section class="sec-session-timeline" aria-label="${escapeHtml(title)}">
      <h3>${escapeHtml(title)}</h3>
      <div class="sec-session-timeline-chart" role="group" aria-label="Oldest score on the left, newest score on the right">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${polyline}</svg>${links}
      </div>
      <div class="sec-session-timeline-direction" aria-hidden="true"><span>Oldest</span><span>Newest</span></div>
    </section>`;
  }

  global.SCZN3SECSessionTimeline = Object.freeze({ limit: LIMIT, preservedRecords, build, render });
})(typeof window !== "undefined" ? window : globalThis);
