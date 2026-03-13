# MonoPix

[한국어](./README.ko.md)

<p align="center">
  <img src="./docs/logo.png" alt="MonoPix logo" width="300" />
</p>

**See the world through a pixel monocle.**

Convert any image into pixel art — right in your browser. No server, no account, no nonsense.

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

---

## What it does

Upload an image, crop it to a square, pick a resolution, and get pixel art. That's it.

- **Crop** — 1:1 aspect ratio editor with drag & zoom
- **Pixelate** — cell-based sampling, Clean (most frequent color) or Detail (average color), 8×8 to 256×256
- **Compare** — before / after / split compare views
- **Download** — export as PNG, keeping or resizing to the selected resolution
- **History** — last 10 results saved locally in your browser, no account needed
- **i18n** — English and Korean

All processing runs in a Web Worker. Nothing leaves your device.

---

## Example

| Original                                                             | Clean                                                            | Detail                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| <img src="./docs/1.convert-before.png" alt="Original" width="200" /> | <img src="./docs/2.convert-clean.png" alt="Clean" width="200" /> | <img src="./docs/3.convert-detail.png" alt="Detail" width="200" /> |

**Clean** picks the most frequent color in each cell — sharp, graphic edges.

**Detail** averages all colors in each cell — smoother gradients, more texture.

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
