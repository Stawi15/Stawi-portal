import { createClient } from "@insforge/sdk";

const baseUrl = import.meta.env.VITE_INSFORGE_URL as string | undefined;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined;

if (!baseUrl || !anonKey) {
  throw new Error(
    "Missing InsForge configuration. Copy .env.example to .env.local and set VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY.",
  );
}

export const insforge = createClient({ baseUrl, anonKey });
export const BACKEND_URL = baseUrl;
export const MEDIA_BUCKET = "website-media";

// Temporary auth bypass: when VITE_DISABLE_AUTH=true the portal skips the
// sign-in screen and signs in silently with the portal service account.
export const AUTH_DISABLED = import.meta.env.VITE_DISABLE_AUTH === "true";
export const SERVICE_EMAIL =
  (import.meta.env.VITE_PORTAL_SERVICE_EMAIL as string | undefined) ?? "";
export const SERVICE_PASSWORD =
  (import.meta.env.VITE_PORTAL_SERVICE_PASSWORD as string | undefined) ?? "";
