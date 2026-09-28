(() => {
  "use strict";

  if (window.SCZN3Processing) return;

  const operations = new Map();
  let sequence = 0;

  function resolveElement(value) {
    if (!value) return null;
    if (value instanceof Element) return value;
    if (typeof value === "string") return document.querySelector(value);
    return null;
  }

  function indicator(message, reassurance = "") {
    const node = document.createElement("span");
    node.className = "sczn3-processing-indicator";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    node.setAttribute("aria-atomic", "true");

    const motion = document.createElement("span");
    motion.className = "sczn3-processing-indicator__motion";
    motion.setAttribute("aria-hidden", "true");
    motion.append(document.createElement("i"), document.createElement("i"), document.createElement("i"));

    const copy = document.createElement("span");
    copy.className = "sczn3-processing-indicator__message";
    copy.textContent = message;
    if (reassurance) {
      const detail = document.createElement("small");
      detail.className = "sczn3-processing-indicator__reassurance";
      detail.textContent = reassurance;
      copy.append(detail);
    }
    node.append(motion, copy);
    return node;
  }

  function restore(operation) {
    clearTimeout(operation.reassuranceTimer);
    if (operation.trigger) {
      operation.trigger.replaceChildren(...operation.originalChildren);
      operation.trigger.disabled = operation.originalDisabled;
      operation.trigger.removeAttribute("data-sczn3-processing");
      if (operation.originalAriaBusy === null) operation.trigger.removeAttribute("aria-busy");
      else operation.trigger.setAttribute("aria-busy", operation.originalAriaBusy);
      if (operation.originalAriaDisabled === null) operation.trigger.removeAttribute("aria-disabled");
      else operation.trigger.setAttribute("aria-disabled", operation.originalAriaDisabled);
    }
    if (operation.scope) {
      operation.scope.removeAttribute("data-sczn3-processing");
      if (operation.scopeAriaBusy === null) operation.scope.removeAttribute("aria-busy");
      else operation.scope.setAttribute("aria-busy", operation.scopeAriaBusy);
    }
    operation.globalIndicator?.remove();
  }

  function begin({ id = "operation", message = "SCZN3 is working…", trigger = null, scope = null, reassuranceAfter = 8000 } = {}) {
    const operationId = `${id}:${++sequence}`;
    const triggerElement = resolveElement(trigger);
    const scopeElement = resolveElement(scope) || triggerElement?.closest("[data-processing-host]") || triggerElement?.parentElement || null;
    const operation = {
      operationId,
      id,
      message,
      trigger: triggerElement,
      scope: scopeElement,
      originalChildren: triggerElement ? Array.from(triggerElement.childNodes) : [],
      originalDisabled: triggerElement ? triggerElement.disabled : false,
      originalAriaBusy: triggerElement?.getAttribute("aria-busy") ?? null,
      originalAriaDisabled: triggerElement?.getAttribute("aria-disabled") ?? null,
      scopeAriaBusy: scopeElement?.getAttribute("aria-busy") ?? null,
      globalIndicator: null,
      reassuranceTimer: null,
      settled: false
    };

    const node = indicator(message);
    if (triggerElement) {
      triggerElement.replaceChildren(node);
      triggerElement.disabled = true;
      triggerElement.dataset.sczn3Processing = "true";
      triggerElement.setAttribute("aria-busy", "true");
      triggerElement.setAttribute("aria-disabled", "true");
    } else {
      node.classList.add("sczn3-processing-global");
      document.body.append(node);
      operation.globalIndicator = node;
    }
    if (scopeElement) {
      scopeElement.dataset.sczn3Processing = "true";
      scopeElement.setAttribute("aria-busy", "true");
    }

    operation.reassuranceTimer = window.setTimeout(() => {
      if (operation.settled) return;
      const activeNode = triggerElement?.querySelector(".sczn3-processing-indicator") || operation.globalIndicator;
      const copy = activeNode?.querySelector(".sczn3-processing-indicator__message");
      if (!copy || copy.querySelector(".sczn3-processing-indicator__reassurance")) return;
      const detail = document.createElement("small");
      detail.className = "sczn3-processing-indicator__reassurance";
      detail.textContent = "Still working. Your evidence is safe.";
      copy.append(detail);
    }, Math.max(0, Number(reassuranceAfter) || 8000));

    operations.set(operationId, operation);
    document.dispatchEvent(new CustomEvent("sczn3:processing-start", { detail: { operationId, id, message } }));
    return operationId;
  }

  function update(operationId, message) {
    const operation = operations.get(operationId);
    if (!operation || operation.settled || !message) return false;
    operation.message = message;
    const node = operation.trigger?.querySelector(".sczn3-processing-indicator") || operation.globalIndicator;
    const copy = node?.querySelector(".sczn3-processing-indicator__message");
    if (copy) copy.firstChild.textContent = message;
    document.dispatchEvent(new CustomEvent("sczn3:processing-update", { detail: { operationId, id: operation.id, message } }));
    return true;
  }

  function settle(operationId, outcome = "succeeded") {
    const operation = operations.get(operationId);
    if (!operation || operation.settled) return false;
    operation.settled = true;
    restore(operation);
    operations.delete(operationId);
    document.dispatchEvent(new CustomEvent(`sczn3:processing-${outcome}`, { detail: { operationId, id: operation.id } }));
    return true;
  }

  function reset() {
    Array.from(operations.keys()).forEach(operationId => settle(operationId, "cancelled"));
  }

  async function run(options, task) {
    const operationId = begin(options);
    try {
      const result = await task(operationId);
      settle(operationId, "succeeded");
      return result;
    } catch (error) {
      settle(operationId, "failed");
      throw error;
    }
  }

  window.addEventListener("pageshow", event => { if (event.persisted) reset(); });
  window.addEventListener("pagehide", reset);

  window.SCZN3Processing = Object.freeze({
    begin,
    update,
    succeed: operationId => settle(operationId, "succeeded"),
    fail: operationId => settle(operationId, "failed"),
    run,
    reset,
    activeCount: () => operations.size
  });
})();
