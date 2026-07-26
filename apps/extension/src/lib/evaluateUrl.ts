export type TrustLevel = 'green' | 'orange' | 'red';

export type TrustReasonCode =
  | 'httpsOk'
  | 'httpOnly'
  | 'invalidUrl'
  | 'notHttp'
  | 'ipHost'
  | 'suspiciousHost'
  | 'localBlocklist'
  | 'safeBrowsingHit'
  | 'safeBrowsingUnavailable'
  | 'localChecksOnly';

export type TrustResult = {
  level: TrustLevel;
  url: string;
  host: string;
  reasons: TrustReasonCode[];
};

const LOCAL_BLOCK_HOSTS = new Set([
  'testsafebrowsing.appspot.com',
  'malware.testing.google.test',
  'ianfette.org',
]);

const SUSPICIOUS_RE =
  /(login|signin|verify|secure|account|update|banking|paypal|appleid|microsoft|wallet).{0,12}(confirm|alert|support|secure)/i;

function looksLikeIp(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':');
}

/** Normalize user or tab URL into https? URL string. */
export function normalizeUrlInput(raw: string): { ok: true; url: string } | { ok: false; reason: TrustReasonCode } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: 'invalidUrl' };

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, reason: 'invalidUrl' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'notHttp' };
  }

  parsed.hash = '';
  return { ok: true, url: parsed.toString() };
}

/**
 * Local heuristic check (MVP).
 * Safe Browsing can be plugged in later; without it we never claim strong safety—
 * green = HTTPS + no local red flags (honest “local checks only”).
 */
export async function evaluateUrl(rawUrl: string): Promise<TrustResult> {
  const norm = normalizeUrlInput(rawUrl);
  if (!norm.ok) {
    return {
      level: 'orange',
      url: rawUrl.trim() || '—',
      host: '—',
      reasons: [norm.reason],
    };
  }

  const parsed = new URL(norm.url);
  const host = parsed.hostname.toLowerCase();
  const reasons: TrustReasonCode[] = [];

  if (LOCAL_BLOCK_HOSTS.has(host) || host.endsWith('.testing.google.test')) {
    reasons.push('localBlocklist');
    return { level: 'red', url: norm.url, host, reasons };
  }

  if (parsed.protocol === 'http:') {
    reasons.push('httpOnly');
    return { level: 'orange', url: norm.url, host, reasons };
  }

  if (looksLikeIp(host)) {
    reasons.push('ipHost');
    return { level: 'orange', url: norm.url, host, reasons };
  }

  if (SUSPICIOUS_RE.test(host) || (host.split('.').length >= 4 && host.includes('-'))) {
    reasons.push('suspiciousHost');
    return { level: 'orange', url: norm.url, host, reasons };
  }

  // Hook for future Safe Browsing — currently unavailable in client MVP
  reasons.push('httpsOk');
  reasons.push('localChecksOnly');
  reasons.push('safeBrowsingUnavailable');

  return {
    level: 'green',
    url: norm.url,
    host,
    reasons,
  };
}

export function isCheckableTabUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}
