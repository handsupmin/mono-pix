# MonoPix

<p align="center">
  <img src="./docs/logo.png" alt="MonoPix 로고" width="300" />
</p>

**픽셀 모노클로 세상을 바라보세요.**

이미지를 픽셀 아트로 변환해 주는 브라우저 기반 도구입니다.
서버도, 계정도, 설치도 필요 없습니다.

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

[English](./README.md) · [日本語](./README.ja.md) · [中文](./README.zh.md) · [Español](./README.es.md)

---

## 주요 기능

이미지를 업로드하고, 정사각형으로 자른 뒤, 해상도를 선택하면 픽셀 아트가 완성됩니다.

- **크롭** — 드래그와 줌을 지원하는 1:1 비율 편집기
- **깔끔함 (Clean)** — 셀에서 가장 많이 나온 색을 쓰는 방식. 선명하고 그래픽적. 8×8 ~ 256×256 선택 가능
- **섬세함 (Detail)** — 셀의 평균 색을 쓰는 방식. 더 부드럽고 풍부한 질감
- **복원 (Repair)** — AI가 만든 "가짜 픽셀아트"를 진짜 픽셀아트로 재구성. 해상도 직접 안 잡아도 됨 — 알아서 픽셀 잘 잡아줌 개쩜
- **비교** — 원본 / 결과 / 분할 비교 보기 지원
- **다운로드** — PNG로 내보내기, 크롭한 원본 크기 유지 또는 선택한 해상도로 저장 가능
- **히스토리** — 최근 10개 결과를 브라우저에 로컬 저장
- **다국어 지원** — 한국어, 영어, 일본어, 중국어(간체), 스페인어

모든 처리는 Web Worker에서 이루어지며, 데이터는 기기 밖으로 전송되지 않습니다.

---

## 사용 예시

| 원본                                                             | 깔끔함 (Clean)                                                    | 섬세함 (Detail)                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| <img src="./docs/1.convert-before.png" alt="원본" width="200" /> | <img src="./docs/2.convert-clean.png" alt="깔끔함" width="200" /> | <img src="./docs/3.convert-detail.png" alt="섬세함" width="200" /> |

**깔끔함(Clean)** 모드는 각 셀에서 가장 많이 사용된 색을 선택해, 선명하고 그래픽적인 결과를 만듭니다.

**섬세함(Detail)** 모드는 각 셀의 평균 색을 사용해, 더 부드러운 그라데이션과 풍부한 질감을 표현합니다.

### 스냅 (Repair) — 가짜 픽셀아트를 진짜 픽셀아트로

AI가 만든 이미지가 픽셀아트처럼 *보이는데* 사실은 아닌 경우 — 가장자리가 흐릿하고, 안티앨리어싱이 걸려있고, 그리드가 안 맞는 거요? **스냅 모드가 전부 고쳐줍니다.** 원래 픽셀 그리드를 자동 감지해서 모든 셀을 깨끗한 단일 색으로 다시 만들어줘요. 해상도 설정할 필요도 없이 — 알아서 다 잡아줍니다.

| 변환 전 (흐릿함, 그리드 어긋남)                                              | 변환 후 (깔끔, 균일)                                                       | 변환 후 + 그리드 오버레이                                                         |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| <img src="./docs/4.snap-before.png" alt="스냅 변환 전" width="200" />        | <img src="./docs/5.snap-after.png" alt="스냅 변환 후" width="200" />        | <img src="./docs/6.snap-after-grid.png" alt="스냅 그리드" width="200" />           |

---

## 시작하기

**요구 사항:** Node.js 18 이상

```bash
git clone https://github.com/your-username/mono-pix.git
cd mono-pix
npm install
npm run dev
```

실행 후 [http://localhost:5173](http://localhost:5173) 에서 확인할 수 있습니다.

---

## 스크립트

| 명령어             | 설명               |
| ------------------ | ------------------ |
| `npm run dev`      | 개발 서버 실행     |
| `npm run build`    | 프로덕션 빌드      |
| `npm run preview`  | 빌드 결과 미리보기 |
| `npm run lint`     | ESLint 검사        |
| `npm run lint:fix` | ESLint 자동 수정   |
| `npm run format`   | Prettier 포맷 적용 |

---

## 기술 스택

[React](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) · [shadcn/ui](https://ui.shadcn.com) · [Tailwind CSS v4](https://tailwindcss.com) · [Zustand](https://zustand-demo.pmnd.rs) · [Dexie.js](https://dexie.org) · [react-easy-crop](https://github.com/ValentinH/react-easy-crop) · [react-i18next](https://react.i18next.com)

---

## 라이선스

MIT
