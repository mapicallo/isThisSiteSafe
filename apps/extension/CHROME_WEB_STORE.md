# Chrome Web Store — Is this site safe

**Estado:** v0.1.0 scaffold — publicación pendiente del cupo CWS (límite 20).

## Listing copy (EN)

**Name:** Is this site safe  

**Short description (≤132):**  
Check the current tab or paste a URL—green, orange, or red. On demand only. No background scanning.

**Detailed description:**  
Is this site safe helps you quickly check whether a website looks trustworthy—when you ask, not in the background.

1. Open the extension and tap “Check this tab”, or paste a URL.  
2. See a clear green / orange / red result with short reasons.  
3. Green = no known alerts from current checks (not a 100% guarantee).  
4. Orange = cannot confirm. Red = threat signal.

No tab monitoring. No alarms. By AI4Context. UI: English and Spanish.

**Category:** Productivity (or Safety if available)  
**Single purpose:** On-demand trust check for the current tab or a pasted URL.

## Permissions

- `activeTab` / `tabs` — read the active tab URL when you open the extension or tap Check this tab (not continuous monitoring)  
- `storage` — UI language preference  

## Package

```bash
cd apps/extension
npm install
npm run pack
```

Artifact: `apps/extension/releases/IsThisSiteSafe-v{version}.zip`
