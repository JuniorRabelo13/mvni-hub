import { Workbox } from "workbox-window";

const SW_URL = "/sw.js";
const RECOVERY_FLAG = "mvni-sw-recovered";

function shouldSkipRegistration(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    const matchingRegs = regs.filter(
      (r) =>
        r.active?.scriptURL?.endsWith(SW_URL) ||
        r.installing?.scriptURL?.endsWith(SW_URL) ||
        r.waiting?.scriptURL?.endsWith(SW_URL)
    );
    const hadController = !!navigator.serviceWorker.controller;
    const results = await Promise.allSettled(matchingRegs.map((r) => r.unregister()));
    const unregistered = results.some((result) => result.status === "fulfilled" && result.value === true);

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(
        keys
          .filter((key) => key.startsWith("workbox-") || key.includes("precache") || key.includes("runtime") || key === "html-navigations" || key === "static-assets")
          .map((key) => caches.delete(key))
      );
    }

    if (hadController && unregistered && sessionStorage.getItem(RECOVERY_FLAG) !== "1") {
      sessionStorage.setItem(RECOVERY_FLAG, "1");
      const url = new URL(window.location.href);
      url.searchParams.set("sw", "off");
      window.location.replace(url.toString());
    }
  } catch {
    // noop
  }
}

export async function registerServiceWorker() {
  if (shouldSkipRegistration()) {
    await unregisterMatching();
    return;
  }
  try {
    const wb = new Workbox(SW_URL);
    wb.addEventListener("waiting", () => {
      wb.messageSkipWaiting();
    });
    wb.addEventListener("controlling", () => {
      window.location.reload();
    });
    await wb.register();
  } catch (err) {
    console.warn("[sw] registration failed", err);
  }
}
