# 운영 배포 체크리스트

## 📋 필수 환경 변수 설정

운영 환경에서 다음 환경 변수들을 반드시 설정해야 합니다:

### 1. NextAuth 설정
- `NEXTAUTH_URL`: 운영 도메인 URL (예: https://yourdomain.com)
- `NEXTAUTH_SECRET`: 보안 시크릿 키 (openssl rand -base64 32로 생성)

### 2. Google OAuth 설정
- `GOOGLE_CLIENT_ID`: Google Cloud Console에서 발급
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console에서 발급
- **중요**: Google Cloud Console에서 승인된 리디렉션 URI에 다음 추가 필요:
  - `https://yourdomain.com/api/auth/callback/google`

### 3. Database 설정 (Supabase)
- `DATABASE_URL`: PostgreSQL 연결 문자열 (pooler 사용)
- `DIRECT_URL`: 직접 연결 문자열 (마이그레이션용)

### 4. AWS S3 설정
- `AWS_ACCESS_KEY_ID`: AWS IAM 사용자 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS IAM 사용자 시크릿 키
- `AWS_REGION`: S3 버킷 리전 (예: ap-northeast-2)
- `S3_BUCKET_NAME`: S3 버킷 이름

### 5. OpenAI API
- `OPENAI_API_KEY`: OpenAI API 키

## 🚀 배포 단계

### 1. Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결 및 배포
vercel

# 운영 배포
vercel --prod
```

### 2. 데이터베이스 마이그레이션

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 푸시 (운영)
npx prisma db push
```

### 3. 빌드 테스트

```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 체크
npx tsc --noEmit

# 린트 체크
npm run lint
```

## 🔒 보안 체크리스트

- [ ] 모든 환경 변수가 운영 값으로 설정되었는지 확인
- [ ] NEXTAUTH_SECRET이 강력한 랜덤 값인지 확인
- [ ] HTTPS 활성화 확인
- [ ] CORS 설정 확인
- [ ] S3 버킷 권한이 최소 권한으로 설정되었는지 확인

## 📊 모니터링

### Vercel Analytics
- Vercel 대시보드에서 Analytics 활성화
- Web Vitals 모니터링

### 에러 트래킹
- Sentry 또는 LogRocket 설정 고려

## 🔄 CI/CD 설정

### GitHub Actions (옵션)
`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npx prisma generate
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📝 배포 후 확인사항

- [ ] 로그인 기능 정상 작동
- [ ] 음성 녹음 및 재생 기능 확인
- [ ] S3 파일 업로드 확인
- [ ] 데이터베이스 연결 확인
- [ ] 모바일 반응형 확인

## 🆘 문제 해결

### 1. Google OAuth 리디렉션 오류
- Google Cloud Console에서 승인된 리디렉션 URI 확인
- NEXTAUTH_URL이 정확한지 확인

### 2. 데이터베이스 연결 오류
- DATABASE_URL의 연결 문자열 확인
- Supabase 대시보드에서 연결 풀링 설정 확인

### 3. S3 업로드 오류
- IAM 사용자 권한 확인 (s3:PutObject, s3:GetObject 필요)
- 버킷 CORS 설정 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
- Vercel 로그: https://vercel.com/dashboard
- Supabase 로그: https://app.supabase.com
- AWS CloudWatch 로그