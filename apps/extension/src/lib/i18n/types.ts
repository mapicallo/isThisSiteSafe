export type Locale = 'en' | 'es';

export type MessageKey =
  | 'appName'
  | 'byAi4Context'
  | 'langLabel'
  | 'footerByPrefix'
  | 'footerSupport'
  | 'privacy'
  | 'helpOnDemand'
  | 'checkTab'
  | 'checking'
  | 'pasteUrl'
  | 'urlPlaceholder'
  | 'checkUrl'
  | 'checkAnother'
  | 'copySummary'
  | 'copied'
  | 'levelGreen'
  | 'levelOrange'
  | 'levelRed'
  | 'disclaimer'
  | 'errorNoTab'
  | 'errorTabUrl'
  | 'reason_httpsOk'
  | 'reason_httpOnly'
  | 'reason_invalidUrl'
  | 'reason_notHttp'
  | 'reason_ipHost'
  | 'reason_suspiciousHost'
  | 'reason_localBlocklist'
  | 'reason_safeBrowsingHit'
  | 'reason_safeBrowsingUnavailable'
  | 'reason_localChecksOnly';

export type Messages = Record<MessageKey, string>;

export const LOCALES: Locale[] = ['en', 'es'];

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as string[]).includes(v);
}

export function detectLocaleFromNavigator(): Locale {
  const nav = (navigator.language ?? 'en').toLowerCase();
  if (nav.startsWith('es')) return 'es';
  return 'en';
}
