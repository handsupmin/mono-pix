# MonoPix

<p align="center">
  <img src="./docs/logo.png" alt="MonoPix 标志" width="300" />
</p>

**让假像素画变成真的**

快速、免费、在浏览器中直接运行。无需服务器，无需账号。

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

[English](./README.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md) · [Español](./README.es.md)

---

## Snap — 将假像素画变成真正的像素艺术

AI 生成的图片*看起来*像像素画，但其实不是。边缘模糊、有抗锯齿、网格没对齐。**Snap 模式会自动检测原始像素网格，用干净的单一颜色重建每个格子。** 透明度也会被保留。不需要设置分辨率，全部自动搞定。

| 转换前（模糊、网格错位）                                             | 转换后（干净、均匀）                                                | 转换后 + 网格叠加                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| <img src="./docs/4.snap-before.png" alt="Snap 转换前" width="200" /> | <img src="./docs/5.snap-after.png" alt="Snap 转换后" width="200" /> | <img src="./docs/6.snap-after-grid.png" alt="Snap 网格" width="200" /> |

---

## 主要功能

- **Snap** — 把 AI 生成的"假像素画"变成真正的像素艺术。网格自动检测，透明度保留
- **裁剪** — 支持拖拽和缩放的 1:1 比例编辑器
- **清晰 (Clean)** — 取每个格子中出现次数最多的颜色，边缘锐利，画风感强。8×8 到 256×256
- **细腻 (Detail)** — 取每个格子的平均颜色，渐变更柔和，细节更丰富
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

---

## 开始使用

**运行环境:** Node.js 18 及以上

```bash
git clone https://github.com/handsupmin/mono-pix.git
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

[React 19](https://react.dev) · [TypeScript 5.9](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [Tailwind CSS v4](https://tailwindcss.com) · [shadcn/ui](https://ui.shadcn.com) · [Zustand](https://zustand-demo.pmnd.rs) · [fast-pixelizer](https://github.com/handsupmin/fast-pixelizer) · [Dexie.js](https://dexie.org) · [react-easy-crop](https://github.com/ValentinH/react-easy-crop) · [react-i18next](https://react.i18next.com)

---

## 贡献

欢迎任何形式的贡献！Fork 这个仓库，创建一个分支，然后提交 PR 就可以了。

```bash
npm run lint:fix   # 自动修复 lint 错误
npm run format     # 格式化代码
npm run build      # 验证构建通过
```

---

## 支持

如果你喜欢 MonoPix，请我喝杯咖啡吧！

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/handsupmin)

---

## 许可证

MIT
