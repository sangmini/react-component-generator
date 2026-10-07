# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정. npm/yarn/pnpm 사용 금지 (`bun.lock` 기준).
- 개발 서버 (API + Vite 동시): `bun run dev`
- API 서버만: `bun run server` (포트 3002, `bun --watch`)
- 전체 테스트: `bun run test` (vitest run, jsdom)
- 단일 테스트: `bun run test server/fallback.test.ts`
- 린트: `bun run lint`
- 빌드/타입체크: `bun run build` (`tsc -b && vite build`)
- 변경 후 완료 선언 전에 `bun run lint`, `bun run test`, `bun run build`를 실행한다.

## Golden Rules

### Immutable

- API 키(`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`)는 서버에서만 읽는다 (`server/index.ts:59-62`). 프론트엔드 코드에서 `process.env`/`import.meta.env`로 키를 읽거나 키 값을 클라이언트에 내려주지 않는다.
- `.env`는 커밋하지 않는다 (`.gitignore`). 키 이름만 `.env.example`에 둔다.
- 서버 응답에 키 값을 포함하지 않는다. `/api/config`는 `!!ENV_KEYS.x` 불리언만 반환한다 (`server/index.ts:149-153`).

### Do's & Don'ts

- Do: 생성 코드 정규화는 `server/generator.ts`의 `stripCodeFences` -> `ensureRenderCall` 순서로 거친다 (`server/index.ts:188`). 응답 후처리를 `server/index.ts`에 직접 인라인하지 않는다.
- Do: 새 서버 로직은 부수효과 없는 모듈로 분리하고 같은 위치에 `*.test.ts`를 둔다 (`server/generator.ts:1-2`, `server/fallback.ts`).
- Do: 프론트에서 서버를 호출할 때는 상대 경로 `/api/...`만 쓴다. Vite 프록시가 3002로 전달한다 (`vite.config.ts:9-14`). 포트를 바꾸면 `server/index.ts:139`와 `vite.config.ts:10`을 함께 바꾼다.
- Don't: 프로바이더를 추가할 때 한 곳만 수정하지 않는다. `Provider` 타입이 서버(`server/index.ts:57`)와 프론트(`src/types/index.ts:1`)에 각각 정의되어 있으므로 둘을 동시에 수정하고 `ENV_KEYS`, `/api/config`, `src/App.tsx`의 `envKeys` 초기값도 맞춘다.

### 팀 고유 규칙 (코드 근거)

- Hard Constraint: 미리보기는 `react-live`의 `noInline` 모드라서 코드에 `render(<Comp />)` 호출이 반드시 있어야 렌더된다 (`src/components/LivePreview.tsx:11`, `server/generator.ts:234-239`). `SYSTEM_PROMPT`(`server/index.ts:7-49`)의 "import 금지, render() 호출, TypeScript 문법 금지" 규칙과 한 쌍이므로 한쪽만 바꾸지 않는다.
- Double Defense: render 호출 누락은 프롬프트(`server/index.ts:12`)와 `ensureRenderCall`(`server/generator.ts:238`) 두 곳에서 막는다. 둘 중 하나를 제거하지 않는다.
- Asymmetry: Gemini만 모델 폴백(`GOOGLE_MODELS`, `withModelFallback`)과 `MAX_TOKENS` 잘림 검사를 가진다 (`server/index.ts:5`, `:123`, `:135`). Anthropic 경로는 단일 모델이며 `max_tokens: 4096`이다 (`server/index.ts:78`). 폴백 정책을 바꿀 때 두 경로의 차이를 의도로 간주하고 임의로 통일하지 않는다.
- Asymmetry: 에러 메시지의 상태코드 문자열(`'503'`, `'429'`)로 HTTP 상태를 매핑한다 (`server/index.ts:194-206`). 프로바이더 에러 포맷(`Claude API error: ${status}`, `Gemini API error: ${status}`)을 바꾸면 이 매핑이 깨진다.
- Test Boundary: 테스트는 순수 로직(`server/generator.ts`, `server/fallback.ts`)과 `src/components/PromptInput.tsx`에만 있다. `server/index.ts`(Bun.serve, 외부 API 호출), `src/hooks/useComponentGenerator.ts`, `LivePreview.tsx`는 테스트가 없으므로 로직을 추가할 때 순수 함수로 분리해 테스트 가능한 쪽으로 옮긴다.
- Security Boundary: 사용자가 UI에 입력한 `apiKey`는 요청 본문으로만 서버에 전달되며 (`src/hooks/useComponentGenerator.ts:26`) 서버 키보다 우선한다 (`server/index.ts:65`). 저장소(localStorage 등)에 영속화하거나 로그에 출력하지 않는다. Gemini URL은 키를 쿼리스트링에 포함하므로 (`server/index.ts:99`) 해당 URL을 로그/에러 메시지에 노출하지 않는다.

## Project Context

- 프롬프트로 React 컴포넌트를 AI가 생성하고 react-live로 실시간 미리보기하는 웹 앱.
- Stack: React 19, TypeScript, Vite, Bun(API 서버), react-live, Vitest + Testing Library, ESLint.

## Standards & References

- 프로젝트 소개, 실행 방법, 기능은 `README.md` 참조.
- TDD 규칙: @.claude/rules/tdd.md
- 사용자 대상 문구, 주석, 에러 메시지, 테스트 설명은 한국어로 작성한다 (기존 코드 기준).
- 커밋 메시지: `feat|fix|refactor|chore|docs|test: 한국어 요약` (`git log` 기준).
- 임의 변경 대신 기존 파일 스타일(작은따옴표, 세미콜론, 2칸 들여쓰기)을 따른다.
- Maintenance Policy: 이 문서의 규칙과 코드가 어긋나면 작업 중 발견 즉시 AGENTS.md 업데이트를 제안한다.
