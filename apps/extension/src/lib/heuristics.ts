import type { TrustLevel, TrustReasonCode } from './trustTypes.js';

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

export type HeuristicOutcome = {
  level: TrustLevel;
  reasons: TrustReasonCode[];
};

/** On-device checks only (HTTPS, IP host, suspicious patterns, local test blocklist). */
export function runLocalHeuristics(url: string, host: string): HeuristicOutcome {
  const parsed = new URL(url);
  const h = host.toLowerCase();
  const reasons: TrustReasonCode[] = [];

  if (LOCAL_BLOCK_HOSTS.has(h) || h.endsWith('.testing.google.test')) {
    reasons.push('localBlocklist');
    return { level: 'red', reasons };
  }

  if (parsed.protocol === 'http:') {
    reasons.push('httpOnly');
    return { level: 'orange', reasons };
  }

  if (looksLikeIp(h)) {
    reasons.push('ipHost');
    return { level: 'orange', reasons };
  }

  if (SUSPICIOUS_RE.test(h) || (h.split('.').length >= 4 && h.includes('-'))) {
    reasons.push('suspiciousHost');
    return { level: 'orange', reasons };
  }

  reasons.push('httpsOk');
  return { level: 'green', reasons };
}
