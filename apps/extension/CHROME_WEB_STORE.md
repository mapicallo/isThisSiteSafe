# Chrome Web Store — Is this site safe

> **Estado (2026-07-26):** paquete y pantallazos listos; publicación **pendiente del aumento de cupo** (límite 20 extensiones).  
> Checklist completo → [`docs/pendiente-publicacion-cws.md`](../../docs/pendiente-publicacion-cws.md)  
> ZIP: `releases/IsThisSiteSafe-v0.2.0.zip` · Capturas: `C:\pantallazos\isThisSiteSafe\` + `store-assets/*-1280x800.png`

## Listing copy (EN)

**Name:** Is this site safe  

**Short description (≤132):**  
Check the current tab or paste a URL—green, orange, or red. On demand only. No background scanning.

**Detailed description:**  
Is this site safe helps you quickly check whether a website looks trustworthy—when you ask, not in the background.

1. Open the extension and tap “Check this tab”, or paste a URL.  
2. See a clear green / orange / red result with short reasons.  
3. Green = no known alerts from Google Safe Browsing and local checks (not a 100% guarantee).  
4. Orange = cannot confirm. Red = threat signal.

When you check a URL, it is sent once to AI4Context servers, which query Google Safe Browsing. No tab monitoring. No alarms. By AI4Context. UI: English and Spanish.

**Category:** Productivity (or Safety if available)  
**Single purpose:** On-demand trust check for the current tab or a pasted URL.

## Screenshots / promo

**Capturas reales (originales):**  
`C:\pantallazos\isThisSiteSafe\`  
(`1_isThisSiteSafe.png` … `4_isThisSiteSafe.png`)

**Listas para CWS (1280×800):**  
`apps/extension/store-assets/screenshot-1-1280x800.png` … `screenshot-4-1280x800.png`

## Permissions

- `activeTab` / `tabs` — read the active tab URL when you open the extension or tap Check this tab (not continuous monitoring)  
- `storage` — UI language preference  
- `host_permissions` for `https://www.ai4context.com/*` — send the URL you asked to check to the AI4Context Safe Browsing proxy  

## Remote code / network

No remote code execution. Network only to `https://www.ai4context.com/api/itss-check` on user-initiated checks.

## Package

```bash
cd apps/extension
npm install
npm run pack
```

Artifact: `apps/extension/releases/IsThisSiteSafe-v{version}.zip`  
Current ready package: **`IsThisSiteSafe-v0.2.0.zip`**
