import { APP_VERSION, CHECK_API_URL, CHECK_TIMEOUT_MS } from './config.js';

export type SbThreat = {
  threatType: string;
  platformType: string;
  threatEntryType?: string;
};

export type SafeBrowsingOk = {
  status: 'ok';
  matched: boolean;
  threats: SbThreat[];
  latencyMs: number;
};

export type SafeBrowsingFail = {
  status: 'error';
  code: 'RATE_LIMIT' | 'TIMEOUT' | 'NETWORK' | 'UPSTREAM' | 'INVALID' | 'UNKNOWN';
};

export type SafeBrowsingResult = SafeBrowsingOk | SafeBrowsingFail;

type ProxyOkBody = {
  ok: true;
  safeBrowsing?: {
    matched?: boolean;
    threats?: SbThreat[];
    latencyMs?: number;
  };
};

type ProxyErrBody = {
  ok?: false;
  code?: string;
};

/**
 * POST URL to AI4Context proxy → Google Safe Browsing Lookup API v4.
 * Never calls Google with a key from the extension.
 */
export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const res = await fetch(CHECK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        url,
        client: 'is-this-site-safe',
        clientVersion: APP_VERSION,
      }),
    });

    if (res.status === 429) {
      return { status: 'error', code: 'RATE_LIMIT' };
    }

    let body: ProxyOkBody | ProxyErrBody = {};
    try {
      body = (await res.json()) as ProxyOkBody | ProxyErrBody;
    } catch {
      return { status: 'error', code: 'UPSTREAM' };
    }

    if (!res.ok || body.ok !== true) {
      const code = 'code' in body ? body.code : undefined;
      if (code === 'RATE_LIMIT') return { status: 'error', code: 'RATE_LIMIT' };
      if (code === 'INVALID_URL') return { status: 'error', code: 'INVALID' };
      if (res.status >= 500) return { status: 'error', code: 'UPSTREAM' };
      return { status: 'error', code: 'UNKNOWN' };
    }

    const sb = (body as ProxyOkBody).safeBrowsing;
    const threats = Array.isArray(sb?.threats) ? sb!.threats! : [];
    return {
      status: 'ok',
      matched: Boolean(sb?.matched) && threats.length > 0,
      threats,
      latencyMs: typeof sb?.latencyMs === 'number' ? sb.latencyMs : 0,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return { status: 'error', code: aborted ? 'TIMEOUT' : 'NETWORK' };
  } finally {
    clearTimeout(timer);
  }
}
