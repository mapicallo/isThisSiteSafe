import {
  applyStaticTranslations,
  getLocale,
  initI18n,
  setLocale,
  t,
  type Locale,
  type MessageKey,
} from './lib/i18n/index.js';
import {
  evaluateUrl,
  isCheckableTabUrl,
  type TrustReasonCode,
  type TrustResult,
} from './lib/evaluateUrl.js';

const APP_VERSION = '0.1.1';

const localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
const checkTabBtn = document.getElementById('check-tab-btn') as HTMLButtonElement;
const checkUrlBtn = document.getElementById('check-url-btn') as HTMLButtonElement;
const urlInput = document.getElementById('url-input') as HTMLInputElement;
const formError = document.getElementById('form-error')!;
const resultEl = document.getElementById('result')!;
const resultBadge = document.getElementById('result-badge')!;
const resultLevel = document.getElementById('result-level')!;
const resultUrl = document.getElementById('result-url')!;
const resultReasons = document.getElementById('result-reasons')!;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const anotherBtn = document.getElementById('another-btn') as HTMLButtonElement;
const copyToast = document.getElementById('copy-toast')!;
const versionStrip = document.getElementById('version-strip')!;

let lastResult: TrustResult | null = null;

function reasonText(code: TrustReasonCode): string {
  const key = `reason_${code}` as MessageKey;
  return t(key);
}

function levelLabel(level: TrustResult['level']): string {
  if (level === 'green') return t('levelGreen');
  if (level === 'red') return t('levelRed');
  return t('levelOrange');
}

function showError(msg: string): void {
  formError.hidden = false;
  formError.textContent = msg;
}

function clearError(): void {
  formError.hidden = true;
  formError.textContent = '';
}

function renderResult(result: TrustResult): void {
  lastResult = result;
  resultEl.hidden = false;
  resultBadge.setAttribute('data-level', result.level);
  resultLevel.textContent = levelLabel(result.level);
  resultUrl.textContent = result.url;
  resultReasons.innerHTML = result.reasons.map((r) => `<li>${reasonText(r)}</li>`).join('');
}

function setBusy(on: boolean): void {
  checkTabBtn.disabled = on;
  checkUrlBtn.disabled = on;
  if (on) {
    checkTabBtn.textContent = t('checking');
    checkUrlBtn.textContent = t('checking');
  } else {
    checkTabBtn.textContent = t('checkTab');
    checkUrlBtn.textContent = t('checkUrl');
  }
}

async function getActiveTabUrl(): Promise<string | null> {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'itss.getLastTabUrl' });
    if (res?.url && isCheckableTabUrl(res.url)) return res.url as string;

    // Fallback: try activeTab if available
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.url && isCheckableTabUrl(tab.url)) return tab.url;
    return null;
  } catch {
    return null;
  }
}

async function runCheck(raw: string): Promise<void> {
  clearError();
  setBusy(true);
  try {
    const result = await evaluateUrl(raw);
    renderResult(result);
  } catch (e) {
    console.error('[ITSS] check', e);
    showError(t('errorNoTab'));
  } finally {
    setBusy(false);
  }
}

function bindUi(): void {
  versionStrip.textContent = `v${APP_VERSION}`;

  checkTabBtn.addEventListener('click', () => {
    void (async () => {
      clearError();
      setBusy(true);
      try {
        const url = await getActiveTabUrl();
        if (!url) {
          showError(t('errorNoTab'));
          return;
        }
        if (!isCheckableTabUrl(url)) {
          showError(t('errorTabUrl'));
          return;
        }
        const result = await evaluateUrl(url);
        renderResult(result);
      } catch (e) {
        console.error('[ITSS] tab check', e);
        showError(t('errorNoTab'));
      } finally {
        setBusy(false);
      }
    })();
  });

  checkUrlBtn.addEventListener('click', () => {
    void runCheck(urlInput.value);
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runCheck(urlInput.value);
    }
  });

  anotherBtn.addEventListener('click', () => {
    resultEl.hidden = true;
    lastResult = null;
    urlInput.focus();
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastResult) return;
    const lines = [
      t('appName'),
      levelLabel(lastResult.level),
      lastResult.url,
      ...lastResult.reasons.map((r) => `- ${reasonText(r)}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      copyToast.hidden = false;
      setTimeout(() => {
        copyToast.hidden = true;
      }, 1500);
    } catch (e) {
      console.warn('[ITSS] clipboard', e);
    }
  });

  localeSelect.value = getLocale();
  localeSelect.addEventListener('change', async () => {
    await setLocale(localeSelect.value as Locale);
    if (lastResult) renderResult(lastResult);
  });

  document.getElementById('privacy-link')!.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(chrome.runtime.getURL('privacy.html'), '_blank', 'noopener,noreferrer');
  });
}

async function boot(): Promise<void> {
  await initI18n();
  localeSelect.value = getLocale();
  applyStaticTranslations();
  bindUi();
}

void boot();
