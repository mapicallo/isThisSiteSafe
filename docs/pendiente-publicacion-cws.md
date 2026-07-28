# Pendiente: publicación en Chrome Web Store

**Producto:** Is this site safe  
**Estado (2026-07-26):** listo para publicar — **bloqueado por el límite de 20 extensiones** de la cuenta de desarrollador.  
**Cuando Google apruebe el aumento de cupo → retomar este checklist.**

---

## Bloqueo actual

| Ítem | Detalle |
|------|---------|
| Cuenta CWS | `mapicalopez1971.apps` / email `mapicalloperez1971.apps@gmail.com` |
| Límite | 20 extensiones publicadas (cupo por defecto) |
| Solicitud | Enviada el **2026-07-26** vía [One Stop Support](https://support.google.com/chrome_webstore/contact/one_stop_support) → *Mi cuenta de desarrollador* → *Tengo otros problemas con mi cuenta* |
| Case ID | **7-9974000040937** |
| Qué pedir | Aumento del *published item limit* / cuota de ítems publicados |
| Respuesta (2026-07-27) | Soporte (Resmi) acusó recibo y **escaló** al equipo interno: *“I will escalate your request to the team and get back to you as soon as possible.”* — **aún no hay aumento de cupo**; esperar siguiente correo |

**Alternativa si el aumento tarda:** despublicar temporalmente alguna extensión poco usada para liberar 1 hueco y publicar esta.

**Misma cola que:** Create my AI Context (`C:\code_createMyAIcontext\docs\pendiente-publicacion-cws.md`).

---

## Paquete listo (ZIP)

Versión empaquetada: **v0.2.0**

| Ubicación | Archivo |
|-----------|---------|
| Principal | `C:\code-isThisSiteSafe\apps\extension\IsThisSiteSafe-v0.2.0.zip` |
| Copia releases | `C:\code-isThisSiteSafe\apps\extension\releases\IsThisSiteSafe-v0.2.0.zip` |

Regenerar (si hay cambios de código antes de publicar):

```bash
cd C:\code-isThisSiteSafe\apps\extension
npm run pack
```

El nombre del ZIP incluye la versión: `IsThisSiteSafe-v{version}.zip`.

---

## Pantallazos preparados

### Capturas originales (usuario)

`C:\pantallazos\isThisSiteSafe\`

| Archivo | Uso sugerido en CWS |
|---------|---------------------|
| `1_isThisSiteSafe.png` | Captura 1 (orden de listado) |
| `2_isThisSiteSafe.png` | Captura 2 |
| `3_isThisSiteSafe.png` | Captura 3 |
| `4_isThisSiteSafe.png` | Captura 4 |

### Versiones 1280×800 (recomendadas para subir)

Generadas con letterbox sobre fondo claro:

`C:\code-isThisSiteSafe\apps\extension\store-assets\`

| Archivo CWS |
|-------------|
| `screenshot-1-1280x800.png` |
| `screenshot-2-1280x800.png` |
| `screenshot-3-1280x800.png` |
| `screenshot-4-1280x800.png` |

También hay copia de los PNG originales en esa carpeta. **Preferir las `screenshot-*-1280x800.png` al publicar.**

---

## Checklist al autorizar el cupo

1. [ ] Confirmar en el Developer Dashboard que se puede **añadir / publicar** un ítem nuevo (o que el cupo ha subido).
2. [ ] Si el código avanzó desde v0.2.0: `npm run pack` y usar el ZIP nuevo con la versión actualizada.
3. [ ] **Nuevo ítem** → subir `IsThisSiteSafe-v0.2.0.zip` (o el ZIP regenerado).
4. [ ] Completar ficha (ver `apps/extension/CHROME_WEB_STORE.md`):
   - Nombre: **Is this site safe** (sin `?`)
   - Categoría: Productivity (o Safety si está disponible)
   - Short + detailed description (EN; UI también ES)
   - Single purpose: on-demand trust check for current tab or pasted URL
   - Permisos: `storage`, `activeTab`, `tabs`, host `https://www.ai4context.com/*`
5. [ ] Subir las 4 capturas **1280×800** desde `apps/extension/store-assets/` (o las de `C:\pantallazos\isThisSiteSafe\` si el dashboard las acepta).
6. [ ] Privacy policy: `privacy.html` embebida en la extensión (o URL pública en ai4context.com si se publica aparte).
7. [ ] Declarar uso remoto: la URL comprobada se envía una vez al proxy AI4Context → Google Safe Browsing (sin key en el cliente).
8. [ ] Enviar a revisión.
9. [ ] Tras aprobación: anotar el ID CWS y, si aplica, actualizar landing AI4Context + catálogo.

---

## Contenido relevante de v0.2.0 (recordatorio)

- Semáforo verde / naranja / rojo on-demand (pestaña activa o URL pegada).
- **Google Safe Browsing** vía proxy Vercel `POST https://www.ai4context.com/api/itss-check` (API key solo en servidor).
- Heurísticas locales (HTTPS, host sospechoso, blocklist de prueba).
- Ante fallo del proxy → **naranja** (nunca verde fingido).
- UI EN/ES; privacidad y CWS copy actualizados.
- Familia visual AI4Context (cabecera morada / footer).

---

## Infra relacionada (no va en el ZIP)

| Ítem | Dónde |
|------|--------|
| Proxy Safe Browsing | `code-rag-java` → `landing/api/itss-check.ts` (Vercel proyecto `ai4context-landing2`) |
| Secret | `SAFE_BROWSING_API_KEY` en Vercel (Production + Preview) |
| GCP | Proyecto `ai4context-itss` + Safe Browsing API habilitada |

---

## Docs relacionados

- Copy y notas de tienda: `apps/extension/CHROME_WEB_STORE.md`
- Plan Fase 2 detección: `docs/plan-fase-02-deteccion-safe-browsing.md`
- Plan producto: `docs/plan-implementacion.md` (si existe)
- Workspace: `C:\code-isThisSiteSafe\`
- Repo: https://github.com/mapicallo/isThisSiteSafe
