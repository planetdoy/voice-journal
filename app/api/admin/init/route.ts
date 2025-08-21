import { NextResponse } from "next/server"
import { initializeCronJobs } from "@/lib/cron-jobs"

let cronJobsInitialized = false

// 앱 시작 시 한 번만 실행되는 초기화 엔드포인트
export async function POST() {
  try {
    if (cronJobsInitialized) {
      return NextResponse.json({
        success: true,
        message: "크론 작업이 이미 초기화되었습니다."
      })
    }

    // 크론 작업 초기화
    const jobs = initializeCronJobs()
    cronJobsInitialized = true

    console.log("Voice Journal 크론 작업 초기화 완료")

    return NextResponse.json({
      success: true,
      message: "크론 작업이 성공적으로 초기화되었습니다.",
      jobs: {
        dailyReportScheduled: true,
        nextRun: "매일 정오 12:00 (KST)"
      }
    })

  } catch (error: any) {
    console.error("크론 작업 초기화 오류:", error)
    return NextResponse.json({ 
      error: "크론 작업 초기화 실패",
      details: error?.message 
    }, { status: 500 })
  }
}

// 상태 확인용 GET 엔드포인트
export async function GET() {
  return NextResponse.json({
    initialized: cronJobsInitialized,
    message: cronJobsInitialized ? "크론 작업 실행 중" : "크론 작업이 초기화되지 않음",
    currentTime: new Date().toISOString(),
    timezone: "Asia/Seoul"
  })
}