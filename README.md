# MonoPix

<p align="center">
  <img src="./docs/logo.png" alt="MonoPix logo" width="300" />
</p>

**See the world through a pixel monocle.**

Convert any image into pixel art — right in your browser. No server, no account, no nonsense.

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

[한국어](./README.ko.md) · [日本語](./README.ja.md) · [中文](./README.zh.md) · [Español](./README.es.md)

---

## What it does

Upload an image, crop it to a square, pick a resolution, and get pixel art. That's it.

- **Crop** — 1:1 aspect ratio editor with drag & zoom
- **Clean** — picks the most frequent color per cell, sharp graphic edges, 8×8 to 256×256
- **Detail** — averages all colors per cell, smoother gradients
- **Repair** — drops an AI-generated "fake" pixel art and re-grids it properly. No resolution to set — it just figures it out on its own
- **Compare** — before / after / split compare views
- **Download** — export as PNG, keeping or resizing to the selected resolution
- **History** — last 10 results saved locally in your browser, no account needed
- **i18n** — English, Korean, Japanese, Chinese (Simplified), Spanish

All processing runs in a Web Worker. Nothing leaves your device.

---

## Example

| Original                                                             | Clean                                                            | Detail                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| <img src="./docs/1.convert-before.png" alt="Original" width="200" /> | <img src="./docs/2.convert-clean.png" alt="Clean" width="200" /> | <img src="./docs/3.convert-detail.png" alt="Detail" width="200" /> |

**Clean** picks the most frequent color in each cell — sharp, graphic edges.

**Detail** averages all colors in each cell — smoother gradients, more texture.

### Snap (Repair) — Turn Fake Pixel Art into Real Pixel Art

Got an AI-generated image that *looks* like pixel art but isn't really? Blurry edges, anti-aliased borders, misaligned grid? **Snap mode fixes all of that.** It auto-detects the original pixel grid and rebuilds every cell with a single clean color. No resolution to set — it just figures it out.

| Before (blurry, misaligned)                                                  | After (clean, uniform)                                                     | After + Grid overlay                                                              |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| <img src="./docs/4.snap-before.png" alt="Snap Before" width="200" />        | <img src="./docs/5.snap-after.png" alt="Snap After" width="200" />         | <img src="./docs/6.snap-after-grid.png" alt="Snap After Grid" width="200" />      |

---

## Getting Started

**Requirements:** Node.js 18+

```bash
git clone https://github.com/your-username/mono-pix.git
cd mono-pix
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Scripts

| Command            | Description              |
| ------------------ | ------------------------ |
| `npm run dev`      | Start development server |
| `npm run build`    | Production build         |
| `npm run preview`  | Preview production build |
| `npm run lint`     | Run ESLint               |
| `npm run lint:fix` | Auto-fix lint errors     |
| `npm run format`   | Format with Prettier     |

---

## Stack

[React](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [shadcn/ui](https://ui.shadcn.com) · [Tailwind CSS v4](https://tailwindcss.com) · [Zustand](https://zustand-demo.pmnd.rs) · [Dexie.js](https://dexie.org) · [react-easy-crop](https://github.com/ValentinH/react-easy-crop) · [react-i18next](https://react.i18next.com)

---

## License

MIT
