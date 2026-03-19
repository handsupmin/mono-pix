# MonoPix

<p align="center">
  <img src="./docs/logo.png" alt="MonoPix 标志" width="300" />
</p>

**透过像素单片镜看世界。**

直接在浏览器中将任何图片转换为像素艺术。无需服务器，无需账号。

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

[English](./README.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md) · [Español](./README.es.md)

---

## 主要功能

上传图片，裁剪为正方形，选择分辨率，完成。就这么简单。

- **裁剪** — 支持拖拽和缩放的 1:1 比例编辑器
- **清晰 (Clean)** — 取每个格子中出现次数最多的颜色，边缘锐利，画风感强。8×8 到 256×256
- **细腻 (Detail)** — 取每个格子的平均颜色，渐变更柔和，细节更丰富
- **修复 (Repair)** — 把 AI 生成的"假像素画"变成真正的像素艺术。不用设置分辨率，自动检测网格，一键搞定
- **对比** — 转换前 / 转换后 / 分屏对比视图
- **下载** — 导出为 PNG，可保持原始裁剪尺寸或按所选分辨率调整大小
- **历史记录** — 最近 10 条结果本地保存在浏览器中
- **多语言** — 英语、韩语、日语、中文（简体）、西班牙语

所有处理均在 Web Worker 中运行，数据不会离开你的设备。

---

## 示例

| 原图                                                             | 清晰 (Clean)                                                    | 细腻 (Detail)                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| <img src="./docs/1.convert-before.png" alt="原图" width="200" /> | <img src="./docs/2.convert-clean.png" alt="清晰" width="200" /> | <img src="./docs/3.convert-detail.png" alt="细腻" width="200" /> |

**清晰 (Clean)** 取每个格子出现最多的颜色 — 边缘锐利，图形感强。

**细腻 (Detail)** 取每个格子的平均颜色 — 渐变更平滑，纹理更丰富。

### 对齐 (Repair) — 将假像素画变成真正的像素艺术

有一张 AI 生成的图片，*看起来*像像素画但其实不是？边缘模糊、有抗锯齿、网格没对齐？**对齐模式统统搞定。** 它会自动检测原始像素网格，用干净的单一颜色重建每个格子。不需要设置分辨率 — 自动帮你搞定。

| 修复前（模糊、网格错位）                                                     | 修复后（干净、均匀）                                                       | 修复后 + 网格叠加                                                                 |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| <img src="./docs/4.snap-before.png" alt="对齐前" width="200" />             | <img src="./docs/5.snap-after.png" alt="对齐后" width="200" />             | <img src="./docs/6.snap-after-grid.png" alt="对齐网格" width="200" />             |

---

## 开始使用

**运行环境:** Node.js 18 及以上

```bash
git clone https://github.com/your-username/mono-pix.git
cd mono-pix
npm install
npm run dev
```

在浏览器中打开 [http://localhost:5173](http://localhost:5173)。

---

## 脚本命令

| 命令               | 说明            |
| ------------------ | --------------- |
| `npm run dev`      | 启动开发服务器  |
| `npm run build`    | 生产环境构建    |
| `npm run preview`  | 预览构建结果    |
| `npm run lint`     | 运行 ESLint     |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format`   | Prettier 格式化 |

---

## 技术栈

[React](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [shadcn/ui](https://ui.shadcn.com) · [Tailwind CSS v4](https://tailwindcss.com) · [Zustand](https://zustand-demo.pmnd.rs) · [Dexie.js](https://dexie.org) · [react-easy-crop](https://github.com/ValentinH/react-easy-crop) · [react-i18next](https://react.i18next.com)

---

## 许可证

MIT
