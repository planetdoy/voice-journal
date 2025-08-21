import { NextResponse } from "next/server"
import { getDailyUsage } from "@/lib/token-tracker"
import { generateDailyUsageEmailTemplate, sendEmail } from "@/lib/email"

// 관리자용 일일 리포트 API
export async function POST() {
  try {
    // 어제 데이터 (정오에 실행되므로 전날 데이터)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    console.log(`일일 리포트 생성 시작: ${yesterday.toISOString().split('T')[0]}`)

    // 어제의 토큰 사용량 데이터 가져오기
    const usageData = await getDailyUsage(yesterday)

    console.log("사용량 데이터:", {
      totalUsers: usageData.totalUsers,
      totalRequests: usageData.totalRequests,
      totalCost: usageData.totalCost
    })

    // 데이터가 없으면 리포트 생략
    if (usageData.totalRequests === 0) {
      console.log("어제 사용량이 없어 리포트를 생략합니다.")
      return NextResponse.json({ 
        success: true, 
        message: "사용량이 없어 리포트를 생략했습니다.",
        data: usageData 
      })
    }

    // 이메일 템플릿 생성
    const emailTemplate = generateDailyUsageEmailTemplate(usageData)

    // 관리자 이메일로 전송 (환경변수에서 가져오기)
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL 환경변수가 설정되지 않았습니다.")
    }

    console.log(`리포트 이메일 전송 중: ${adminEmail}`)

    // 이메일 전송
    const emailResult = await sendEmail(
      adminEmail,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    )

    if (!emailResult.success) {
      throw new Error(`이메일 전송 실패: ${emailResult.error}`)
    }

    console.log("일일 리포트 전송 완료")

    return NextResponse.json({
      success: true,
      message: "일일 리포트가 성공적으로 전송되었습니다.",
      data: {
        date: usageData.date,
        totalUsers: usageData.totalUsers,
        totalRequests: usageData.totalRequests,
        totalCost: usageData.totalCost,
        emailSent: true,
        emailId: emailResult.messageId
      }
    })

  } catch (error: any) {
    console.error("일일 리포트 생성 오류:", error)

    return NextResponse.json({ 
      success: false,
      error: "일일 리포트 생성 중 오류가 발생했습니다.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}

// 수동 실행용 GET 엔드포인트 (테스트용)
export async function GET() {
  try {
    // API 키 확인 (보안을 위해)
    const apiKey = process.env.CRON_SECRET
    if (!apiKey) {
      return NextResponse.json({ error: "설정되지 않은 시스템입니다." }, { status: 500 })
    }

    // 오늘 데이터로 테스트
    const today = new Date()
    const usageData = await getDailyUsage(today)

    // 이메일 템플릿만 생성해서 반환 (실제 전송 안함)
    const emailTemplate = generateDailyUsageEmailTemplate(usageData)

    return NextResponse.json({
      success: true,
      message: "테스트 리포트 생성 완료 (이메일 전송하지 않음)",
      data: usageData,
      emailPreview: {
        subject: emailTemplate.subject,
        htmlLength: emailTemplate.html.length,
        textLength: emailTemplate.text.length
      }
    })

  } catch (error: any) {
    console.error("테스트 리포트 생성 오류:", error)
    return NextResponse.json({ 
      error: "테스트 리포트 생성 실패",
      details: error?.message 
    }, { status: 500 })
  }
}