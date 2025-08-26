import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: 알림 설정 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { notificationSettings: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 설정이 없으면 기본값 생성
    if (!user.notificationSettings) {
      const settings = await prisma.notificationSettings.create({
        data: {
          userId: user.id,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul"
        }
      })
      return NextResponse.json(settings)
    }

    return NextResponse.json(user.notificationSettings)
  } catch (error) {
    console.error("Failed to get notification settings:", error)
    return NextResponse.json(
      { error: "Failed to get notification settings" },
      { status: 500 }
    )
  }
}

// PUT: 알림 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    
    // 기존 설정 확인
    const existingSettings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id }
    })

    let settings
    if (existingSettings) {
      // 업데이트
      settings = await prisma.notificationSettings.update({
        where: { userId: user.id },
        data: {
          planReminderEnabled: body.planReminderEnabled ?? existingSettings.planReminderEnabled,
          planReminderTime: body.planReminderTime ?? existingSettings.planReminderTime,
          reflectionReminderEnabled: body.reflectionReminderEnabled ?? existingSettings.reflectionReminderEnabled,
          reflectionReminderTime: body.reflectionReminderTime ?? existingSettings.reflectionReminderTime,
          streakAlertsEnabled: body.streakAlertsEnabled ?? existingSettings.streakAlertsEnabled,
          goalDeadlineAlertsEnabled: body.goalDeadlineAlertsEnabled ?? existingSettings.goalDeadlineAlertsEnabled,
          emailEnabled: body.emailEnabled ?? existingSettings.emailEnabled,
          pushEnabled: body.pushEnabled ?? existingSettings.pushEnabled,
          pushSubscription: body.pushSubscription ?? existingSettings.pushSubscription,
          timezone: body.timezone ?? existingSettings.timezone
        }
      })
    } else {
      // 새로 생성
      settings = await prisma.notificationSettings.create({
        data: {
          userId: user.id,
          planReminderEnabled: body.planReminderEnabled ?? true,
          planReminderTime: body.planReminderTime ?? "21:00",
          reflectionReminderEnabled: body.reflectionReminderEnabled ?? true,
          reflectionReminderTime: body.reflectionReminderTime ?? "07:00",
          streakAlertsEnabled: body.streakAlertsEnabled ?? true,
          goalDeadlineAlertsEnabled: body.goalDeadlineAlertsEnabled ?? true,
          emailEnabled: body.emailEnabled ?? true,
          pushEnabled: body.pushEnabled ?? false,
          pushSubscription: body.pushSubscription ?? null,
          timezone: body.timezone ?? "Asia/Seoul"
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to update notification settings:", error)
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    )
  }
}