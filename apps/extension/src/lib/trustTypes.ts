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
  | 'safeBrowsingClean'
  | 'safeBrowsingUnavailable'
  | 'safeBrowsingRateLimit'
  | 'threatMalware'
  | 'threatSocialEngineering'
  | 'threatUnwantedSoftware'
  | 'threatPha'
  | 'localChecksOnly';

export type TrustResult = {
  level: TrustLevel;
  url: string;
  host: string;
  reasons: TrustReasonCode[];
};
