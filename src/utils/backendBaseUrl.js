const LOCAL_BACKEND_URL = "http://localhost:9000";

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
  const isBrowserLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isConfiguredLocalhost =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredUrl);

  // In public deployments, ignore localhost values accidentally baked into the build.
  if (!isBrowserLocal && isConfiguredLocalhost) {
    return trimTrailingSlash(window.location.origin);
  }

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  // Default to same-origin on non-local hosts so Nginx reverse proxy can route /api and /graphql.
  if (!isBrowserLocal) {
    return trimTrailingSlash(window.location.origin);
  }

  return LOCAL_BACKEND_URL;
}
