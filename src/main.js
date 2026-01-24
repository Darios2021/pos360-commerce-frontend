// =============================
// ✅ Prerender signal (FIX DEFINITIVO)
// =============================
function signalPrerenderReady(routerInstance) {
  if (typeof document === "undefined") return;

  const enabled =
    String(import.meta.env.VITE_ENABLE_PRERENDER || "") === "1" ||
    String(import.meta.env.VITE_ENABLE_PRERENDER || "").toLowerCase() === "true";

  if (!enabled) return;

  let fired = false;
  const fire = (reason = "ok") => {
    if (fired) return;
    fired = true;
    try {
      console.log("[prerender-ready]", reason);
      document.dispatchEvent(new Event("prerender-ready"));
    } catch {}
  };

  // 🔥 FIX: forzar sincronización del router
  try {
    const currentPath = window.location.pathname;
    routerInstance.replace(currentPath).catch(() => {});
  } catch {}

  // Camino normal (si router responde)
  Promise.race([
    routerInstance.isReady(),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ])
    .then(async () => {
      await nextTick();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => fire("router-or-timeout"))
      );
    })
    .catch(() => fire("router-error"));

  // 🔒 DEAD-MAN SWITCH (prerender JAMÁS puede colgar)
  setTimeout(() => fire("forced-timeout"), 5000);
}
