# Is this site safe

Chrome extension that checks the **current tab** or a **pasted URL** on demand — green / orange / red trust signal. No background scanning. By AI4Context.

**Store name:** Is this site safe  
**Repo:** https://github.com/mapicallo/isThisSiteSafe  
**Plan:** [docs/plan-implementacion.md](docs/plan-implementacion.md)

## Status

| Version | Scope |
|---------|--------|
| **0.1.0** | MVP: check active tab + paste URL, traffic-light UI, local heuristics (Safe Browsing hook ready) |
| 0.2.x | Safe Browsing / reputation API + PWA |

## Load in Chrome (unpacked)

`C:\code-isThisSiteSafe\apps\extension\dist`

1. `chrome://extensions` → Developer mode  
2. Load unpacked → `apps/extension/dist`  
3. After code changes: `cd apps/extension && npm run build` → reload extension  

## Develop

```bash
cd apps/extension
npm install
npm run build
# or: npm run pack
```

## Privacy

On-demand URL checks only. See `apps/extension/public/privacy.html`.
