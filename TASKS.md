# Voice Journal 기능 개발 TASKS

## 🎯 전체 로드맵
1. ✅ 기본 음성 일기 기능 (완료)
2. 🚧 알림/리마인더 시스템 (진행중)
3. 📋 AI 코칭 기능 (예정)
4. 📋 음성 기능 확장 (예정)

---

## 🔔 Phase 1: 알림/리마인더 시스템

### 1-1. 데이터베이스 설정 ⏳
- [ ] NotificationSettings 모델 추가
  - userId (User 관계)
  - planReminderEnabled (계획 알림 활성화)
  - planReminderTime (계획 알림 시간)
  - reflectionReminderEnabled (회고 알림 활성화)
  - reflectionReminderTime (회고 알림 시간)
  - streakAlertsEnabled (스트릭 알림)
  - goalDeadlineAlertsEnabled (목표 마감 알림)
  - emailEnabled (이메일 알림)
  - pushEnabled (푸시 알림)
  - timezone (사용자 시간대)
- [ ] NotificationLog 모델 추가 (알림 발송 기록)
- [ ] Prisma 마이그레이션 실행

### 1-2. 알림 설정 UI 개발 ⏳
- [ ] 설정 모달에 알림 탭 추가
- [ ] 알림 시간 선택 컴포넌트
- [ ] 알림 유형별 토글 스위치
- [ ] 시간대 자동 감지 및 설정
- [ ] API 엔드포인트 생성 (/api/notifications/settings)

### 1-3. 브라우저 Push 알림 ⏳
- [ ] Service Worker 설정
- [ ] Push 알림 권한 요청 UI
- [ ] Push 구독 관리
- [ ] /api/notifications/subscribe 엔드포인트

### 1-4. 이메일 알림 크론 작업 ⏳
- [ ] /api/cron/reminders 엔드포인트 생성
- [ ] 일일 알림 체크 로직
  - 사용자별 시간대 확인
  - 알림 시간 도달 확인
  - 이메일 템플릿 생성
  - 발송 및 로그 기록
- [ ] Vercel cron 설정 (매 시간 실행)

### 1-5. 스트릭 알림 시스템 ⏳
- [ ] 스트릭 끊김 위험 감지 로직
- [ ] 연속 기록 축하 메시지
- [ ] /api/cron/streak-check 엔드포인트

### 1-6. 테스트 및 배포 ⏳
- [ ] 알림 기능 통합 테스트
- [ ] 타임존 처리 테스트
- [ ] 운영 환경 배포

---

## 🤖 Phase 2: AI 코칭 기능 (예정)

### 2-1. 데이터 모델 설계
- [ ] CoachingReport 모델 설계
- [ ] UserPreferences 확장 (코칭 선호도)

### 2-2. 분석 엔진 개발
- [ ] 회고 내용 분석 로직
- [ ] 패턴 인식 알고리즘
- [ ] GPT-4 프롬프트 설계

### 2-3. 코칭 리포트 생성
- [ ] 주간 리포트 템플릿
- [ ] 맞춤형 질문 생성기
- [ ] 동기부여 메시지 시스템

### 2-4. UI/UX 구현
- [ ] 코칭 대시보드
- [ ] 인사이트 카드 컴포넌트
- [ ] 주간 리포트 뷰어

---

## 🎤 Phase 3: 음성 기능 확장 (예정)

### 3-1. 실시간 음성 처리
- [ ] Web Audio API 통합
- [ ] 스트리밍 녹음 구현
- [ ] 실시간 전사 표시

### 3-2. 대화형 인터페이스
- [ ] 질문 시퀀스 설계
- [ ] 음성 세션 관리
- [ ] 대화 UI 컴포넌트

### 3-3. 음성 분석
- [ ] 감정 분석 통합
- [ ] 음성 특징 추출
- [ ] 분석 결과 시각화

---

## 📝 진행 상태 기록

### 2024-12-24
- TASKS.md 파일 생성
- Phase 1 알림/리마인더 시스템 개발 시작

---

## 🛠 기술 스택
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma
- **Database**: PostgreSQL (Supabase)
- **알림**: Web Push API, Nodemailer
- **AI**: OpenAI GPT-4, Whisper API
- **배포**: Vercel

## 📌 주의사항
- 각 기능 완료 시 개별 커밋
- 사용자 시간대 처리 필수
- API 사용량 모니터링
- 개인정보 보호 고려