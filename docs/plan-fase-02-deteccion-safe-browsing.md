# Is this site safe — Fase 2: detección (Safe Browsing + semáforo real)

**Fecha:** 2026-07-26  
**Producto:** Is this site safe  
**Repo:** https://github.com/mapicallo/isThisSiteSafe  
**Workspace:** `C:\code-isThisSiteSafe\`  
**Versión objetivo:** **v0.2.0**  
**Base actual:** v0.1.1 (UI + pestaña/URL + heurística local; sin listas online)

---

## 1. Objetivo de esta fase

Pasar de “comprobaciones solo locales” a un semáforo respaldado por **fuentes oficiales de amenazas**, sin cambiar el producto:

- Sigue siendo **on-demand** (sin monitoreo).  
- **Rojo** = señal real de amenaza (listas).  
- **Naranja** = no se puede asegurar (error, HTTP, duda).  
- **Verde** = sin alertas conocidas en las fuentes usadas (no es garantía 100 %).

**No entra en esta fase:** PWA móvil (fase 3), URLhaus u otras listas secundarias (fase 2b opcional), explicaciones con IA.

---

## 2. Principios

1. **API key nunca en la extensión** — solo en un backend/proxy controlado por AI4Context.  
2. **Ante duda → naranja**, nunca verde.  
3. **Sin match en Safe Browsing ≠ seguro** — el copy de verde debe seguir siendo “sin alertas conocidas”.  
4. **Una URL por petición** (la que el usuario pide comprobar).  
5. **Rate limit** en el proxy para abuso y cuotas.  
6. Misma lógica de decisión reutilizable luego por la PWA.

---

## 3. Arquitectura propuesta

```
[Extensión panel]
    │  POST { url }
    ▼
[Proxy AI4Context]  ← API key Safe Browsing solo aquí
    │
    ├─► Google Safe Browsing Lookup API v4 (threatMatches:find)
    │
    └─► Respuesta JSON al cliente:
         { level, reasons[], threats?, source, checkedAt }
              │
              ▼
[evaluateUrl / merge]  ← combina SB + heurística local
              │
              ▼
         Semáforo UI (verde / naranja / rojo)
```

### Por qué proxy

| Sin proxy (key en extensión) | Con proxy |
|------------------------------|-----------|
| Key extraíble del ZIP/CWS | Key en servidor |
| Abuso de cuota a tu cargo | Rate limit / auth mínima |
| Difícil compartir con PWA | Mismo endpoint para extensión + PWA |

**Ubicación del proxy (cerrado):**

| Opción | Estado |
|--------|--------|
| **Vercel** (misma infra que ai4context.com) | **Elegida** |
| Cloudflare Worker | Descartada por ahora |
| Cloud Function aparte | No |

**URL tentativa:** ruta bajo el dominio AI4Context en Vercel, p. ej.  
`https://www.ai4context.com/api/itss/check`  
o un proyecto Vercel dedicado `itss-api` con dominio custom / `*.vercel.app` en preview.

Ventajas con Vercel: mismo flujo de deploy que la landing, secrets en el dashboard (`SAFE_BROWSING_API_KEY`), serverless functions (`api/*.ts` o App Router route handlers).

**Encaje con el repo landing actual (`code-rag-java/landing`):**  
Ya hay funciones en `landing/api/` (`waitlist.ts`, `myai4context-publish.ts`) y `vercel.json` enruta `/api/(.*)`. La opción natural es añadir p. ej. `landing/api/itss-check.ts` → `POST https://www.ai4context.com/api/itss-check` (o el path que use Vercel para ese fichero).

---

## 4. Contrato API del proxy

### Request

```http
POST /v1/check
Content-Type: application/json

{
  "url": "https://example.com/path",
  "client": "is-this-site-safe",
  "clientVersion": "0.2.0"
}
```

### Response 200

```json
{
  "ok": true,
  "url": "https://example.com/path",
  "host": "example.com",
  "safeBrowsing": {
    "configured": true,
    "matched": false,
    "threats": [],
    "latencyMs": 120
  },
  "checkedAt": "2026-07-26T19:00:00.000Z"
}
```

Si hay match:

```json
{
  "ok": true,
  "url": "http://testsafebrowsing.appspot.com/s/phishing.html",
  "host": "testsafebrowsing.appspot.com",
  "safeBrowsing": {
    "configured": true,
    "matched": true,
    "threats": [
      { "threatType": "SOCIAL_ENGINEERING", "platformType": "ANY_PLATFORM" }
    ],
    "latencyMs": 95
  },
  "checkedAt": "..."
}
```

### Errores

| HTTP | Significado cliente |
|------|---------------------|
| 400 | URL inválida → naranja `invalidUrl` |
| 429 | Rate limit → naranja `safeBrowsingUnavailable` / motivo rate limit |
| 502/503 | Google o proxy caído → naranja |
| Timeout cliente (~8 s) | naranja |

El **nivel final** (green/orange/red) lo calcula la extensión (o el proxy si preferís centralizar; **recomendación: extensión** para poder mezclar heurística local sin redeploy del proxy).

---

## 5. Lógica de decisión (cliente v0.2)

Orden estricto:

```
1. Normalizar URL (ya existe).
2. Si inválida / no http(s) → NARANJA.
3. Llamar proxy Safe Browsing.
4. Si matched → ROJO + reason safeBrowsingHit (+ tipo de amenaza en UI).
5. Si error/timeout/429 → continuar con heurística; marcar safeBrowsingUnavailable;
   nivel máximo permitido = NARANJA (no verde “limpio” si SB falló).
6. Si no matched:
   a. Heurística local (HTTP, IP, host sospechoso, blocklist test) como ahora.
   b. Si heurística dice rojo local → ROJO.
   c. Si heurística dice naranja → NARANJA.
   d. Si OK → VERDE + httpsOk + “sin alertas Safe Browsing” (nuevo reason).
```

### Mapa semáforo (contrato producto, sin cambio)

| Color | Cuándo |
|-------|--------|
| Rojo | Match SB o blocklist local de prueba |
| Naranja | HTTP, sospechoso, SB falló, rate limit, URL rara |
| Verde | HTTPS + sin match SB + sin banderas locales |

---

## 6. Google Safe Browsing — detalle técnico

**API:** Lookup API v4 — `threatMatches:find`  
**Docs:** https://developers.google.com/safe-browsing/v4/lookup-api  
**Precio:** gratis ([pricing](https://developers.google.com/safe-browsing/v4/pricing))  
**Restricción:** uso no comercial / developer; si el producto escala como negocio, valorar **Web Risk API** (comercial).

### Threat types a consultar (MVP)

- `MALWARE`  
- `SOCIAL_ENGINEERING`  
- `UNWANTED_SOFTWARE`  
- `POTENTIALLY_HARMFUL_APPLICATION` (si aplica)

Platform: `ANY_PLATFORM`  
Entry: `URL`

### Setup Google Cloud (checklist ops)

1. [ ] Proyecto GCP (p. ej. `ai4context-itss`)  
2. [ ] Habilitar **Safe Browsing API**  
3. [ ] Crear API key restringida (solo Safe Browsing + IPs/referrers del proxy)  
4. [ ] Guardar key en secret del Worker/hosting (nunca en git)  
5. [ ] Probar con URLs oficiales de test de Google Safe Browsing  

URLs de prueba (documentadas por Google; verificar las actuales en docs):

- Phishing / malware de test en `testsafebrowsing.appspot.com`  

---

## 7. Trabajo por subtareas (implementación)

### ITSS-2.0 — Ops / proxy

| ID | Tarea | Done |
|----|--------|------|
| 2.0.1 | Crear proyecto GCP + Safe Browsing API + key | [ ] |
| 2.0.2 | Scaffold proxy (`POST /v1/check`) | [ ] |
| 2.0.3 | Llamada a `threatMatches:find` + timeout | [ ] |
| 2.0.4 | Rate limit por IP / por día (p. ej. 60/h, 500/día) | [ ] |
| 2.0.5 | CORS solo orígenes extensión (`chrome-extension://…`) + PWA futura | [ ] |
| 2.0.6 | Logs sin PII excesiva (host sí, path truncado opcional) | [ ] |
| 2.0.7 | Variables `SAFE_BROWSING_API_KEY`, `ITSS_RATE_*` | [ ] |

### ITSS-2.1 — Extensión

| ID | Tarea | Done |
|----|--------|------|
| 2.1.1 | Módulo `safeBrowsingClient.ts` (fetch al proxy) | [ ] |
| 2.1.2 | Refactor `evaluateUrl.ts`: pipeline SB + heurística | [ ] |
| 2.1.3 | Config `CHECK_API_URL` (build-time / constante) | [ ] |
| 2.1.4 | i18n: motivos SB (phishing, malware, unavailable, rate limit) EN/ES | [ ] |
| 2.1.5 | UI: quitar “listas no configuradas” cuando SB OK; mostrar tipo amenaza en rojo | [ ] |
| 2.1.6 | Privacy.html: documentar envío de URL al proxy + Google SB | [ ] |
| 2.1.7 | CHROME_WEB_STORE.md + single purpose / remote | [ ] |
| 2.1.8 | Versión **0.2.0**, pack ZIP, pruebas manuales | [ ] |

### ITSS-2.2 — Pruebas manuales

| Caso | Esperado |
|------|----------|
| `https://example.com` | Verde (si SB sin match) |
| `http://example.com` | Naranja (HTTP), aunque SB limpio |
| URL phishing de test Google | Rojo |
| Proxy apagado / key inválida | Naranja + motivo unavailable |
| Pegar URL + comprobar pestaña | Igual que ahora, con SB |

---

## 8. Estructura de ficheros sugerida

```
apps/extension/src/lib/
  evaluateUrl.ts          # orquesta
  heuristics.ts           # extraer lógica local actual
  safeBrowsingClient.ts   # POST al proxy
  trustTypes.ts           # tipos compartidos

apps/proxy/   (o repo/infra aparte)
  src/index.ts
  wrangler.toml / vercel.json
  README.md
```

Si el proxy vive fuera de este monorepo, documentar URL y secretos en `docs/proxy-setup.md` (sin keys).

---

## 9. Privacidad y CWS

Actualizar privacy:

- Al comprobar, la URL se envía a **servidores AI4Context (proxy)** y de ahí a **Google Safe Browsing** para esa petición.  
- No historial de navegación, no monitoreo continuo.  
- No se vende la URL.

Host permissions: si el proxy es `https://api.ai4context.com/*`, declarar en manifest:

```json
"host_permissions": ["https://api.ai4context.com/*"]
```

(o el dominio final del Worker).

---

## 10. Fuera de alcance (esta fase)

| Ítem | Fase |
|------|------|
| PWA móvil | 3 |
| URLhaus / PhishTank | 2b opcional |
| Edad de dominio / WHOIS | 2b |
| Cache local de veredictos | 2b |
| Web Risk (comercial) | Solo si escala / ToS lo exige |
| Gemini Nano explicando el resultado | Post |

---

## 11. Criterio de “done” v0.2.0

1. Proxy en producción con key segura y rate limit.  
2. Extensión llama al proxy en cada check.  
3. URL de test Safe Browsing → **rojo** reproducible.  
4. Sitio HTTPS limpio → **verde** con motivos SB + local (sin “listas no configuradas”).  
5. Fallo de red/API → **naranja**, nunca verde fingido.  
6. Privacy + ficha CWS actualizadas.  
7. `IsThisSiteSafe-v0.2.0.zip` generado.

---

## 12. Estimación orientativa

| Bloque | Esfuerzo |
|--------|----------|
| GCP + proxy mínimo | 0,5–1 día |
| Cliente extensión + i18n + privacy | 0,5–1 día |
| Pruebas + ajustes copy | 0,5 día |

**Total:** ~2–3 días de trabajo enfocado.

---

## 13. Decisiones

1. **Hosting del proxy:** **Vercel** (infra AI4Context) — cerrado 2026-07-26.  
2. **Dominio / ruta pública del API:** por confirmar (p. ej. `/api/itss/check` en el proyecto landing o proyecto `itss-api` aparte).  
3. **ToS Safe Browsing:** confirmar uso no comercial OK para AI4Context ahora; plan B Web Risk si hace falta.  
4. **Rate limits** concretos (números) — propuestos en 2.0.4.

**Siguiente paso de implementación:** GCP Safe Browsing key + route handler Vercel (`POST /api/itss/check`) + cablear extensión.

---

## 14. Relación con el plan general

- Plan producto / fases globales: `docs/plan-implementacion.md`  
- Este documento: **solo Fase 2 detección**  
- Estado previo: UI y captura de pestaña OK en **v0.1.1**
