# PostgreSQL + Prisma 설정 가이드

## 1. PostgreSQL 설치 옵션

### 옵션 A: 로컬 PostgreSQL 설치 (개발용)

**Windows:**
1. [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치
2. 설치 중 사용자명/비밀번호 설정 (예: `postgres` / `password`)
3. 포트: 기본값 `5432` 사용

**Windows:**
1. PostgreSQL 서비스 시작: `services.msc`에서 PostgreSQL 서비스 확인
2. 명령 프롬프트에서:
```cmd
# PostgreSQL 접속 (비밀번호 입력 필요)
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE voice_journal;

# 종료
\q
```

### 옵션 B: Docker로 PostgreSQL 실행 (권장)

```bash
# PostgreSQL 컨테이너 실행
docker run --name voice-journal-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=voice_journal \
  -p 5432:5432 \
  -d postgres:15

# 컨테이너 중지/시작
docker stop voice-journal-db
docker start voice-journal-db
```

### 옵션 C: 클라우드 PostgreSQL (프로덕션용)

**Vercel Postgres:**
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. Storage 탭에서 PostgreSQL 생성
3. Connection String 복사

**Railway:**
1. [Railway](https://railway.app/) 접속
2. PostgreSQL 서비스 추가
3. Connect 탭에서 DATABASE_URL 복사

**Supabase:**
1. [Supabase](https://supabase.com/) 프로젝트 생성
2. Settings > Database에서 Connection String 복사
3. #J.w3X@gkXTMh#B

## 2. 환경 변수 설정

`.env.local` 파일의 DATABASE_URL을 실제 값으로 변경:

```env
# 로컬 PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/voice_journal?schema=public"

# Docker PostgreSQL  
DATABASE_URL="postgresql://postgres:password@localhost:5432/voice_journal?schema=public"

# 클라우드 PostgreSQL (예시)
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

## 3. Prisma 명령어

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 동기화 (개발용)
npm run db:push

# 마이그레이션 생성 및 적용 (프로덕션용)
npm run db:migrate

# 데이터베이스 GUI 열기
npm run db:studio
```

## 4. 설정 순서

1. PostgreSQL 실행 (위 옵션 중 선택)
2. `.env.local`의 DATABASE_URL 수정
3. Prisma 클라이언트 생성: `npm run db:generate`
4. 스키마 동기화: `npm run db:push`
5. 서버 재시작: `npm run dev`

## 5. 연결 확인

성공적으로 설정되면:
- ✅ Google 로그인 시 사용자 정보가 DB에 저장됨
- ✅ 음성 기록 기능 사용 가능
- ✅ 목표 관리 기능 사용 가능

## 문제 해결

**연결 오류:**
- PostgreSQL 서버가 실행 중인지 확인
- 포트 5432가 사용 가능한지 확인
- 방화벽 설정 확인

**권한 오류:**
- 사용자명/비밀번호 확인
- 데이터베이스 생성 권한 확인

**마이그레이션 오류:**
- 기존 데이터 백업 후 `prisma db push --force-reset` 실행