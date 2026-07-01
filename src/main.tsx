import { createRoot } from "react-dom/client";
import { StrictMode, Suspense } from "react";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppFallback } from "./components/AppFallback";

const BOOT_TAG = "[MVNI_BOOT]";

function renderNativeFallback(message: string, detail?: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0F1A;color:#E5E7EB;font-family:system-ui,-apple-system,sans-serif;padding:24px;">
      <div style="max-width:440px;text-align:center;display:flex;flex-direction:column;gap:16px;">
        <div style="font-size:11px;letter-spacing:0.2em;color:#9b87f5;text-transform:uppercase;">MVNI HUB</div>
        <h1 style="font-size:18px;font-weight:600;margin:0;">Não foi possível carregar o MVNI HUB</h1>
        <p style="font-size:14px;color:#9CA3AF;margin:0;">${message}</p>
        ${detail ? `<pre style="font-size:11px;color:#6B7280;margin:0;white-space:pre-wrap;word-break:break-word;text-align:left;background:#111827;padding:8px;border-radius:6px;">${detail}</pre>` : ""}
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button id="mvni-reload-btn" style="padding:10px 20px;background:#9b87f5;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;">Recarregar</button>
          <a href="/diagnostico" style="padding:10px 20px;background:transparent;color:#E5E7EB;border:1px solid #3f3f46;border-radius:6px;font-size:14px;font-weight:500;text-decoration:none;">Diagnóstico</a>
        </div>
      </div>
    </div>
  `;
  document.getElementById("mvni-reload-btn")?.addEventListener("click", () => window.location.reload());
}

console.info(`${BOOT_TAG} init`, {
  href: window.location.href,
  timestamp: new Date().toISOString(),
});

window.addEventListener("error", (e) => {
  console.error(`${BOOT_TAG} window error`, e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error(`${BOOT_TAG} unhandled rejection`, e.reason);
});

const RENDER_TIMEOUT_MS = 12000;
const renderWatchdog = window.setTimeout(() => {
  const root = document.getElementById("root");
  if (!root || root.children.length === 0 || root.innerHTML.trim() === "") {
    console.error(`${BOOT_TAG} render timeout — root empty after ${RENDER_TIMEOUT_MS}ms`);
    renderNativeFallback("A interface demorou muito para responder. Tente recarregar a página.");
  }
}, RENDER_TIMEOUT_MS);

try {
  const container = document.getElementById("root");
  if (!container) throw new Error("Elemento #root não encontrado no documento.");

  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<AppFallback />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>,
  );

  console.info(`${BOOT_TAG} react mounted`);
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
  renderNativeFallback("Ocorreu uma falha ao iniciar a aplicação.", message);
}

registerServiceWorker();
