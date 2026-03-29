# MonoPix

<p align="center">
  <img src="./docs/logo.png" alt="Logo de MonoPix" width="300" />
</p>

**Convierte pixel art falso en real**

Rápido, gratis, y funciona en tu navegador. Sin servidor, sin cuenta.

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

[English](./README.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md) · [中文](./README.zh.md)

---

## Pruébalo Ahora

**[www.mono-pix.com](https://www.mono-pix.com)**

---

## Snap — Convierte Pixel Art Falso en Pixel Art Real

Las imágenes generadas por IA _parecen_ pixel art, pero no lo son realmente. Bordes borrosos, contornos suavizados, cuadrícula desalineada. **El modo Snap detecta automáticamente la cuadrícula original de píxeles y reconstruye cada celda con un único color limpio.** Preserva la transparencia. No hay que configurar resolución.

| Antes (borroso, desalineado)                                        | Después (limpio, uniforme)                                           | Después + Cuadrícula                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| <img src="./docs/4.snap-before.png" alt="Snap Antes" width="200" /> | <img src="./docs/5.snap-after.png" alt="Snap Después" width="200" /> | <img src="./docs/6.snap-after-grid.png" alt="Snap Cuadrícula" width="200" /> |

Funciona sobre [`fast-pixelizer`](https://github.com/handsupmin/fast-pixelizer).

**Nota sobre la calidad de entrada**

Las imágenes “estilo pixel art” generadas por ChatGPT suelen ser una mala entrada para Snap. Pueden verse pixeladas, pero la imagen original muchas veces ya trae celdas con anchos y altos desiguales, bordes suaves y ejes ligeramente desviados. Snap puede regularizar el resultado, pero no puede garantizar una recuperación perfecta si la cuadrícula original ya era inconsistente.

Si vas a generar imágenes nuevas específicamente para Snap, recomendamos Nano Banana o cualquier flujo que conserve desde el inicio una cuadrícula cuadrada de baja resolución de forma más estable.

---

## Funcionalidades

- **Snap** — Reconstruye pixel art "falso" generado por IA en pixel art real. Detección automática de cuadrícula, preserva transparencia
- **Recorte** — Editor de relación de aspecto 1:1 con arrastre y zoom
- **Limpio (Clean)** — Usa el color más frecuente en cada celda. Bordes nítidos y estilo gráfico. De 8×8 a 256×256
- **Detalle (Detail)** — Usa el color promedio de cada celda. Degradados más suaves y mayor textura
- **Comparar** — Vistas antes / después / comparación dividida
- **Descargar** — Exporta como PNG manteniendo el tamaño original o ajustando a la resolución seleccionada
- **Historial** — Los últimos 10 resultados guardados localmente en tu navegador
- **Multiidioma** — Inglés, coreano, japonés, chino simplificado, español

Todo el procesamiento ocurre en un Web Worker. Nada sale de tu dispositivo.

---

## Ejemplo

| Original                                                             | Limpio                                                            | Detalle                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| <img src="./docs/1.convert-before.png" alt="Original" width="200" /> | <img src="./docs/2.convert-clean.png" alt="Limpio" width="200" /> | <img src="./docs/3.convert-detail.png" alt="Detalle" width="200" /> |

**Limpio (Clean)** toma el color más frecuente en cada celda — bordes nítidos y estilo gráfico.

**Detalle (Detail)** promedia todos los colores en cada celda — degradados más suaves y más textura.

---

## Cómo empezar

**Requisitos:** Node.js 18 o superior

```bash
git clone https://github.com/handsupmin/mono-pix.git
cd mono-pix
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

---

## Scripts

| Comando            | Descripción                      |
| ------------------ | -------------------------------- |
| `npm run dev`      | Iniciar servidor de desarrollo   |
| `npm run build`    | Build de producción              |
| `npm run preview`  | Vista previa del build           |
| `npm run lint`     | Ejecutar ESLint                  |
| `npm run lint:fix` | Corregir errores automáticamente |
| `npm run format`   | Formatear con Prettier           |

---

## Stack

[React 19](https://react.dev) · [TypeScript 5.9](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Zustand](https://zustand-demo.pmnd.rs) · [fast-pixelizer](https://github.com/handsupmin/fast-pixelizer) · [Dexie.js](https://dexie.org) · [react-easy-crop](https://github.com/ValentinH/react-easy-crop) · [react-i18next](https://react.i18next.com)

---

## Contribuir

¡Las contribuciones son bienvenidas! Haz fork del repositorio, crea una rama y abre un PR.

```bash
npm run lint:fix   # corregir errores de lint
npm run format     # formatear código
npm run build      # verificar que el build pasa
```

---

## Apoyo

Si te gusta MonoPix, invítame un café!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/handsupmin)

---

## Licencia

MIT
