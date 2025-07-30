# AWS S3 설정 가이드

Voice Journal의 음성 파일 저장을 위한 AWS S3 설정 방법입니다.

## 1. AWS 계정 설정

### AWS 계정 생성
1. [AWS 콘솔](https://aws.amazon.com/ko/) 접속
2. "AWS 계정 생성" 클릭
3. 이메일, 비밀번호 설정
4. 결제 정보 입력 (프리 티어 사용 가능)

## 2. S3 버킷 생성

### 버킷 생성 단계
1. AWS 콘솔에서 **S3** 서비스 검색 후 선택
2. **"버킷 만들기"** 클릭
3. 버킷 설정:
   - **버킷 이름**: `voice-journal-audio-files` (전 세계적으로 고유해야 함)
   - **AWS 리전**: `아시아 태평양(서울) ap-northeast-2`
   - **퍼블릭 액세스 차단**: 모든 퍼블릭 액세스 차단 **체크** (보안상 중요)
4. **"버킷 만들기"** 클릭

### 버킷 정책 설정 (선택사항)
필요시 버킷 정책에서 특정 IP나 조건으로 접근 제한 가능

## 3. IAM 사용자 생성

### IAM 사용자 생성
1. AWS 콘솔에서 **IAM** 서비스 선택
2. **"사용자"** → **"사용자 추가"** 클릭
3. 사용자 설정:
   - **사용자 이름**: `voice-journal-s3-user`
   - **액세스 유형**: "프로그래밍 방식 액세스" 체크

### 권한 설정
1. **"기존 정책 직접 연결"** 선택
2. 다음 정책들 체크:
   - `AmazonS3FullAccess` (개발용 - 모든 S3 접근)
   
   **또는 보안을 위해 사용자 지정 정책 생성:**
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:GetObject",
                   "s3:PutObject",
                   "s3:DeleteObject"
               ],
               "Resource": "arn:aws:s3:::voice-journal-audio-files/*"
           },
           {
               "Effect": "Allow",
               "Action": [
                   "s3:ListBucket"
               ],
               "Resource": "arn:aws:s3:::voice-journal-audio-files"
           }
       ]
   }
   ```

3. **"다음"** → **"사용자 만들기"** 클릭

### 액세스 키 저장
⚠️ **중요**: 액세스 키 ID와 비밀 액세스 키를 안전한 곳에 저장하세요!
- **액세스 키 ID**: AKIA...
- **비밀 액세스 키**: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

## 4. 환경 변수 설정

`.env.local` 파일에 AWS 설정 추가:

```env
# AWS S3 설정
AWS_ACCESS_KEY_ID=여기에_액세스_키_ID_입력
AWS_SECRET_ACCESS_KEY=여기에_비밀_액세스_키_입력
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=voice-journal-audio-files
```

## 5. 테스트

```bash
# 개발 서버 재시작
npm run dev

# 음성 파일 업로드 테스트
# 브라우저에서 로그인 후 음성 파일 업로드 시도
```

## 6. 비용 관리

### S3 요금제
- **프리 티어**: 12개월간 월 5GB 스토리지 무료
- **스토리지**: GB당 약 $0.025/월
- **요청**: PUT/GET 요청당 소액 과금

### 비용 절약 팁
1. **수명 주기 정책** 설정으로 오래된 파일 자동 삭제
2. **CloudWatch** 알림으로 비용 모니터링
3. 불필요한 파일 정기적 정리

## 7. 보안 고려사항

### 권장 보안 설정
1. **퍼블릭 액세스 차단** 유지
2. **Presigned URL** 사용으로 임시 접근만 허용
3. **최소 권한 원칙** - 필요한 권한만 부여
4. **액세스 키 정기 교체**

### 프로덕션 환경에서는
- AWS Secrets Manager로 액세스 키 관리
- CloudTrail로 API 호출 로깅
- VPC 엔드포인트 사용 고려

## 문제 해결

**S3 업로드 실패:**
- 액세스 키와 비밀 키 확인
- 버킷 이름과 리전 확인
- IAM 권한 확인

**파일 접근 실패:**
- Presigned URL 만료 시간 확인
- 버킷 정책 확인

**비용 문제:**
- CloudWatch에서 S3 사용량 모니터링
- 불필요한 파일 삭제