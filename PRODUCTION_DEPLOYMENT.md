# 🚀 Vercel 배포 가이드

## 1. 로컬에서 Vercel CLI 설치 및 배포

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. Vercel에 로그인
vercel login

# 3. 프로젝트 연결 (처음 한 번만)
vercel

# 4. 운영 배포
vercel --prod
```

## 2. Vercel 대시보드에서 환경 변수 설정

배포 후 https://vercel.com/dashboard 에서 다음 환경 변수들을 설정하세요:

### 🔐 NextAuth 설정
- `NEXTAUTH_URL`: `https://your-domain.vercel.app`
- `NEXTAUTH_SECRET`: `openssl rand -base64 32` 명령으로 생성된 강력한 시크릿

### 🔑 Google OAuth 설정
- `GOOGLE_CLIENT_ID`: Google Cloud Console에서 발급받은 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console에서 발급받은 클라이언트 시크릿

**중요**: Google Cloud Console에서 승인된 리디렉션 URI 추가:
`https://your-domain.vercel.app/api/auth/callback/google`

### 🗄️ 데이터베이스 설정 (Supabase)
- `DATABASE_URL`: Supabase pooler 연결 문자열
- `DIRECT_URL`: Supabase 직접 연결 문자열

### ☁️ AWS S3 설정
- `AWS_ACCESS_KEY_ID`: AWS IAM 사용자 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS IAM 사용자 시크릿 키  
- `AWS_REGION`: S3 버킷 리전 (예: ap-northeast-2)
- `S3_BUCKET_NAME`: S3 버킷 이름

### 🤖 OpenAI API
- `OPENAI_API_KEY`: OpenAI API 키

## 3. 데이터베이스 마이그레이션

배포 후 데이터베이스 스키마를 운영 환경에 적용하세요:

```bash
# 로컬에서 운영 DB에 스키마 푸시
npx prisma db push

# 또는 Prisma 스튜디오로 확인
npx prisma studio
```

## 4. 도메인 설정 (선택사항)

Vercel 대시보드에서 커스텀 도메인을 설정할 수 있습니다:

1. 프로젝트 → Settings → Domains
2. 도메인 추가 후 DNS 설정
3. 환경 변수 `NEXTAUTH_URL`을 새 도메인으로 업데이트

## 5. 배포 후 확인사항

### ✅ 기능 테스트
- [ ] Google 로그인 정상 작동
- [ ] 음성 녹음 및 업로드 기능
- [ ] S3 파일 재생 기능  
- [ ] 목표 설정 및 관리 기능
- [ ] 대시보드 데이터 로딩

### 🔍 성능 모니터링
- Vercel Analytics 확인
- Web Vitals 점수 확인
- 응답 시간 모니터링

## 6. 지속적 배포 설정

GitHub과 연결하면 main 브랜치 푸시 시 자동 배포됩니다:

1. Vercel 대시보드에서 GitHub 연결
2. main 브랜치 푸시 시 자동 배포
3. 미리보기 배포: PR 생성 시 자동 생성

## 🆘 트러블슈팅

### Google OAuth 오류
```
Error: redirect_uri_mismatch
```
→ Google Cloud Console에서 리디렉션 URI 확인

### 데이터베이스 연결 오류
```
Error: Can't connect to database
```
→ Supabase 대시보드에서 연결 문자열 확인

### S3 업로드 오류
```
Error: Access Denied
```
→ IAM 사용자 권한 확인 (s3:PutObject, s3:GetObject 필요)

## 📊 모니터링

### Vercel Analytics
- 자동으로 활성화됨
- 사용자 방문, 페이지 뷰 추적

### 로그 확인
- Vercel 대시보드 → Functions → Logs
- 실시간 에러 및 로그 확인

### 성능 최적화
- 이미지 최적화: Next.js Image 컴포넌트 사용
- 코드 분할: 동적 임포트 활용
- 캐싱: SWR 또는 TanStack Query 고려