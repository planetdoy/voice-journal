# Supabase + Prisma 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com/) 접속 후 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: voice-journal
   - **Database Password**: 강력한 비밀번호 설정 (저장해두세요!)
   - **Region**: Asia Northeast 2 (ap-northeast-2) - 한국 서버
4. "Create new project" 클릭 (1-2분 소요)

## 2. 데이터베이스 연결 문자열 복사

1. Supabase 대시보드에서 생성된 프로젝트 선택
2. 좌측 메뉴에서 **Settings** 클릭
3. **Database** 탭 클릭
4. **Connection string** 섹션에서:
   - **URI** 복사 (postgresql://postgres.xxx...)
   - `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체

## 3. 환경 변수 설정

`.env.local` 파일의 DATABASE_URL 업데이트:

```env
# Supabase PostgreSQL 연결
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

## 4. Prisma 설정 및 배포

```bash
# 환경 변수 새로고침을 위해 개발 서버 재시작
# Ctrl+C로 서버 중지 후

# Prisma 클라이언트 생성
npm run db:generate

# Supabase에 스키마 배포
npm run db:push

# 개발 서버 재시작
npm run dev
```

## 5. 연결 확인

성공적으로 설정되면:
- ✅ `npm run db:push` 성공
- ✅ Google 로그인 시 사용자 정보가 Supabase에 저장
- ✅ Supabase Dashboard > Table Editor에서 테이블 확인 가능

## 6. Supabase 장점

- 🆓 **무료 티어**: 월 500MB 스토리지, 2GB 데이터 전송
- 🚀 **실시간 기능**: 실시간 구독 지원
- 🔒 **보안**: Row Level Security (RLS) 기본 제공
- 📊 **대시보드**: 웹 기반 데이터베이스 관리
- 🌏 **글로벌**: 전 세계 리전 서버 지원

## 7. 문제 해결

**DATABASE_URL 오류:**
- 서버 재시작 필요: `Ctrl+C` → `npm run dev`
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요

**연결 실패:**
- Supabase 프로젝트가 활성화되었는지 확인
- 네트워크 연결 상태 확인
- DATABASE_URL에 실제 비밀번호가 입력되었는지 확인

**스키마 동기화 실패:**
- 기존 테이블과 충돌 시: `npm run db:push --force-reset`
- Supabase Dashboard에서 직접 테이블 삭제 후 재시도