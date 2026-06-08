import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";

const BOOT_TAG = "[MVNI_BOOT]";

function renderFallback(message: string, detail?: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0F1A;color:#E5E7EB;font-family:system-ui,-apple-system,sans-serif;padding:24px;">
      <div style="max-width:420px;text-align:center;display:flex;flex-direction:column;gap:16px;">
        <h1 style="font-size:18px;font-weight:600;margin:0;">Não foi possível carregar o MVNI Hub</h1>
        <p style="font-size:14px;color:#9CA3AF;margin:0;">${message}</p>
        ${detail ? `<p style="font-size:12px;color:#6B7280;margin:0;word-break:break-word;">${detail}</p>` : ""}
        <button id="mvni-reload-btn" style="margin:0 auto;padding:10px 20px;background:#9b87f5;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;">
          Recarregar
        </button>
      </div>
    </div>
  `;
  document.getElementById("mvni-reload-btn")?.addEventListener("click", () => {
    window.location.reload();
  });
}

console.info(`${BOOT_TAG} init`, {
  href: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
});

window.addEventListener("error", (e) => {
  console.error(`${BOOT_TAG} window error`, e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error(`${BOOT_TAG} unhandled rejection`, e.reason);
});

const RENDER_TIMEOUT_MS = 8000;
const renderWatchdog = window.setTimeout(() => {
  const root = document.getElementById("root");
  if (!root || root.children.length === 0 || root.innerHTML.trim() === "") {
    console.error(`${BOOT_TAG} render timeout — root is empty after ${RENDER_TIMEOUT_MS}ms`);
    renderFallback("A interface demorou muito para responder. Tente recarregar a página.");
  }
}, RENDER_TIMEOUT_MS);

try {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Elemento #root não encontrado no documento.");
  }
  createRoot(container).render(<App />);
  console.info(`${BOOT_TAG} react mounted`);
  // Clear watchdog once React commits something to the DOM
  requestAnimationFrame(() => {
    if (container.children.length > 0) {
      window.clearTimeout(renderWatchdog);
      console.info(`${BOOT_TAG} render ok`);
    }
  });
} catch (err) {
  window.clearTimeout(renderWatchdog);
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${BOOT_TAG} render failed`, err);
  renderFallback("Ocorreu uma falha ao iniciar a aplicação.", message);
}

registerServiceWorker();
