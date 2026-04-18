const LOCAL_BACKEND_URL = "http://localhost:9000";
const BACKEND_PORT = "9000";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export function getBackendBaseUrl() {
  const configuredUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
  const hasWindow = typeof window !== "undefined";

  if (!hasWindow) {
    return configuredUrl || LOCAL_BACKEND_URL;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isBrowserLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isConfiguredLocalhost =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredUrl);

  // If configured URL is valid and NOT localhost (or we ARE on localhost), use it directly.
  if (configuredUrl && !(isConfiguredLocalhost && !isBrowserLocal)) {
    return trimTrailingSlash(configuredUrl);
  }

  // On a non-localhost host (e.g. VM/server), derive backend URL from current hostname + backend port.
  // This handles the case where VITE_BACKEND_URL was not set at build time or was set to localhost.
  if (!isBrowserLocal) {
    return `${protocol}//${hostname}:${BACKEND_PORT}`;
  }

  return LOCAL_BACKEND_URL;
}
