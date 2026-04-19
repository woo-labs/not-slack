# GitHub webhook integration

이 프로젝트는 `github-prs` 채널에서 GitHub Pull Request 이벤트를 보여줄 수 있습니다.

## 1. Supabase migration 적용

```bash
supabase db push
```

위 SQL은 `github_pr_events` 테이블을 만들고, `github-prs` 채널이 없으면 자동으로 생성합니다.

## 2. Edge Function 배포

```bash
supabase functions deploy github-webhook
supabase secrets set GITHUB_WEBHOOK_SECRET=your-secret
```

Supabase 프로젝트 기본 환경변수인 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 Edge Function에서 같이 사용됩니다.

## 3. GitHub webhook 설정

GitHub 저장소 Settings -> Webhooks 에서 아래처럼 추가합니다.

- Payload URL: `https://<project-ref>.functions.supabase.co/github-webhook`
- Content type: `application/json`
- Secret: `GITHUB_WEBHOOK_SECRET`와 동일한 값
- Events: `Pull requests`

## 4. 앱에서 확인

웹훅이 들어오면 앱의 `github-prs` 채널에서 PR 카드가 실시간으로 보입니다.

## 권장 브랜치 이름

Git 브랜치에는 `:`가 들어갈 수 없어서 아래처럼 쓰는 것이 안전합니다.

```bash
feature/github-webhook
```
