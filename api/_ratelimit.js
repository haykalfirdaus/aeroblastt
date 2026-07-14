// Shared in-memory rate limiter for login attempts.
// Imported by login.js and verify-otp.js so OTP verification can reset the same counter.
// Note: Vercel may run handlers in separate Lambda instances — this is best-effort
// (same as the previous per-file approach) but works in the common single-instance case.

export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const loginAttempts = new Map();

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (now - entry.windowStart > WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

export function remainingMs(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.windowStart;
  return Math.max(0, WINDOW_MS - elapsed);
}
