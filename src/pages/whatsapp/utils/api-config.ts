
export type ApiUrlError = "API_URL_INVALID";

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_WHATSAPP_API_URL || "https://hmzqfcooxqucytxwljhg.supabase.co/functions/v1/whatsapp-api";
  
  if (!url) {
    throw new Error("API_URL_INVALID: VITE_WHATSAPP_API_URL is missing.");
  }

  try {
    const baseUrl = new URL(url);
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
      throw new Error("API_URL_INVALID: Protocol must be http:// or https://");
    }
    
    // Remove trailing slash
    return url.replace(/\/$/, "");
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("API_URL_INVALID")) {
      throw e;
    }
    throw new Error("API_URL_INVALID: The provided VITE_WHATSAPP_API_URL is not a valid URL.");
  }
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
