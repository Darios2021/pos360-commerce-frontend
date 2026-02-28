// ✅ COPY-PASTE FINAL COMPLETO
// src/app/debug/overlayDebug.js
//
// Debug fuerte para Vuetify overlays TELEPORTADOS (body > .v-overlay-container)
// - Detecta cuando aparecen overlays (menus, dialogs, tooltips, etc.)
// - Loguea scrim, opacidad, z-index, box-shadow, background, clases
// - Muy útil para encontrar "quién está oscureciendo todo".
//

function css(el, prop) {
  try {
    return getComputedStyle(el).getPropertyValue(prop);
  } catch {
    return "";
  }
}

function short(str, max = 220) {
  const s = String(str || "");
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function summarizeOverlay(overlayEl) {
  const scrim = overlayEl.querySelector(".v-overlay__scrim");
  const content = overlayEl.querySelector(".v-overlay__content");

  const info = {
    overlay: {
      classes: overlayEl.className,
      zIndex: css(overlayEl, "z-index").trim(),
      position: css(overlayEl, "position").trim(),
      inset: `${css(overlayEl, "top").trim()} ${css(overlayEl, "right").trim()} ${css(
        overlayEl,
        "bottom"
      ).trim()} ${css(overlayEl, "left").trim()}`,
      opacity: css(overlayEl, "opacity").trim(),
      filter: css(overlayEl, "filter").trim(),
      backdropFilter: css(overlayEl, "backdrop-filter").trim(),
    },
    scrim: scrim
      ? {
          exists: true,
          classes: scrim.className,
          opacity: css(scrim, "opacity").trim(),
          background: css(scrim, "background-color").trim(),
          pointerEvents: css(scrim, "pointer-events").trim(),
        }
      : { exists: false },
    content: content
      ? {
          exists: true,
          classes: content.className,
          background: css(content, "background-color").trim(),
          boxShadow: css(content, "box-shadow").trim(),
          border: css(content, "border").trim(),
          transform: css(content, "transform").trim(),
          maxHeight: css(content, "max-height").trim(),
        }
      : { exists: false },
  };

  // extras útiles
  try {
    const role = overlayEl.getAttribute("role");
    const aria = overlayEl.getAttribute("aria-hidden");
    if (role) info.overlay.role = role;
    if (aria) info.overlay.ariaHidden = aria;
  } catch {}

  return info;
}

function logOverlay(overlayEl, label = "OVERLAY") {
  const info = summarizeOverlay(overlayEl);

  const scrim = info.scrim?.exists
    ? `scrim(opacity=${info.scrim.opacity}, bg=${info.scrim.background}, pe=${info.scrim.pointerEvents})`
    : "scrim(none)";

  const content = info.content?.exists
    ? `content(bg=${info.content.background}, shadow=${short(info.content.boxShadow)})`
    : "content(none)";

  console.groupCollapsed(
    `%c[OVERLAY DEBUG] ${label}`,
    "color:#8be9fd;font-weight:700;",
    " | ",
    scrim,
    " | ",
    content
  );
  console.log(info);
  console.groupEnd();
}

function observeOverlayChanges(overlayEl) {
  // Observa cambios de clase/estilo para ver cuándo se activa o cambia scrim
  const mo = new MutationObserver(() => logOverlay(overlayEl, "MUTATION"));
  mo.observe(overlayEl, { attributes: true, attributeFilter: ["class", "style"] });

  const scrim = overlayEl.querySelector(".v-overlay__scrim");
  if (scrim) {
    const mo2 = new MutationObserver(() => logOverlay(overlayEl, "SCRIM MUTATION"));
    mo2.observe(scrim, { attributes: true, attributeFilter: ["class", "style"] });
  }

  const content = overlayEl.querySelector(".v-overlay__content");
  if (content) {
    const mo3 = new MutationObserver(() => logOverlay(overlayEl, "CONTENT MUTATION"));
    mo3.observe(content, { attributes: true, attributeFilter: ["class", "style"] });
  }

  return () => {
    try {
      mo.disconnect();
    } catch {}
  };
}

export function enableOverlayDebug({ verbose = false } = {}) {
  if (typeof window === "undefined") return () => {};
  if (window.__overlayDebugEnabled) return window.__overlayDebugDisable || (() => {});
  window.__overlayDebugEnabled = true;

  const seen = new WeakSet();
  const disposers = [];

  const scan = () => {
    const container = document.querySelector(".v-overlay-container");
    if (!container) return;

    const overlays = container.querySelectorAll(".v-overlay");
    overlays.forEach((ov) => {
      if (seen.has(ov)) return;
      seen.add(ov);

      logOverlay(ov, "NEW");
      disposers.push(observeOverlayChanges(ov));

      if (verbose) {
        // Snapshot adicional de body y app states
        console.log("[OVERLAY DEBUG] body classes:", document.body.className);
        const app = document.querySelector(".v-application");
        if (app) console.log("[OVERLAY DEBUG] .v-application classes:", app.className);
      }
    });
  };

  // Observa body para detectar creación de .v-overlay-container o cambios
  const bodyObserver = new MutationObserver(() => scan());
  bodyObserver.observe(document.body, { childList: true, subtree: true });
  disposers.push(() => bodyObserver.disconnect());

  // scan inicial
  setTimeout(scan, 0);
  setTimeout(scan, 250);
  setTimeout(scan, 1200);

  window.__overlayDebugDisable = () => {
    disposers.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    window.__overlayDebugEnabled = false;
  };

  console.log("%c[OVERLAY DEBUG] ENABLED", "color:#50fa7b;font-weight:800;");
  return window.__overlayDebugDisable;
}