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
- 지원 언어: `en` (영어), `ko` (한국어), `ja` (일본어), `zh` (중국어 간체), `es` (스페인어)
- 번역 파일 위치: `src/locales/{en,ko,ja,zh,es}/translation.json`

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

---

## 11. Snap 모드 알고리즘 상세

Snap 모드는 AI 생성 "가짜 픽셀 아트"를 진짜 픽셀 아트로 복원하는 모드입니다. AI 이미지 생성기가 만든 픽셀 아트는 겉보기에만 픽셀 아트이고, 실제 픽셀 그리드가 정렬되어 있지 않아 각 셀이 단일 색상이 아닙니다. Snap 모드는 이 그리드를 역추적하여 진짜 픽셀 아트로 재구성합니다.

### Color Variety 설정

사용자가 8~64 범위(8의 배수)로 K-means 클러스터 수를 조절할 수 있습니다. 값이 클수록 원본 색상을 더 세밀하게 보존하고, 값이 작을수록 단순화된 팔레트를 생성합니다. 기본값은 16.

### 11.1 파이프라인 개요

```
이미지 입력
  → K-means++ 색상 양자화 (Color Variety 설정값, 50k 샘플 캡)
  → Sobel 그래디언트 프로파일 계산 (열/행)
  → 피크 기반 주기 추정 (임계값 + 중앙값 간격)
  → Elastic Grid Walker (엣지 스냅 포함)
  → Axis 안정화 (비대칭 축 재조정)
  → Min-cuts 보장
  → 전체 셀 RGBA 최빈값 투표
  → 출력 이미지 생성
```

### 11.2 K-means++ 색상 양자화

**목적**: 노이즈 픽셀을 지배 색상으로 귀속시켜 그래디언트 계산의 정확도를 높이고, 리샘플링 시 안티앨리어싱 노이즈를 제거.

**구현**: `kmeansQuantize(data, pixelCount, k=colorVariety, maxIter=15)`

- **K-means++ 초기화**: 첫 센트로이드는 랜덤, 이후 각 픽셀의 가장 가까운 기존 센트로이드까지 거리²에 비례해 샘플링. 순수 랜덤 초기화 대비 수렴이 빠르고 나쁜 클러스터 배치를 방지.
- **결정적 PRNG**: `mulberry32(seed=42)` — 시드가 고정된 Xorshift 기반 32비트 PRNG. 매 실행마다 동일 결과 보장.
- **50k 샘플 캡**: 대용량 이미지에서 O(n) 비용 억제. 500×500 이상이면 균등 간격 서브샘플.
- **Lloyd's 반복**: 할당(Assignment) → 평균 갱신(Update) × maxIter. 각 픽셀을 가장 가까운 센트로이드로 재매핑.
- **Alpha 보존**: 투명 픽셀(alpha=0)은 클러스터링에서 제외. RGB 3채널만 클러스터링하고 alpha는 원본 그대로 유지.

**왜 사용자 설정인가**: k 값에 따라 결과물의 색상 다양성이 크게 달라짐. k=8은 극도로 단순화된 팔레트, k=64는 원본에 가까운 색상 보존. 이미지 특성에 따라 최적값이 다르므로 사용자가 조절할 수 있도록 노출.

### 11.3 Sobel 그래디언트 프로파일

**목적**: 이미지의 열(x축)과 행(y축) 방향으로 엣지 세기를 1D 프로파일로 압축.

**구현**: `computeColProfile(data, w, h)` / `computeRowProfile(data, w, h)`

- 1D 수평 Sobel 커널 `[-1, 0, 1]`을 각 행에 적용, 열별로 합산 → `colProfile[x]`
- 동일 커널을 수직 방향으로 적용, 행별로 합산 → `rowProfile[y]`
- 투명 픽셀(alpha=0)은 luminance 0으로 처리

결과: 픽셀 셀 경계마다 피크가 있는 1D 신호. 균일한 픽셀 아트라면 이 피크들이 규칙적인 간격으로 나타남.

### 11.4 피크 기반 주기 추정

**목적**: 그래디언트 프로파일에서 반복 주기(= 픽셀 셀 크기)를 추출.

**구현**: `estimateStep(profile, minDist=4)`

1. 프로파일 최댓값의 20% 이상인 로컬 피크 탐색
2. 인접 피크 간 최소 거리(`minDist=4px`) 필터링
3. 연속 피크 간 거리(diff) 계산 후 **중앙값**을 step size로 선택

**왜 중앙값인가**: 평균은 극단적인 간격(이미지 가장자리 등)에 의해 왜곡될 수 있지만, 중앙값은 이러한 이상치에 강건.

**폴백**: 피크 탐색 실패 시 → `limit / FALLBACK_SEGMENTS(64)` 고정 간격 사용.

### 11.5 Elastic Grid Walker

**목적**: 일정 간격이 아닌 실제 엣지 위치에 스냅하여 더 정확한 그리드 경계 탐색.

**구현**: `walk(profile, stepSize, limit)`

- 시작 위치: `pos = 0`
- 매 스텝마다 `[pos+1, pos + stepSize × 1.35]` 범위(±35%) 탐색
- 해당 범위에서 최대 그래디언트 위치를 찾아, 값이 프로파일 평균의 50% 이상이면 스냅
- 조건 미충족 시 `pos + stepSize` (균일 간격) 유지

**장점**: 픽셀 아트 생성 과정에서 미세한 스케일링 오차로 인해 셀 크기가 1~2px 편차를 가질 수 있음. Elastic Walker는 이런 편차를 자동으로 흡수.

### 11.6 Axis 안정화 (Stabilization)

**목적**: 이미지가 정사각형 픽셀 셀로 구성되어 있으므로 열 간격과 행 간격이 비슷해야 함. 한 축이 크게 다르면 오탐.

**구현**: `stabilizeAxes(colProfile, rowProfile, colCuts, rowCuts, colStep, rowStep, w, h)`

- 열 step과 행 step의 비율 계산
- 비율 > 1.8이면 더 넓은 축을 더 좁은 축의 step 크기로 재탐색 (re-walk)

**예시**: 열은 32px 간격, 행은 60px 간격이 나왔다면 → 행을 32px로 재탐색.

### 11.7 Min-cuts 보장

**목적**: 그리드 탐색 결과 셀 수가 너무 적으면(< MIN_CELLS = 4) 오탐 판정 후 더 세밀하게 재탐색.

**구현**: `ensureMinCuts(profile, cuts, limit)`

- cuts 수 < 4이면 `limit / 64` step으로 균일 Walker 재실행
- 이미지가 매우 단순하거나 그래디언트가 거의 없는 극단적 케이스 대응

### 11.8 전체 셀 RGBA 최빈값 투표

**목적**: 각 셀에서 가장 많이 등장하는 색상을 해당 셀의 대표 색상으로 선택.

**구현**: `resampleCells(data, width, colCuts, rowCuts)`

- 셀 전체 영역의 모든 픽셀을 대상으로 투표
- **RGBA 완전 투표**: 색상 키 = `((R<<24)|(G<<16)|(B<<8)|A) >>> 0` — alpha 채널도 투표에 참여
  - 투명도 50% 픽셀과 100% 픽셀은 다른 색으로 취급 → 반투명 셀 정확히 보존
- 각 셀에서 최빈 RGBA 값으로 해당 셀 전체를 채움
- 양자화된 데이터를 입력으로 사용하므로 안티앨리어싱 노이즈는 이미 제거된 상태

**왜 전체 셀인가**: k=64 양자화가 노이즈를 충분히 제거하므로 중심부만 샘플링할 필요 없음. 전체 셀을 사용하면 더 많은 표본으로 정확한 투표가 가능하고, 그리드 경계 검출이 약간 어긋나도 내성이 높음.

### 11.9 성능 특성

| 단계             | 시간 복잡도              | 비고                 |
| ---------------- | ------------------------ | -------------------- |
| K-means++ 초기화 | O(k × min(n, 50k))       | k=8~64 (사용자 설정) |
| Lloyd's 반복     | O(k × min(n, 50k) × 15)  | 조기 수렴 시 단축    |
| Sobel 프로파일   | O(w × h)                 | 단일 패스            |
| 피크 기반 추정   | O(n)                     | 프로파일 1회 순회    |
| Elastic Walker   | O(n/step × searchWindow) | 선형                 |
| RGBA 투표        | O(w × h)                 | 단일 패스            |

일반적인 512×512 이미지 기준 전체 파이프라인: **300~600ms** (Web Worker, 메인 스레드 비차단).
