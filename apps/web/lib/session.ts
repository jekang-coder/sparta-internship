import { SessionUser } from './types';

export function parseSession(cookieValue: string | undefined): SessionUser | null {
  if (!cookieValue) return null;
  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded);
    if (parsed && parsed.userId && parsed.role && parsed.name) {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeSession(session: SessionUser): string {
  return encodeURIComponent(JSON.stringify(session));
}
