(() => {
  "use strict";

  if (window.SCZN3Actions) return;

  const OWNER = "SCZN3Actions";
  const ACTIONS = Object.freeze(["save", "share", "export", "note", "note-save", "history", "session-details"]);
  const activeTriggers = new WeakSet();
  const operations = new Map();
  const bindings = new WeakMap();

  function element(value, root = document) {
    if (!value) return null;
    if (value.nodeType === 1) return value;
    return typeof value === "string" ? root.querySelector(value) : null;
  }

  function actionFor(trigger) {
    const action = String(trigger?.dataset?.sczn3Action || "").trim().toLowerCase();
    return ACTIONS.includes(action) ? action : "";
  }

  function markRegion(root) {
    if (!root || root.nodeType !== 1) return null;
    root.dataset.sczn3ActionRegion = root.dataset.sczn3ActionRegion || "platform-v1";
    root.dataset.sczn3ActionOwner = OWNER;
    return root;
  }

  function syncAvailability(root = document, availability = {}) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll("[data-sczn3-action]").forEach(trigger => {
      const action = actionFor(trigger);
      if (!action || !(action in availability)) return;
      const rule = availability[action];
      const supported = Boolean(typeof rule === "function" ? rule(trigger) : rule);
      trigger.hidden = !supported;
      if ("disabled" in trigger) trigger.disabled = !supported;
      trigger.setAttribute("aria-hidden", supported ? "false" : "true");
    });
  }

  function begin({ id = "action", message = "SCZN3 is working…", trigger = null, scope = null } = {}) {
    const triggerElement = element(trigger);
    if (triggerElement && activeTriggers.has(triggerElement)) return "";
    if (triggerElement) activeTriggers.add(triggerElement);
    const operationId = window.SCZN3Processing?.begin({ id, message, trigger: triggerElement, scope }) || `${id}:${Date.now()}`;
    operations.set(operationId, triggerElement);
    return operationId;
  }

  function finish(operationId, succeeded = true) {
    if (!operationId || !operations.has(operationId)) return false;
    const trigger = operations.get(operationId);
    operations.delete(operationId);
    if (trigger) activeTriggers.delete(trigger);
    if (window.SCZN3Processing) {
      (succeeded ? SCZN3Processing.succeed : SCZN3Processing.fail)(operationId);
    }
    return true;
  }

  async function run(options, task) {
    const operationId = begin(options);
    if (!operationId) return { ok: false, duplicate: true };
    try {
      const value = await task(operationId);
      const ok = value !== false && (!value || value.ok !== false);
      finish(operationId, ok);
      return { ok, value };
    } catch (error) {
      finish(operationId, false);
      throw error;
    }
  }

  async function share(data = {}) {
    const payload = {
      title: String(data.title || "Shooter Experience Card"),
      text: String(data.text || ""),
      url: String(data.url || location.href)
    };
    if (navigator.share) {
      await navigator.share(payload);
      return "shared";
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(payload.url);
      return "copied";
    }
    return "unavailable";
  }

  function print() {
    window.print();
    return true;
  }

  function toggleNote(root, selector = "[data-sczn3-note-editor]") {
    const editor = element(selector, root);
    if (!editor) return false;
    editor.hidden = !editor.hidden;
    editor.classList.toggle("is-hidden", editor.hidden);
    if (!editor.hidden) editor.querySelector("textarea,input")?.focus();
    return true;
  }

  function handlerModel(value) {
    return typeof value === "function" ? { run: value } : (value && typeof value === "object" ? value : {});
  }

  function outcomeLabel(action, result) {
    if (!result?.ok || typeof result.value !== "string") return "";
    if (result.value === "shared") return "Shared";
    if (result.value === "copied") return "Link Copied";
    if (result.value === "downloaded") return "Exported";
    if (action === "share" && ["unavailable", "share_unavailable"].includes(result.value)) return "Share Unavailable";
    return "";
  }

  function bind(root, handlers = {}, options = {}) {
    if (!root || !root.addEventListener) throw new TypeError("action_root_required");
    bindings.get(root)?.();
    root.querySelectorAll("[data-sczn3-action-region]").forEach(markRegion);
    if (root.matches?.("[data-sczn3-action-region]")) markRegion(root);

    const listener = async event => {
      const trigger = event.target.closest?.("[data-sczn3-action]");
      if (!trigger || !root.contains(trigger)) return;
      const action = actionFor(trigger);
      if (!action || action === "history") return;
      const configured = handlerModel(handlers[action]);
      let task = configured.run;
      if (!task && action === "share") task = () => share(typeof options.shareData === "function" ? options.shareData(trigger) : options.shareData);
      if (!task && action === "export") task = print;
      if (!task && action === "note") task = () => toggleNote(root, options.noteEditorSelector);
      if (!task) return;
      event.preventDefault();
      if (activeTriggers.has(trigger)) return;
      const processing = configured.processing !== false && ["save", "share", "export", "note-save", "session-details"].includes(action);
      try {
        const result = processing
          ? await run({
            id: configured.id || action,
            message: configured.message || ({
              save: "Preserving your Shooter Experience Card…",
              share: "Preparing your Shooter Experience Card…",
              export: "Preparing your Shooter Experience Card…",
              "note-save": "Saving your note…",
              "session-details": "Saving session details…"
            })[action],
            trigger,
            scope: configured.scope || trigger.closest("[data-processing-host]") || trigger.closest("[data-sczn3-action-region]")
          }, operationId => task({ event, trigger, operationId, action }))
          : { ok: true, value: await task({ event, trigger, action }) };
        const label = outcomeLabel(action, result);
        if (label) trigger.textContent = label;
        configured.complete?.(result, trigger);
      } catch (error) {
        configured.fail?.(error, trigger);
      }
    };
    root.addEventListener("click", listener);
    const unbind = () => {
      root.removeEventListener("click", listener);
      if (bindings.get(root) === unbind) bindings.delete(root);
    };
    bindings.set(root, unbind);
    return unbind;
  }

  window.addEventListener("pagehide", () => {
    for (const operationId of [...operations.keys()]) finish(operationId, false);
  });

  window.SCZN3Actions = Object.freeze({
    version: "1.0.0",
    owner: OWNER,
    actions: ACTIONS,
    markRegion,
    syncAvailability,
    begin,
    finish,
    run,
    bind,
    share,
    print,
    toggleNote,
    outcomeLabel
  });
})();
