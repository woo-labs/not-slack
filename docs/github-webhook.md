# GitHub webhook integration

이 브랜치는 `messages.integration_card` + `thread_id` 패턴으로 GitHub PR 이벤트를 Slack 스타일 카드로 보여줍니다.

## 적용 순서

```bash
supabase db push
supabase secrets set GITHUB_WEBHOOK_SECRET=your-secret
supabase functions deploy github-webhook --no-verify-jwt
```

## GitHub webhook 설정

- Payload URL: `https://<project-ref>.functions.supabase.co/github-webhook`
- Content type: `application/json`
- Secret: `GITHUB_WEBHOOK_SECRET`와 동일한 값
- Events: `Pull requests`, `Issue comments`, `Pull request reviews`

## 구독 매핑

마이그레이션이 `github-prs` 채널을 만들고, `woo-labs/not-slack` 레포를 기본 구독으로 넣습니다.
다른 GitHub repo를 보려면 `channel_subscriptions.external_id`를 `owner/repo` 값으로 추가하면 됩니다.

## 동작 방식

- `pull_request.opened`는 첫 카드로 채널에 쌓입니다.
- `issue_comment`, `pull_request_review`, `pull_request.synchronize` 같은 후속 이벤트는 같은 `metadata.issue.id`를 기준으로 첫 카드의 스레드에 붙습니다.
- `reply_count`는 카드 메타데이터에 반영되어 메인 채널이 깔끔하게 유지됩니다.
