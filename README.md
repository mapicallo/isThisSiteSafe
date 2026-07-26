# Is this site safe

Chrome extension that checks the **current tab** or a **pasted URL** on demand — green / orange / red trust signal. No background scanning. By AI4Context.

**Store name:** Is this site safe  
**Repo:** https://github.com/mapicallo/isThisSiteSafe  
**Plan:** [docs/plan-implementacion.md](docs/plan-implementacion.md) · [Fase 2 detección](docs/plan-fase-02-deteccion-safe-browsing.md)

## Status

| Version | Scope |
|---------|--------|
| **0.1.1** | MVP UI: tab + paste URL, traffic light, local heuristics (tab capture fixed) |
| **0.2.0** | Safe Browsing via AI4Context proxy + real red signals ([plan](docs/plan-fase-02-deteccion-safe-browsing.md)) |
| 0.3.x | PWA móvil |

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
