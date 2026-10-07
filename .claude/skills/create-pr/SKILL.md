---
name: create-pr
description: 현재 브랜치의 커밋과 diff를 분석해 템플릿(한글/영문)에 맞춘 PR 제목과 본문을 작성하고 gh CLI로 Pull Request를 생성한다. "PR 만들어줘", "풀리퀘스트 생성", "create pr", "/create-pr" 같은 요청에 활성화한다. 커밋 자체에는 쓰지 않는다.
context: fork
allowed-tools: Read Glob Grep Bash(git *) Bash(gh *) Bash(bun run *)
---

# Create PR

현재 브랜치의 변경 내용을 분석해 PR 본문을 작성하고 `gh pr create`로 PR을 만든다.

## 템플릿 선택

- 인자로 `en`/`영문`이 오면 `references/pr-template.en.md`, `ko`/`한글`이 오면 `references/pr-template.ko.md`를 쓴다.
- 인자가 없으면 사용자가 이 스킬을 요청한 언어로 정한다.
  - 한국어(한글)이면 한글 템플릿(`references/pr-template.ko.md`)을 쓴다.
  - 그 외 모든 언어(영어, 일본어 등)이면 영문 템플릿(`references/pr-template.en.md`)을 쓴다.
- PR 제목과 본문 문장도 선택한 템플릿의 언어로 작성한다.
- 본문은 선택한 템플릿의 섹션 구조와 순서를 그대로 유지한다. 해당 없는 섹션은 지우지 말고 "해당 없음"/"N/A"로 적는다.

## 절차

### 1. 상태 확인

- `git branch --show-current` — 현재 브랜치. `main`/`master`이면 중단하고, 작업 브랜치를 먼저 만들라고 알린다.
- `git status --short` — 커밋되지 않은 변경이 있으면 알리고, PR에는 커밋된 내용만 포함됨을 명시한다.
- `gh auth status` — 인증 확인. 실패하면 `gh auth login`이 필요함을 알리고 끝낸다.
- `gh pr list --head <브랜치> --state open` — 이미 열린 PR이 있으면 URL만 알리고 새로 만들지 않는다.

### 2. 변경 분석

- 기준 브랜치: `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` (보통 `main`).
- `git log --oneline <기준>..HEAD` — PR에 포함될 커밋 목록.
- `git diff <기준>...HEAD --stat`, `git diff <기준>...HEAD` — 실제 변경 내용. 파일 목록만 보지 말고 내용을 읽어 의도를 파악한다.
- 커밋이 없으면 "PR로 만들 변경이 없습니다."라고 알리고 끝낸다.

### 3. 제목·본문 작성

- 제목: `feat|fix|refactor|chore|docs|test: 한국어 요약` 형식(70자 이내, 마침표 없음). 영문 템플릿이면 같은 type 접두사에 영어 요약을 쓴다.
- 본문: 선택한 언어의 템플릿 파일(`references/pr-template.ko.md` 또는 `references/pr-template.en.md`)을 Read로 읽어 채운다.
- "테스트" 섹션에는 실제로 실행한 결과만 적는다. 이 프로젝트는 `bun run lint`, `bun run test`, `bun run build`를 실행해 결과를 반영한다. 실행하지 않은 항목은 체크하지 않는다.
- 이슈 번호는 커밋 메시지·브랜치명에서 확인될 때만 `Closes #N`으로 적는다. 추측하지 않는다.
- `.env`, 키, 토큰 값은 본문에 넣지 않는다.
- 본문 끝에 다음 줄을 붙인다.

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 4. 푸시와 PR 생성

1. 원격에 브랜치가 없으면 `git push -u origin <브랜치>`.
2. `gh pr create --base <기준> --title "<제목>" --body "$(cat <<'BODY' ... BODY)"`처럼 heredoc으로 여러 줄 본문을 전달해 생성한다. (Bash는 `git`/`gh`/`bun run`만 허용되므로 임시 파일을 만들지 않는다.)
3. 생성된 PR URL, 제목, 사용한 템플릿 언어, 실행한 검증 결과를 보고한다.

## 규칙

- `main`/`master`에서 직접 PR을 만들지 않는다.
- `--force` 푸시, 기존 PR 덮어쓰기는 하지 않는다.
- 기본적으로 draft가 아닌 일반 PR로 만든다. 인자에 `draft`가 있으면 `--draft`를 붙인다.
