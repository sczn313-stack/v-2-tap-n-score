(() => {
  const dataNode = document.querySelector("#group-data");
  const frame = document.querySelector("#smart-target");
  const previous = document.querySelector("#previous");
  const next = document.querySelector("#next");
  const progress = document.querySelector("#progress");
  const targetName = document.querySelector("#target-name");
  const targetMeta = document.querySelector("#target-meta");
  const issue = document.querySelector("#issue-text");
  const open = document.querySelector("#open-experience");

  function fail(message) {
    document.querySelector("main").innerHTML = `<p class="failure">${escapeHtml(message)}</p>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  let group;
  try {
    group = JSON.parse(dataNode.textContent);
  } catch (error) {
    fail(`Review stack unavailable: ${error.message}`);
    return;
  }

  const expected = Number(document.body.dataset.denominator);
  const ordinals = group.chairs.map(chair => chair.visualStackOrdinal);
  if (group.chairs.length !== expected || new Set(ordinals).size !== expected) {
    fail("Review stack membership verification failed.");
    return;
  }

  const parseIndex = () => {
    const match = location.hash.match(/^#chair=(\d+)$/);
    const requested = match ? Number(match[1]) - 1 : 0;
    return Number.isInteger(requested) && requested >= 0 && requested < expected ? requested : 0;
  };

  function render(index, updateHash = true) {
    const chair = group.chairs[index];
    const href = `../../../target-experience.html?missionFamily=${encodeURIComponent(chair.missionFamily)}&target=${encodeURIComponent(chair.targetProfileId)}&source=registered&authorityPort=8098`;
    progress.textContent = `Founder ${index + 1}/${expected}`;
    targetName.textContent = chair.targetName;
    targetMeta.textContent = `${chair.skus.join(" · ") || "SKU not recorded"} · ${chair.currentCapability} · QT chair #${chair.visualStackOrdinal}`;
    issue.textContent = group.unresolvedIssue;
    frame.title = `${chair.targetName} Smart Target experience`;
    frame.src = href;
    open.href = href;
    previous.disabled = index === 0;
    next.disabled = index === expected - 1;
    previous.dataset.index = String(index - 1);
    next.dataset.index = String(index + 1);
    if (updateHash) history.replaceState(null, "", `#chair=${index + 1}`);
  }

  previous.addEventListener("click", () => {
    const index = Number(previous.dataset.index);
    if (index >= 0) render(index);
  });
  next.addEventListener("click", () => {
    const index = Number(next.dataset.index);
    if (index < expected) render(index);
  });
  addEventListener("hashchange", () => render(parseIndex(), false));

  window.QT_REVIEW_DIAGNOSTICS = Object.freeze({
    groupNumber: group.groupNumber,
    groupName: group.groupName,
    manifestCount: group.manifestCount,
    displayedDenominator: expected,
    uniqueChairCount: new Set(ordinals).size,
    chairOrdinals: Object.freeze([...ordinals])
  });
  render(parseIndex(), false);
})();
