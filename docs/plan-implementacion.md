# Is this site safe — Plan de implementación

**Fecha:** 2026-07-26  
**Estado:** v0.1.1 en uso (UI + pestaña OK); **siguiente:** Fase 2 detección  
**Plan Fase 2 (Safe Browsing):** [plan-fase-02-deteccion-safe-browsing.md](./plan-fase-02-deteccion-safe-browsing.md)  
**Nombre CWS:** **Is this site safe** (sin `?` en el título de tienda; patrón Find my Phone)  
**Repo:** https://github.com/mapicallo/isThisSiteSafe  
**Workspace:** `C:\code-isThisSiteSafe\`  
**Familia:** utilidad AI4Context (seguridad ligera / confianza web)  
**Bloqueo CWS:** límite 20 extensiones — misma cola que Create my AI Context

---

## 1. Objetivo

Permitir al usuario, **solo cuando lo pida**, comprobar si la web de la pestaña activa o una URL pegada parece **fiable**, **no fiable** o **sin datos suficientes**.

- Sin monitorizar pestañas en segundo plano  
- Sin alarmas automáticas  
- Resultado en semáforo: **verde / naranja / rojo**  
- Extensión Chrome sencilla + **PWA** para móvil (pegar URL)

**No promete:** antivirus, garantía de seguridad, ni “esta web es 100 % segura”.

**Sí promete:** comprobación rápida, on-demand, con motivos cortos y naranja honesto.

---

## 2. Nombre (CWS / producto)

Patrón **Find my Phone**: frase de intención que el usuario buscaría o reconocería al instante.

| Opción | Notas |
|--------|--------|
| **Is this site safe?** (recomendada) | Misma lógica que Find my Phone: pregunta = acción. Muy buscable y memorable |
| Check this site | Clara, un poco más “herramienta” que “pregunta” |
| Is this URL safe? | Enfatiza pegar enlace; menos natural para “pestaña activa” |
| Site trust check | Genérica; peor descubrimiento en CWS |

**Nombre CWS propuesto:** `Is this site safe`  
**Slug / repo:** `isThisSiteSafe` (https://github.com/mapicallo/isThisSiteSafe)  
**Workspace:** `C:\code-isThisSiteSafe\`  

**Por qué encaja**
- Identificación rápida (como Find my Phone → 320+ usuarios).
- La UI puede repetir la pregunta en el botón (“Check this tab”) sin contradicción.
- El semáforo responde literalmente a la pregunta del nombre.

**Cuidado de expectativas (obligatorio en ficha + UI)**  
El nombre suena absoluto; el producto **no garantiza** seguridad al 100 %. Mitigar con:
- short description y privacy: “signals / known alerts”, no “guaranteed safe”;
- verde = “No known alerts” / “Sin alertas conocidas”;
- naranja visible y honesto.

**Short description (borrador ≤132):**  
`Ask “is this site safe?” for the tab or a pasted URL—green, orange, or red. On demand only. No background scanning.`

---

## 3. Interés de usuario (resumen)

| A favor | En contra |
|---------|-----------|
| Duda real ante enlaces / phishing | Mucha competencia (Safe Browsing del navegador, etc.) |
| UX ultra simple (semáforo) | Falso verde = daño reputacional |
| On-demand = menos fricción de privacidad | Muchos sitios saldrán naranja (hay que educar) |
| PWA útil en móvil | No es “producto IA”; no refuerza el mensaje Nano |

**Diferenciación:** honestidad del naranja + 1–2 clics + copy claro + misma experiencia extensión/PWA. No “somos el mejor antivirus”.

---

## 4. Significado del semáforo (contrato de producto)

Definición **obligatoria** en UI, privacy y ficha CWS:

| Color | Significado para el usuario | Cuándo se muestra |
|-------|----------------------------|-------------------|
| **Verde — Fiable (según fuentes)** | No hay señales conocidas de amenaza en las fuentes consultadas | Sin hit en listas de amenaza; señales básicas OK (p. ej. HTTPS) |
| **Naranja — No se puede asegurar** | Faltan datos o hay señales dudosas pero no concluyentes | API sin datos, dominio muy nuevo, solo HTTP, timeout, error parcial, reputación desconocida |
| **Rojo — No fiable (señal de amenaza)** | Alguna fuente indica phishing / malware / sitio engañoso | Hit positivo en Safe Browsing u otra lista de amenaza acordada |

**Reglas de honestidad**
1. Ante duda → **naranja**, nunca verde.  
2. Verde ≠ “seguro al 100 %”; texto UI: “Sin alertas conocidas en nuestras fuentes”.  
3. Rojo → mensaje claro + no abrir / no introducir datos (consejo, no bloqueo del navegador en MVP).  
4. Mostrar siempre **1–3 motivos cortos** bajo el color.

---

## 5. Flujo UI (2 pantallas + resultado)

### Pantalla A — Inicio (única pantalla principal)

```
[Header: Is this site safe? | By AI4Context | idioma]

[ Botón primario: Comprobar esta pestaña ]
[ Campo: Pegar URL..................... ] [ Comprobar ]

[ Texto ayuda: Solo cuando tú lo pidas. No vigilamos tus pestañas. ]
```

### Pantalla B — Resultado (misma vista, bloque debajo o pantalla corta)

```
[ Círculo / franja GRANDE: verde | naranja | rojo ]
[ Etiqueta: Fiable / No se puede asegurar / No fiable ]
[ URL normalizada comprobada ]
[ Motivos:
  - …
  - … ]
[ Botón: Comprobar otra ] [ Copiar resumen ]
```

**Estados de carga:** spinner breve (“Consultando…”).  
**Errores de red:** naranja + “No se pudo consultar ahora”.

Cabecera/footer familia AI4Context (mismo patrón que AccessPortal / LocalChat / Create my AI Context).

---

## 6. Permisos (MVP extensión)

| Permiso | ¿MVP? | Motivo |
|---------|-------|--------|
| `activeTab` | Sí | Leer URL de la pestaña **solo al clic** en “Comprobar esta pestaña” |
| `storage` | Sí | Idioma UI, preferencias mínimas |
| `host_permissions` amplios / `<all_urls>` | **No** | Evitar vigilancia y revisión CWS dura |
| Lectura de contenido de página | **No** en MVP | Solo URL (origen); no scrapear DOM |
| Background monitoring / `webNavigation` | **No** | Fuera de alcance |

Service worker mínimo: abrir panel / acción. Sin escaneo continuo.

**PWA:** sin permisos de extensión; solo input de URL + llamada a la misma lógica/backend o API pública.

---

## 7. Fuente de datos / implementación MVP

El semáforo **no se inventa en el cliente**. Opciones:

### Opción A — Google Safe Browsing Lookup API (recomendada para MVP “rojo real”)

- **Pros:** estándar de industria, rojo creíble, relativamente rápido.  
- **Contras:** clave API, cuotas, ToS; muchos sitios → sin hit → necesitan capa heurística para no pintar todo verde a ciegas.  
- **Uso:** decidir **rojo** si hay threat match; si no, pasar a heurística → verde u naranja.

### Opción B — Solo heurística local (sin API de amenazas)

- Señales: HTTPS vs HTTP, TLD sospechoso, longitud/homoglyphs básicos, edad de dominio (si hay API WHOIS/RDAP).  
- **Pros:** barato, privado.  
- **Contras:** casi nunca rojo fiable → producto débil (“todo naranja/verde flojo”).

### Opción C — Servicio propio AI4Context

- Proxy que combine Safe Browsing + heurística; rate limit por instalación.  
- **Pros:** control, misma API para extensión y PWA.  
- **Contras:** coste, ops, responsabilidad; choca un poco con el mensaje “todo on-device” (aquí **sí hay red** por diseño).

### Decisión MVP propuesta

```
1. Normalizar URL (https, host, sin tracking basura opcional).
2. Consultar Safe Browsing (vía proxy ligero propio O clave restringida).
3. Si threat → ROJO + motivo.
4. Si no threat:
   - HTTP only / dominio < N días / error API → NARANJA
   - HTTPS + sin threat + sin banderas → VERDE (“sin alertas conocidas”)
5. Timeout / fallo red → NARANJA (“no se pudo asegurar”)
```

**Privacidad (copy):** se envía **solo la URL (o hash según API)** a la fuente de reputación para esa comprobación; no historial, no monitoreo. Documentar en `privacy.html`.

**IA / Gemini Nano:** **fuera del MVP**. Opcional post-MVP: explicar en lenguaje natural los motivos (no decidir el color).

---

## 8. Extensión + PWA

| Superficie | Uso |
|------------|-----|
| **Extensión Chrome** | “Comprobar esta pestaña” + pegar URL; panel flotante o side panel simple |
| **PWA** (`ai4context.com/.../is-this-site-safe/` o similar) | Pegar URL en móvil; mismo semáforo y mismos textos |

Misma lógica de decisión (cliente → mismo endpoint o misma librería de reglas + Safe Browsing).  
UI EN/ES mínimo (PT/FR/DE como Create my AI Context si se estandariza).

---

## 9. Fuera de alcance (MVP)

- Bloquear navegación automáticamente  
- Alertas push / icono badge permanente  
- Escanear todos los links de la página  
- VPN, antivirus, descarga de ficheros  
- Cuenta de usuario / sync nube de historial de checks (opcional: últimos N en `storage` local)  
- Dependencia de Gemini Nano  

---

## 10. Cumplimiento CWS (notas)

- Single purpose: *On-demand website trust check for the current tab or a pasted URL.*  
- No remote code arbitrario.  
- No engañar con “100 % safe”.  
- Política: no duplicar clones; un solo producto.  
- **Cupo 20:** no publicar hasta aumento de límite o liberar un hueco.

---

## 11. Fases sugeridas

| Fase | Entrega |
|------|---------|
| **0** | Repo + nombre cerrado + privacy + panel vacío familia AI4Context |
| **1 (MVP CWS)** | Pestaña activa + pegar URL + semáforo + motivos + Safe Browsing + heurística mínima + EN/ES |
| **2** | PWA móvil misma API |
| **3** | Historial local de comprobaciones; más señales (edad dominio); i18n ampliado |
| **4 (opc.)** | Explicación en lenguaje natural con Nano **después** del color |

---

## 12. Criterio de “done” MVP

Usuario en una web dudosa → clic extensión → **&lt; ~3 s** → ve color + URL + 1–3 motivos → entiende qué hacer.  
Usuario en móvil → abre PWA → pega URL → mismo resultado.  
Sin permisos de lectura continua. Naranja visible y explicado cuando no hay datos.

---

## 13. Decisiones a cerrar antes de código

1. **Nombre final:** **`Is this site safe?`** (cerrado salvo que prefieras variante sin `?`)  
2. **Safe Browsing:** ¿proxy AI4Context o clave en extensión (restringida)?  
3. **Workspace/repo:** ¿`C:\code_isThisSiteSafe` + GitHub `isThisSiteSafe`?  
4. **Prioridad vs Create my AI Context:** publicar solo tras cupo CWS.  
5. **Umbral dominio “nuevo”** para naranja (p. ej. &lt; 30 días) si hay fuente de edad.

---

## 14. Próximo paso

Cuando confirmes nombre + opción de API (proxy vs directo), arrancar **Fase 0** (repo + scaffold) o dejar este doc como backlog hasta tener cupo CWS.

**Referencias internas:** patrón UI `AccessPortal` / `LocalChat` / `Create my AI Context`; pendiente CWS Create my AI Context en `C:\code_createMyAIcontext\docs\pendiente-publicacion-cws.md`.
