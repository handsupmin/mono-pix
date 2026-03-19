# MonoPix

<p align="center">
  <img src="./docs/logo.png" alt="Logo de MonoPix" width="300" />
</p>

**Ve el mundo a través de un monóculo de píxeles.**

Convierte cualquier imagen en pixel art, directamente en tu navegador. Sin servidor, sin cuenta, sin complicaciones.

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

[English](./README.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md) · [中文](./README.zh.md)

---

## Qué hace

Sube una imagen, recórtala en cuadrado, elige la resolución y listo. Así de simple.

- **Recorte** — Editor de relación de aspecto 1:1 con arrastre y zoom
- **Limpio (Clean)** — Usa el color más frecuente en cada celda. Bordes nítidos y estilo gráfico. De 8×8 a 256×256
- **Detalle (Detail)** — Usa el color promedio de cada celda. Degradados más suaves y mayor textura
- **Reparar (Repair)** — Toma ese pixel art "falso" generado por IA y lo reconstruye como pixel art de verdad. Sin ajustar resolución — detecta la cuadrícula solo
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

### Snap (Repair) — Convierte Pixel Art Falso en Pixel Art Real

¿Tienes una imagen generada por IA que *parece* pixel art pero no lo es realmente? ¿Bordes borrosos, contornos suavizados, cuadrícula desalineada? **El modo Snap lo arregla todo.** Detecta automáticamente la cuadrícula original de píxeles y reconstruye cada celda con un único color limpio. No hay que configurar resolución — lo resuelve solo.

| Antes (borroso, desalineado)                                                 | Después (limpio, uniforme)                                                 | Después + Cuadrícula                                                              |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| <img src="./docs/4.snap-before.png" alt="Snap Antes" width="200" />         | <img src="./docs/5.snap-after.png" alt="Snap Después" width="200" />       | <img src="./docs/6.snap-after-grid.png" alt="Snap Cuadrícula" width="200" />      |

---

## Cómo empezar

**Requisitos:** Node.js 18 o superior

```bash
git clone https://github.com/your-username/mono-pix.git
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

[React](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [shadcn/ui](https://ui.shadcn.com) · [Tailwind CSS v4](https://tailwindcss.com) · [Zustand](https://zustand-demo.pmnd.rs) · [Dexie.js](https://dexie.org) · [react-easy-crop](https://github.com/ValentinH/react-easy-crop) · [react-i18next](https://react.i18next.com)

---

## Licencia

MIT
