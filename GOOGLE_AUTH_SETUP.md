# Google OAuth 2.0 설정 가이드

## 1. Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. Google 계정으로 로그인

## 2. 프로젝트 생성 (처음인 경우)
1. 상단 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: "Voice Journal")
4. "만들기" 클릭

## 3. OAuth 동의 화면 구성
1. 좌측 메뉴에서 "API 및 서비스" → "OAuth 동의 화면" 클릭
2. User Type 선택:
   - 개발/테스트용: "외부" 선택
   - 조직 내부용: "내부" 선택
3. "만들기" 클릭
4. 앱 정보 입력:
   - 앱 이름: Voice Journal
   - 사용자 지원 이메일: 본인 이메일
   - 앱 도메인 (선택사항): 비워두기 가능
   - 개발자 연락처 정보: 본인 이메일
5. "저장 후 계속" 클릭
6. 범위 설정에서 "저장 후 계속" 클릭 (기본값 사용)
7. 테스트 사용자에서 "저장 후 계속" 클릭
8. 요약 확인 후 "대시보드로 돌아가기" 클릭

## 4. OAuth 2.0 클라이언트 ID 생성
1. 좌측 메뉴에서 "API 및 서비스" → "사용자 인증 정보" 클릭
2. 상단 "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 클릭
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 이름 입력: "Voice Journal Web Client"
5. 승인된 JavaScript 원본 추가:
   ```
   http://localhost:3000
   ```
6. 승인된 리디렉션 URI 추가:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. "만들기" 클릭

## 5. 클라이언트 ID와 시크릿 복사
1. 생성 완료 팝업에서:
   - 클라이언트 ID 복사
   - 클라이언트 보안 비밀 복사
2. `.env.local` 파일에 붙여넣기:
   ```env
   GOOGLE_CLIENT_ID=복사한_클라이언트_ID
   GOOGLE_CLIENT_SECRET=복사한_클라이언트_시크릿
   ```

## 6. NextAuth Secret 생성
터미널에서 다음 명령어로 안전한 시크릿 생성:
```bash
openssl rand -base64 32
```
또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

생성된 값을 `.env.local`에 추가:
```env
NEXTAUTH_SECRET=생성된_시크릿_값
```

## 프로덕션 배포 시 추가 설정
1. OAuth 동의 화면에서 "앱 게시" 필요
2. 승인된 도메인에 실제 도메인 추가:
   - JavaScript 원본: `https://yourdomain.com`
   - 리디렉션 URI: `https://yourdomain.com/api/auth/callback/google`
3. `.env.local`의 `NEXTAUTH_URL`을 실제 도메인으로 변경

## 문제 해결
- **Error 400: redirect_uri_mismatch**: 리디렉션 URI가 정확히 일치하는지 확인
- **Error 401**: 클라이언트 ID/시크릿이 올바른지 확인
- **로그인 후 리다이렉트 실패**: NEXTAUTH_URL이 올바른지 확인