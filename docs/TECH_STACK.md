# MonoPix Tech Stack

## 1. 핵심 프레임워크 & 빌드

| 항목            | 선택       | 비고                       |
| --------------- | ---------- | -------------------------- |
| Framework       | React 19   |                            |
| Language        | TypeScript | strict mode                |
| Build tool      | Vite       | `@vitejs/plugin-react-swc` |
| Package manager | npm        |                            |

---

## 2. UI

| 항목        | 선택            | 비고                      |
| ----------- | --------------- | ------------------------- |
| UI 컴포넌트 | shadcn/ui       | Tailwind 기반             |
| CSS         | Tailwind CSS v4 | shadcn 필수 의존성        |
| 폰트        | Pretendard      | CSS `@font-face` 또는 CDN |
| 아이콘      | lucide-react    | shadcn 기본 아이콘 세트   |

### 디자인 원칙

- **전체 UI**: shadcn + Pretendard 기반, 깔끔하고 가독성 좋은 현대적 툴 스타일
- **Convert 버튼**: hover 시 픽셀 감성 UI 적용 (픽셀 테두리, 계단형 shadow 등)
- **Progress bar fill**: 진행률에 따라 점진적 픽셀화
  - 0%: 일반적인 부드러운 바
  - 진행될수록 fill 영역이 픽셀 블록처럼 보이도록 변환
  - CSS clip-path + 커스텀 Canvas 렌더링 조합 또는 SVG 기반으로 구현

---

## 3. 상태 관리

| 항목      | 선택    | 비고          |
| --------- | ------- | ------------- |
| 전역 상태 | Zustand | 슬라이스 분리 |

### 상태 슬라이스 (예상)

- `uploadStore` — 원본 이미지, 파일명, 파일 크기
- `cropStore` — crop 영역, zoom, position
- `settingsStore` — 해상도, 출력 모드, grid overlay 여부, 언어
- `conversionStore` — 변환 상태, 결과 이미지, 보기 모드
- `historyStore` — 히스토리 목록, 선택 항목

---

## 4. 이미지 Crop

| 항목    | 선택            | 비고                         |
| ------- | --------------- | ---------------------------- |
| Crop UI | react-easy-crop | 1:1 고정, drag/pan/zoom 지원 |

### Crop 초기값 정책

1. 업로드 직후 이미지의 가로/세로 중 작은 값을 `minDim`으로 계산
2. `minDim >= 900`이면 crop 박스 크기: **900x900**
3. `minDim < 900`이면 crop 박스 크기: **minDim × minDim**
4. crop 박스 초기 위치: **이미지 정중앙**

---

## 5. i18n

| 항목 | 선택          | 비고            |
| ---- | ------------- | --------------- |
| i18n | react-i18next | 기본 언어: 영어 |

- 언어 전환 UI: 우측 조작 메뉴 상단에 위치
- 지원 언어: `en`, `ko`
- 번역 파일 위치: `src/locales/{en,ko}/translation.json`

---

## 6. 로컬 저장소

| 항목         | 선택      | 비고                        |
| ------------ | --------- | --------------------------- |
| IndexedDB    | Dexie.js  | 히스토리 이미지 데이터 저장 |
| localStorage | 직접 사용 | 설정값 등 가벼운 상태       |

---

## 7. 이미지 처리

| 항목        | 선택                           | 비고                    |
| ----------- | ------------------------------ | ----------------------- |
| 픽셀화 로직 | 브라우저 Canvas API (네이티브) | 별도 라이브러리 없음    |
| 비동기 처리 | Web Worker                     | Vite worker import 방식 |

- 픽셀화는 Web Worker에서 OffscreenCanvas 또는 ImageData 직접 조작으로 수행
- 메인 스레드 blocking 방지

---

## 8. 히스토리 UI

- 위치: 좌측 preview 화면 **하단**
- 형태: **가로 스크롤 리스트 (horizontal list)**
- 토글: 숨기기/펼치기 가능 (기본값: 펼쳐진 상태)
- 최대 저장 수: 10개

---

## 9. 기타

| 항목     | 선택                                    |
| -------- | --------------------------------------- |
| 유틸리티 | clsx, tailwind-merge (shadcn 기본 포함) |
| 린터     | ESLint                                  |
| 포매터   | Prettier                                |

---

## 10. 주요 패키지 요약

```
react, react-dom
typescript
vite, @vitejs/plugin-react-swc
tailwindcss
shadcn/ui
lucide-react
zustand
react-easy-crop
react-i18next, i18next
dexie
```
