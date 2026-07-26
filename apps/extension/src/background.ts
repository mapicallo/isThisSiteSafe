/**
 * Is this site safe — floating panel (AI4Context family pattern).
 */
const PANEL_PAGE = 'panel.html';
const SESSION_PANEL_KEY = 'itss_panel_window_id';
const SESSION_TAB_URL_KEY = 'itss_last_tab_url';

function sessionLike(): chrome.storage.StorageArea {
  return chrome.storage.session ?? chrome.storage.local;
}

async function rememberActiveTabUrl(): Promise<void> {
  try {
    const wins = await chrome.windows.getAll({ populate: true });
    const panelPrefix = chrome.runtime.getURL(PANEL_PAGE).split(/[?#]/)[0];
    const normal = wins.filter((w) => w.type === 'normal');
    const focused = normal.find((w) => w.focused) ?? normal[0];
    const tab = focused?.tabs?.find((t) => t.active);
    const url = tab?.url ?? '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      await sessionLike().set({ [SESSION_TAB_URL_KEY]: url });
    }
    if (tab?.url?.split(/[?#]/)[0] === panelPrefix) return;
  } catch (e) {
    console.warn('[Is this site safe] remember tab url', e);
  }
}

async function clearStoredPanelWindowId(): Promise<void> {
  try {
    await sessionLike().remove(SESSION_PANEL_KEY);
  } catch {
    /* ignore */
  }
}

async function tryFocusStoredPanel(): Promise<boolean> {
  try {
    const data = await sessionLike().get(SESSION_PANEL_KEY);
    const wid = data[SESSION_PANEL_KEY] as number | undefined;
    if (typeof wid !== 'number') return false;

    const w = await chrome.windows.get(wid, { populate: true });
    const tabUrl = w.tabs?.[0]?.url ?? '';
    const ours = chrome.runtime.getURL(PANEL_PAGE);
    if (!tabUrl || tabUrl.split(/[?#]/)[0] !== ours.split(/[?#]/)[0]) {
      await sessionLike().remove(SESSION_PANEL_KEY);
      return false;
    }

    await chrome.windows.update(wid, { focused: true });
    return true;
  } catch {
    try {
      await sessionLike().remove(SESSION_PANEL_KEY);
    } catch {
      /* ignore */
    }
    return false;
  }
}

async function findExistingPanelWindow(): Promise<number | undefined> {
  const url = chrome.runtime.getURL(PANEL_PAGE);
  const windows = await chrome.windows.getAll({ populate: true });
  for (const win of windows) {
    for (const tab of win.tabs ?? []) {
      if (tab.url === url && win.id != null) return win.id;
    }
  }
  return undefined;
}

async function openPanel(): Promise<void> {
  await rememberActiveTabUrl();

  if (await tryFocusStoredPanel()) return;

  const existing = await findExistingPanelWindow();
  if (existing != null) {
    await chrome.windows.update(existing, { focused: true });
    await sessionLike().set({ [SESSION_PANEL_KEY]: existing });
    return;
  }

  const panelUrl = chrome.runtime.getURL(PANEL_PAGE);
  const remember = async (windowId: number | undefined) => {
    if (windowId !== undefined) {
      await sessionLike().set({ [SESSION_PANEL_KEY]: windowId });
    }
  };

  const attempts: chrome.windows.CreateData[] = [
    { url: panelUrl, type: 'popup', width: 420, height: 640, focused: true },
    { url: panelUrl, type: 'normal', width: 440, height: 660, focused: true },
  ];

  for (const createData of attempts) {
    try {
      const created = await chrome.windows.create(createData);
      await remember(created.id);
      return;
    } catch (e) {
      console.warn('[Is this site safe] window create failed', createData.type, e);
    }
  }

  try {
    await chrome.tabs.create({ url: panelUrl, active: true });
  } catch (e) {
    console.error('[Is this site safe] could not open panel', e);
  }
}

chrome.action.onClicked.addListener(() => {
  void openPanel();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'itss.getLastTabUrl') {
    void sessionLike()
      .get(SESSION_TAB_URL_KEY)
      .then((data) => {
        sendResponse({ url: (data[SESSION_TAB_URL_KEY] as string | undefined) ?? null });
      });
    return true;
  }
  if (message?.type === 'itss.refreshTabUrl') {
    void rememberActiveTabUrl().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  try {
    const data = await sessionLike().get(SESSION_PANEL_KEY);
    if (data[SESSION_PANEL_KEY] === windowId) {
      await sessionLike().remove(SESSION_PANEL_KEY);
    }
  } catch {
    /* ignore */
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void clearStoredPanelWindowId();
});

chrome.runtime.onStartup.addListener(() => {
  void clearStoredPanelWindowId();
});
