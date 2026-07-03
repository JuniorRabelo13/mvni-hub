import { createRoot } from "react-dom/client";
import { StrictMode, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppFallback } from "./components/AppFallback";


const BOOT_TAG = "[MVNI_BOOT]";

function sanitize(input: string): string {
  return input.replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, "[token]");
}

function renderNativeFallback(title: string, message: string, detail?: string) {
  const root = document.getElementById("root");
  if (!root) return;
  const safeDetail = detail ? sanitize(detail) : "";
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0B0F1A 0%,#131A2E 100%);color:#E5E7EB;font-family:system-ui,-apple-system,sans-serif;padding:24px;">
      <div style="max-width:460px;width:100%;text-align:center;display:flex;flex-direction:column;gap:14px;background:rgba(17,24,39,.85);border:1px solid #262f45;border-radius:14px;padding:28px;">
        <div style="font-size:11px;letter-spacing:0.24em;color:#9b87f5;text-transform:uppercase;font-weight:600;">MVNI HUB</div>
        <h1 style="font-size:20px;font-weight:600;margin:0;color:#F9FAFB;">${title}</h1>
        <p style="font-size:14px;color:#9CA3AF;margin:0;line-height:1.5;">${message}</p>
        ${safeDetail ? `<pre style="font-size:11px;color:#9CA3AF;margin:0;white-space:pre-wrap;word-break:break-word;text-align:left;background:#0B0F1A;padding:10px;border-radius:6px;border:1px solid #262f45;">${safeDetail}</pre>` : ""}
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:6px;">
          <button id="mvni-reload-btn" style="padding:10px 18px;background:#9b87f5;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;">Recarregar</button>
          <a href="/diagnostico" style="padding:10px 18px;background:transparent;color:#E5E7EB;border:1px solid #3f3f46;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">Diagnóstico</a>
          <a href="/auth" style="padding:10px 18px;background:transparent;color:#E5E7EB;border:1px solid #3f3f46;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">Login</a>
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

let reactMounted = false;

function handleEarlyError(source: string, detail: unknown) {
  console.error(`${BOOT_TAG} ${source}`, detail);
  if (reactMounted) return;
  const message = detail instanceof Error ? detail.message : typeof detail === "string" ? detail : "Erro desconhecido durante a inicialização.";
  renderNativeFallback("Erro ao iniciar o MVNI HUB", "Ocorreu uma falha antes da aplicação carregar. Tente recarregar ou abra o diagnóstico.", message);
}

window.addEventListener("error", (e) => handleEarlyError("window error", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => handleEarlyError("unhandled rejection", e.reason));

const RENDER_TIMEOUT_MS = 12000;
const renderWatchdog = window.setTimeout(() => {
  if (reactMounted) return;
  const root = document.getElementById("root");
  const stillBoot = root?.querySelector("#mvni-boot-fallback");
  if (!root || stillBoot || root.children.length === 0 || root.innerHTML.trim() === "") {
    console.error(`${BOOT_TAG} render timeout — root not replaced after ${RENDER_TIMEOUT_MS}ms`);
    renderNativeFallback("Não foi possível carregar o MVNI HUB", "A interface demorou muito para responder. Tente recarregar a página ou abra /diagnostico.");
  }
}, RENDER_TIMEOUT_MS);

try {
  const container = document.getElementById("root");
  if (!container) throw new Error("Elemento #root não encontrado no documento.");

  createRoot(container).render(
    <StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <Suspense fallback={<AppFallback />}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </HelmetProvider>
    </StrictMode>,

  );

  console.info(`${BOOT_TAG} react mounted`);
  requestAnimationFrame(() => {
    if (container.children.length > 0 && !container.querySelector("#mvni-boot-fallback")) {
      reactMounted = true;
      window.clearTimeout(renderWatchdog);
      console.info(`${BOOT_TAG} render ok`);
    }
  });
} catch (err) {
  window.clearTimeout(renderWatchdog);
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${BOOT_TAG} render failed`, err);
  renderNativeFallback("Não foi possível carregar o MVNI HUB", "Ocorreu uma falha ao iniciar a aplicação.", message);
}

registerServiceWorker();
