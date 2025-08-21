import cron from "node-cron"

// 정오에 일일 리포트 전송
export function scheduleDailyReport() {
  // 매일 정오 (12:00)에 실행
  const job = cron.schedule('0 12 * * *', async () => {
    console.log('일일 리포트 크론 작업 시작:', new Date().toISOString())
    
    try {
      // 내부 API 호출
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/daily-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Voice-Journal-Cron/1.0'
        }
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log('일일 리포트 전송 성공:', result.message)
      } else {
        console.error('일일 리포트 전송 실패:', result.error)
      }
    } catch (error) {
      console.error('일일 리포트 크론 작업 오류:', error)
    }
  })

  console.log('일일 리포트 크론 작업이 예약되었습니다 (매일 정오 12:00 KST)')
  return job
}

// 모든 크론 작업 초기화
export function initializeCronJobs() {
  console.log('크론 작업 초기화 중...')
  
  // 일일 리포트 스케줄링
  const dailyReportJob = scheduleDailyReport()
  
  // 프로세스 종료 시 크론 작업 정리
  process.on('SIGTERM', () => {
    console.log('프로세스 종료 중... 크론 작업을 정리합니다.')
    dailyReportJob.stop()
  })

  process.on('SIGINT', () => {
    console.log('프로세스 인터럽트... 크론 작업을 정리합니다.')
    dailyReportJob.stop()
    process.exit(0)
  })

  return {
    dailyReportJob
  }
}