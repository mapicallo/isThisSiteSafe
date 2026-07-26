import { runLocalHeuristics } from './heuristics.js';
import { checkSafeBrowsing, type SbThreat } from './safeBrowsingClient.js';
import type { TrustReasonCode, TrustResult } from './trustTypes.js';

export type { TrustLevel, TrustReasonCode, TrustResult } from './trustTypes.js';

function threatReason(threat: SbThreat): TrustReasonCode | null {
  switch (threat.threatType) {
    case 'MALWARE':
      return 'threatMalware';
    case 'SOCIAL_ENGINEERING':
      return 'threatSocialEngineering';
    case 'UNWANTED_SOFTWARE':
      return 'threatUnwantedSoftware';
    case 'POTENTIALLY_HARMFUL_APPLICATION':
      return 'threatPha';
    default:
      return null;
  }
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
 * Safe Browsing (via AI4Context proxy) + local heuristics.
 * Green = no known alerts — not a 100% guarantee. Doubt → orange, never fake green.
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

  const sb = await checkSafeBrowsing(norm.url);

  if (sb.status === 'ok' && sb.matched) {
    reasons.push('safeBrowsingHit');
    const seen = new Set<TrustReasonCode>();
    for (const threat of sb.threats) {
      const code = threatReason(threat);
      if (code && !seen.has(code)) {
        seen.add(code);
        reasons.push(code);
      }
    }
    return { level: 'red', url: norm.url, host, reasons };
  }

  const sbFailed = sb.status === 'error';
  if (sbFailed) {
    reasons.push(sb.code === 'RATE_LIMIT' ? 'safeBrowsingRateLimit' : 'safeBrowsingUnavailable');
  }

  const local = runLocalHeuristics(norm.url, host);

  if (local.level === 'red') {
    reasons.push(...local.reasons);
    return { level: 'red', url: norm.url, host, reasons };
  }

  if (local.level === 'orange') {
    reasons.push(...local.reasons);
    return { level: 'orange', url: norm.url, host, reasons };
  }

  // Local green path
  reasons.push(...local.reasons);

  if (sbFailed) {
    // Never claim clean green if Safe Browsing did not confirm
    return { level: 'orange', url: norm.url, host, reasons };
  }

  reasons.push('safeBrowsingClean');
  return { level: 'green', url: norm.url, host, reasons };
}

export function isCheckableTabUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}
