# Speak Log - 내 목소리로 만드는 매일의 성장

음성 기반 개인 성장 플랫폼으로, 매일 밤 내일의 계획을 음성으로 녹음하고, 아침에 자신의 목소리로 들으며 동기부여를 받는 웹 애플리케이션입니다.

## 주요 기능

- 🎤 **음성 파일 업로드**: MP3, WAV, M4A, OGG 형식 지원 (최대 25MB)
- 🤖 **AI 텍스트 변환**: OpenAI Whisper를 통한 정확한 음성-텍스트 변환
- 📝 **계획과 회고**: 매일 밤 계획, 아침 회고 기록 관리
- 🎯 **목표 관리**: 일일 목표 설정 및 달성률 추적
- 📊 **성장 분석**: 진행률 시각화 및 통계 대시보드

## 필수 요구사항

- Node.js 18.0.0 이상
- pnpm (또는 npm/yarn)
- OpenAI API 키 ([발급 방법](#openai-api-키-발급))

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone [repository-url]
cd speak-log
```

### 2. 패키지 설치
```bash
# pnpm 사용 (권장)
pnpm install

# npm 사용
npm install

# yarn 사용
yarn install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 OpenAI API 키를 설정합니다:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. 개발 서버 실행
```bash
# pnpm 사용
pnpm dev

# npm 사용
npm run dev

# yarn 사용
yarn dev
```

### 5. 브라우저에서 접속
```
http://localhost:3000
```

## OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 계정 생성 또는 로그인
3. [API Keys 페이지](https://platform.openai.com/api-keys)로 이동
4. "Create new secret key" 클릭
5. 생성된 키를 복사하여 `.env.local` 파일에 저장

⚠️ **주의사항**:
- API 키는 절대 공개 저장소에 커밋하지 마세요
- OpenAI API는 사용량에 따라 비용이 발생합니다
- 무료 크레딧 제공 여부는 OpenAI 정책에 따라 다릅니다

## 사용 방법

1. **회원가입/로그인**: 홈페이지에서 "무료로 성장 시작" 버튼 클릭
2. **대시보드 접속**: 로그인 후 대시보드로 이동
3. **음성 업로드**: 
   - "내일 계획" 또는 "오늘 회고" 선택
   - 음성 파일 드래그 앤 드롭 또는 클릭하여 업로드
   - "AI로 텍스트 변환하기" 버튼 클릭
4. **목표 관리**: 우측 사이드바에서 일일 목표 추가 및 관리
5. **기록 확인**: 변환된 텍스트와 음성 기록 확인

## 기술 스택

- **Frontend**: Next.js 15.2.4, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **AI**: OpenAI Whisper API
- **상태 관리**: React Hooks (useState, useEffect)
- **기타**: Lucide React Icons, Recharts

## 프로젝트 구조

```
speak-log/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈페이지 (랜딩 페이지)
│   ├── layout.tsx         # 루트 레이아웃
│   └── api/
│       └── transcribe/    # 음성 변환 API
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── dashboard.tsx     # 대시보드 메인
│   └── ...              # 기타 컴포넌트
├── lib/                  # 유틸리티 함수
├── public/              # 정적 파일
└── styles/              # 글로벌 스타일
```

## 주요 명령어

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트 검사
pnpm lint
```

## 문제 해결

### OpenAI API 오류
- **401 Unauthorized**: API 키가 올바른지 확인하세요
- **429 Rate Limit**: API 사용 한도 초과, 잠시 후 다시 시도
- **402 Insufficient Quota**: OpenAI 크레딧 부족, 결제 확인 필요

### 음성 파일 업로드 오류
- 지원 형식: MP3, WAV, M4A, OGG
- 최대 크기: 25MB
- 오디오 품질이 너무 낮으면 변환 정확도가 떨어질 수 있습니다

## 라이선스

MIT License

## 기여하기

Pull Request와 Issue는 언제나 환영합니다!