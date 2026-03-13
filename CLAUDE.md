# CLAUDE.md — MonoPix 개발 가이드

이 파일은 Claude Code가 이 레포를 유지보수할 때 참고하는 컨텍스트 문서입니다.

---

## 프로젝트 개요

**MonoPix** — 브라우저 전용 픽셀 아트 변환 도구. 서버 없음, 계정 없음.

- 이미지 업로드 → 1:1 크롭 → 해상도 선택 → 픽셀 아트 변환 → 다운로드/히스토리

---

## 기술 스택

| 항목       | 선택                                    |
| ---------- | --------------------------------------- |
| 프레임워크 | React 19 + TypeScript 5.9               |
| 빌드       | Vite 7 (`@vitejs/plugin-react-swc`)     |
| 스타일     | Tailwind CSS v4 + shadcn/ui             |
| 상태 관리  | Zustand 5                               |
| DB         | Dexie.js (IndexedDB)                    |
| 크롭       | react-easy-crop                         |
| 픽셀 처리  | Web Worker (Canvas API)                 |
| 다국어     | react-i18next (en/ko)                   |
| 폰트       | Pretendard (CDN), KenneyMini (로컬 TTF) |

**중요**: `@tailwindcss/vite@4` 는 vite `^5|^6|^7` 만 지원 — vite 8 사용 금지.
`.npmrc`에 `legacy-peer-deps=true` 설정 필수 (shadcn/vite peer dep 충돌 때문).

---

## 디렉토리 구조

```
src/
├── assets/
│   ├── fonts/KenneyMini.ttf       # 픽셀 폰트 (헤더 타이틀, Convert 버튼 hover)
│   ├── logo.png                   # 인앱 헤더 로고 (favicon2 계열, 192x192)
│   └── logo-small.png             # 헤더용 소형 로고 (MainLayout에서 import)
├── components/
│   ├── MainLayout.tsx             # 전체 레이아웃 + 글로벌 drag&drop
│   ├── crop/CropEditor.tsx        # react-easy-crop 래퍼 + GridOverlay SVG
│   ├── history/HistoryPanel.tsx   # 하단 히스토리 패널 (슬라이딩)
│   ├── preview/PreviewArea.tsx    # before/after/compare 뷰 (canvas 기반)
│   ├── shared/
│   │   ├── ConvertButton.tsx      # hover 시 픽셀화 애니메이션 버튼
│   │   ├── ConfirmDialog.tsx      # 커스텀 confirm 모달 (window.confirm 대체)
│   │   └── LoadingOverlay.tsx     # 변환 중 오버레이 + PixelProgressBar
│   ├── sidebar/ControlPanel.tsx   # 우측 설정 패널
│   └── upload/UploadZone.tsx      # 업로드 드롭존
├── hooks/
│   ├── useConvert.ts              # 변환 오케스트레이터 (Worker 통신)
│   └── useValidResolutions.ts     # 크롭 크기 기준 유효 해상도 계산
├── lib/
│   ├── db.ts                      # Dexie DB (history, max 10개 FIFO)
│   ├── i18n.ts                    # react-i18next 초기화
│   └── utils.ts                   # cn() 유틸
├── locales/
│   ├── en/translation.json
│   └── ko/translation.json
├── stores/
│   ├── upload.store.ts            # 업로드된 이미지 상태
│   ├── crop.store.ts              # crop 위치/줌/결과 픽셀 영역
│   ├── settings.store.ts          # 해상도/출력모드/변환타입/뷰모드 등 (persist)
│   ├── conversion.store.ts        # 변환 상태 (idle/converting/done/error)
│   └── history.store.ts           # 히스토리 목록 (Dexie 연동)
└── workers/
    └── pixelate.worker.ts         # 픽셀화 로직 (Web Worker)

public/                            # favicon 파일들 (favicon1 계열)
docs/                              # README용 이미지 (logo.png, 예시 이미지들)
```

---

## 핵심 아키텍처

### 상태 흐름

```
upload.store (image)
    ↓
crop.store (croppedAreaPixels)  ←→  settings.store (resolution, pixelateMode, outputMode)
    ↓
useConvert hook
    ├─ getCroppedImageData()    # Canvas에서 픽셀 데이터 추출
    ├─ Web Worker (pixelate.worker.ts)
    └─ conversion.store (status, resultDataUrl, originalCroppedDataUrl)
                                ↓
                          history.store + Dexie DB
```

### 설정 persist 범위

`settings.store`는 Zustand `persist` 미들웨어 사용.
**localStorage에 저장되는 것**: `language`, `outputMode` 만.
`resolution`, `pixelateMode`, `viewMode`, `gridOverlay` 는 세션마다 초기화됨 (의도적).

### 픽셀화 로직 (`pixelate.worker.ts`)

두 가지 알고리즘:

- **frequent (Clean / 깔끔함)**: 셀 내 색상을 `Q=8` 단위로 quantize 후 최빈값 선택. 선명하고 그래픽적.
- **average (Detail / 섬세함)**: 셀 내 불투명 픽셀의 RGB 평균. 부드러운 그라데이션.

셀 경계 계산: `Math.round(col * cellW)` — 갭/오버랩 없이 인접 셀이 정확히 맞붙음.

투명도 처리: 셀 내 50% 이상 투명(alpha < 128)이면 해당 셀 전체를 투명으로 처리.

### Canvas 안티앨리어싱 주의사항 (중요)

`react-easy-crop`의 `croppedAreaPixels`는 **float 좌표**를 반환함.
`getCroppedImageData()`에서 반드시:

1. `Math.round()`로 정수 변환 후 canvas 크기 지정
2. `ctx.imageSmoothingEnabled = false` 설정

이를 안 하면 서브픽셀 블렌딩으로 픽셀 데이터가 오염되어 셀 색상이 불균일해짐.

`PreviewArea.tsx`의 결과 이미지 표시도 `<img>` CSS 스케일링 대신 `<canvas>`에
`imageSmoothingEnabled = false`로 직접 그림 — Chrome은 `imageRendering: pixelated`를
downscale 시 무시하는 버그가 있음.

---

## 컴포넌트별 주요 주의사항

### CropEditor

- `react-easy-crop`의 내부 DOM 요소 `.reactEasyCrop_CropArea`를 `ResizeObserver`로 감시해서 GridOverlay SVG를 정확히 위에 올림.
- `key={imageUrl}` 로 이미지 변경 시 Cropper 강제 remount.
- `showGrid={false}` — 라이브러리 내장 그리드 끄고 커스텀 SVG 그리드 사용.

### ControlPanel (우측 사이드바) 메뉴 순서

Language → Reset Settings → **Convert Type** → Resolution → Grid Overlay → Output Mode → (Output size info) → (View Mode, 변환 후만 표시)

### ConvertButton

- hover 시 `hover:rounded-none` (각진 모서리) + 내부 span이 KenneyMini 폰트 + `tracking-widest`로 전환 → "픽셀화되는" 느낌.

### ConfirmDialog

- `window.confirm` 대신 커스텀 모달 사용. 오버레이 클릭 시 취소.
- 현재 히스토리 Clear All 에서만 사용. 다른 confirm이 필요할 때도 이 컴포넌트 재사용.

### PreviewArea (compare 모드)

- Before를 전체에 깔고, After는 `clipPath: 'inset(0 0 0 50%)'`로 오른쪽 절반만 표시.
- 두 이미지 모두 같은 `PixelCanvas` 컴포넌트로 렌더링 — canvas 크기는 컨테이너 크기에 맞게 `Math.min` scale로 계산.

---

## i18n

번역 키 파일: `src/locales/en/translation.json`, `src/locales/ko/translation.json`

새 UI 텍스트 추가 시 반드시 **en/ko 둘 다** 추가. 누락되면 키 문자열이 그대로 노출됨.

언어 변경: `settings.store`의 `language` 업데이트 + `i18n.changeLanguage()` 동기 호출 (둘 다 필요).

---

## DB 스키마 (`lib/db.ts`)

```typescript
HistoryItem {
  id?: number          // auto-increment
  originalFileName: string
  createdAt: number    // Date.now()
  resolution: number
  outputMode: 'original-size' | 'resized'
  resultDataUrl: string   // 풀사이즈 PNG base64
  thumbnailDataUrl: string  // 80x80 PNG base64
  cropWidth: number
  cropHeight: number
}
```

DB 이름: `monopix`, 최대 10개 유지 (추가 시 가장 오래된 것 자동 삭제).

**DB 스키마 변경 시** `this.version()` 번호를 올려야 함 — 안 하면 기존 사용자 DB 오류.

---

## 폰트 사용 규칙

- **Pretendard** — 기본 UI 폰트 (`var(--font-sans)`). CDN 로드.
- **KenneyMini** — 픽셀 느낌이 필요한 곳만 한정 사용:
  - 헤더 "MonoPix" 타이틀
  - Convert 버튼 hover 상태
  - 로딩 진행 텍스트

KenneyMini는 인라인 스타일 `style={{ fontFamily: 'KenneyMini, monospace' }}` 또는
Tailwind `group-hover:[font-family:KenneyMini,monospace]`로 적용.

---

## 개발 워크플로우

```bash
npm run dev        # 개발 서버 (localhost:5173)
npm run build      # 타입 체크 + 프로덕션 빌드
npm run lint       # ESLint 검사
npm run lint:fix   # ESLint 자동 수정
npm run format     # Prettier 포맷
```

**코드 작성 후 순서**: `npm run lint:fix` → `npm run format` → `npm run build` 로 확인.
TypeScript 에러는 빌드에서만 잡힘 (`tsc -b` 포함). 개발 서버는 타입 에러 무시하고 실행됨.

ESLint 설정: `eslint.config.js` — `src/components/ui/**` 는 shadcn 자동생성 파일이므로
`react-refresh/only-export-components` 규칙 exempt.

---

## 에셋 구조

```
public/          # 브라우저 직접 접근 가능한 파일 (favicon 등)
  favicon.ico / favicon.svg / favicon-96x96.png
  apple-touch-icon.png
  web-app-manifest-*.png / site.webmanifest

src/assets/
  logo.png          # 인앱 헤더 로고 (favicon2 계열, 192x192)
  logo-small.png    # MainLayout 헤더에서 실제 사용 (더 작은 버전)
  fonts/KenneyMini.ttf
  1.convert-before.png   # 예시 이미지 (원본)
  2.convert-clean.png    # 예시 이미지 (Clean 결과)
  3.convert-detail.png   # 예시 이미지 (Detail 결과)

docs/
  logo.png           # README용 고해상도 로고 (monipix-logo.png 계열, 523x461)
  1~3.convert-*.png  # README 예시 테이블용 사본
  SEPC.md / TECH_STACK.md
```

---

## 알려진 트레이드오프 / 설계 결정

1. **Worker 매번 새로 생성**: 변환할 때마다 `new Worker(...)` 후 완료 시 `terminate()`. Pool 없음. 변환이 빠르고 동시 호출이 없어서 단순하게 유지.

2. **history resultDataUrl = 풀사이즈 PNG base64**: IndexedDB에 큰 데이터 저장. 10개 제한이 있어 감내 가능. 용량 문제 생기면 Blob 저장 방식 전환 검토.

3. **크롭 정책 없음**: `react-easy-crop` 기본값 사용. 이전에 "최소 크기 900px" 정책을 넣었다가 제거했음 — 다시 추가하지 말 것.

4. **다크모드 미지원**: shadcn CSS 변수는 다크모드 변수가 정의되어 있지만 테마 토글 UI 없음. 추후 추가 시 `ThemeProvider` + toggle 버튼 필요.

5. **비교(compare) 모드는 50:50 수직 분할만**: 가로 분할(`split-H`)은 초기 구현 후 제거됨. 재추가 불필요.
