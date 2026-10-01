// Minimal, dependency-free JWT payload decode — used only to read `role`
// client-side for routing decisions (e.g. "send admins straight to the
// dashboard"). This does NOT verify the signature. Never trust it for
// anything security-sensitive; the API always re-checks the real token
// on every protected request regardless of what the UI does with this.
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
