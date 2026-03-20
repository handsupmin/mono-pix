# MonoPix

<p align="center">
  <img src="./docs/logo.png" alt="MonoPix logo" width="250" />
</p>

**See the world through a pixel monocle.**

Browser-only pixel art toolkit. No server, no account, no nonsense.

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

[한국어](./README.ko.md) · [日本語](./README.ja.md) · [中文](./README.zh.md) · [Español](./README.es.md)

---

## Snap — Turn Fake Pixel Art into Real Pixel Art

Most AI-generated pixel art is **fake** — blurry edges, anti-aliased borders, misaligned grids. It _looks_ like pixel art but every cell has slightly different sizes and mixed colors.

**Snap fixes all of that.** It auto-detects the original pixel grid, rebuilds every cell with a single clean color, and outputs a perfectly uniform grid. Transparency is fully preserved.

No resolution to set. No manual alignment. Just drop the image and hit convert.

| Before (blurry, misaligned)                                          | After (clean, uniform)                                             | After + Grid overlay                                                         |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| <img src="./docs/4.snap-before.png" alt="Snap Before" width="200" /> | <img src="./docs/5.snap-after.png" alt="Snap After" width="200" /> | <img src="./docs/6.snap-after-grid.png" alt="Snap After Grid" width="200" /> |

Powered by [`fast-pixelizer`](https://github.com/handsupmin/fast-pixelizer) — our open-source pixel art engine.

---

## Clean & Detail — Generate Pixel Art from Any Image

| Original                                                             | Clean                                                            | Detail                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| <img src="./docs/1.convert-before.png" alt="Original" width="200" /> | <img src="./docs/2.convert-clean.png" alt="Clean" width="200" /> | <img src="./docs/3.convert-detail.png" alt="Detail" width="200" /> |

**Clean** — most frequent color per cell. Sharp, graphic edges.

**Detail** — average color per cell. Smoother gradients, more texture.

---

## Features

- **Snap** — auto-detect pixel grid in AI art, rebuild with perfect alignment. Transparency preserved
- **Clean / Detail** — convert any image to pixel art, 8×8 to 256×256
- **Crop** — 1:1 editor with drag & zoom
- **Compare** — before / after / split views + Monocle magnifier for snap results
- **Download** — PNG export, original size or resized
- **History** — last 10 results saved locally
- **Dark mode** — full dark mode support
- **i18n** — English, Korean, Japanese, Chinese, Spanish

All processing runs in a Web Worker. Nothing leaves your device.

---

## Getting Started

**Requirements:** Node.js 18+

```bash
git clone https://github.com/handsupmin/mono-pix.git
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

[React 19](https://react.dev) · [TypeScript 5.9](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Zustand](https://zustand-demo.pmnd.rs) · [fast-pixelizer](https://github.com/handsupmin/fast-pixelizer) · [Dexie.js](https://dexie.org) · [react-easy-crop](https://github.com/ValentinH/react-easy-crop) · [react-i18next](https://react.i18next.com)

---

## Contributing

Contributions are welcome! Fork the repo, create a branch, and open a PR.

```bash
npm run lint:fix   # fix lint errors
npm run format     # format code
npm run build      # verify build passes
```

---

## License

MIT
