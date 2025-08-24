import { NextRequest, NextResponse } from "next/server"
import { sendReminderNotifications } from "@/lib/notification-helpers"

// GET: 정기 알림 크론 작업
export async function GET(request: NextRequest) {
  try {
    // 보안 확인
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedAuth) {
      console.log('Unauthorized cron request:', authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('Starting reminder notifications cron job...')
    
    // 알림 발송 실행
    await sendReminderNotifications()
    
    const response = {
      success: true,
      message: "Reminder notifications processed",
      timestamp: new Date().toISOString()
    }
    
    console.log('Reminder notifications cron job completed:', response)
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("Cron job failed:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process reminder notifications",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST: 수동 테스트용 (개발 환경에서만)
export async function POST(request: NextRequest) {
  // 개발 환경에서만 허용
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 })
  }

  try {
    console.log('Manual trigger for reminder notifications...')
    await sendReminderNotifications()
    
    return NextResponse.json({
      success: true,
      message: "Manual reminder notifications sent",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Manual cron trigger failed:", error)
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to send manual notifications",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}