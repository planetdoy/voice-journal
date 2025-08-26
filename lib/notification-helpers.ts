import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// 시간대 변환 유틸리티
export function convertToUserTimezone(timeString: string, timezone: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
  
  // 사용자 시간대를 고려한 UTC 시간으로 변환
  return new Date(date.toLocaleString("en-US", { timeZone: timezone }))
}

// 현재 시간이 알림 시간인지 확인
export function isTimeForNotification(reminderTime: string, timezone: string): boolean {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  const [targetHour, targetMinute] = reminderTime.split(':').map(Number)
  
  // ±5분 허용 범위
  const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (targetHour * 60 + targetMinute))
  return timeDiff <= 5
}

// 사용자별 알림 발송
export async function sendReminderNotifications() {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  console.log(`Checking reminders at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`)

  try {
    // 활성화된 알림 설정이 있는 사용자 조회
    const usersWithNotifications = await prisma.user.findMany({
      include: {
        notificationSettings: true,
        voiceEntries: {
          where: {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            }
          }
        }
      },
      where: {
        notificationSettings: {
          OR: [
            { 
              AND: [
                { planReminderEnabled: true },
                { emailEnabled: true }
              ]
            },
            { 
              AND: [
                { reflectionReminderEnabled: true },
                { emailEnabled: true }
              ]
            }
          ]
        }
      }
    })

    console.log(`Found ${usersWithNotifications.length} users with notification settings`)

    for (const user of usersWithNotifications) {
      const settings = user.notificationSettings!
      
      // 계획 알림 체크
      if (settings.planReminderEnabled && 
          settings.emailEnabled && 
          isTimeForNotification(settings.planReminderTime, settings.timezone)) {
        
        await sendPlanReminder(user, settings)
      }
      
      // 회고 알림 체크
      if (settings.reflectionReminderEnabled && 
          settings.emailEnabled && 
          isTimeForNotification(settings.reflectionReminderTime, settings.timezone)) {
        
        await sendReflectionReminder(user, settings)
      }
    }
    
    // 스트릭 알림 체크 (매일 한 번, 21:00)
    if (currentHour === 21 && currentMinute < 5) {
      await checkAndSendStreakAlerts()
    }
    
    // 목표 마감일 알림 체크 (매일 아침 9시)
    if (currentHour === 9 && currentMinute < 5) {
      await checkAndSendGoalDeadlineAlerts()
    }

  } catch (error) {
    console.error('Error sending reminder notifications:', error)
  }
}

// 계획 리마인더 이메일
async function sendPlanReminder(user: any, settings: any) {
  try {
    // 오늘 계획 기록이 있는지 확인
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayPlan = await prisma.voiceEntry.findFirst({
      where: {
        userId: user.id,
        type: 'plan',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (todayPlan) {
      console.log(`User ${user.email} already has a plan for today`)
      return
    }

    const emailContent = {
      subject: "🌟 Voice Journal - 내일을 위한 계획을 세워보세요",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">🌟 Voice Journal</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">내일을 위한 계획을 세워보세요</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">안녕하세요, ${user.name}님!</h2>
            <p style="margin: 0; color: #666; line-height: 1.6;">
              하루를 마무리하며 내일을 위한 계획을 세워보세요. 
              목소리로 기록하는 계획은 더 강한 의지력을 만들어줍니다.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}?action=record&type=plan" 
               style="background: #667eea; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">
              📝 계획 기록하기
            </a>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px;">💡 계획 세우기 팁</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>구체적이고 실행 가능한 목표를 세워보세요</li>
              <li>우선순위를 정해 중요한 것부터 계획하세요</li>
              <li>예상 시간도 함께 말하면 더 현실적인 계획이 됩니다</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>이 알림을 받고 싶지 않으시다면 <a href="${process.env.NEXTAUTH_URL}?view=settings">알림 설정</a>에서 변경할 수 있습니다.</p>
            <p>Voice Journal • ${new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      `,
      text: `
Voice Journal - 내일을 위한 계획을 세워보세요

안녕하세요, ${user.name}님!

하루를 마무리하며 내일을 위한 계획을 세워보세요.
목소리로 기록하는 계획은 더 강한 의지력을 만들어줍니다.

계획 기록하러 가기: ${process.env.NEXTAUTH_URL}?action=record&type=plan

Voice Journal • ${new Date().toLocaleDateString('ko-KR')}
      `
    }

    await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text)
    
    // 알림 로그 저장
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        type: 'plan_reminder',
        channel: 'email',
        subject: emailContent.subject,
        content: emailContent.text,
        status: 'sent',
        sentAt: new Date()
      }
    })

    console.log(`Plan reminder sent to ${user.email}`)
  } catch (error) {
    console.error(`Failed to send plan reminder to ${user.email}:`, error)
    
    // 실패 로그 저장
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        type: 'plan_reminder',
        channel: 'email',
        subject: '계획 알림',
        content: '계획 리마인더 이메일',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

// 회고 리마인더 이메일
async function sendReflectionReminder(user: any, settings: any) {
  try {
    // 어제 회고 기록이 있는지 확인
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const today = new Date(yesterday)
    today.setDate(today.getDate() + 1)
    
    const yesterdayReflection = await prisma.voiceEntry.findFirst({
      where: {
        userId: user.id,
        type: 'reflection',
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    })

    // 최근 계획 조회 (동기부여용)
    const recentPlan = await prisma.voiceEntry.findFirst({
      where: {
        userId: user.id,
        type: 'plan'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const emailContent = {
      subject: "🌅 Voice Journal - 어제를 돌아보며 오늘을 시작하세요",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">🌅 Voice Journal</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">어제를 돌아보며 오늘을 시작하세요</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">좋은 아침입니다, ${user.name}님!</h2>
            <p style="margin: 0; color: #666; line-height: 1.6;">
              새로운 하루가 시작되었습니다. 어제의 경험을 돌아보며 오늘을 더 의미 있게 시작해보세요.
            </p>
          </div>

          ${recentPlan ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4caf50;">
            <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 16px;">💭 지난 계획</h3>
            <p style="margin: 0; color: #555; font-style: italic;">"${recentPlan.originalText.substring(0, 100)}..."</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
              ${new Date(recentPlan.createdAt).toLocaleDateString('ko-KR')}에 기록
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}?action=record&type=reflection" 
               style="background: #ff9a9e; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">
              🎤 회고 기록하기
            </a>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800;">
            <h3 style="margin: 0 0 10px 0; color: #f57c00; font-size: 16px;">✨ 회고 가이드</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>어제 가장 뿌듯했던 순간은 무엇인가요?</li>
              <li>예상과 다르게 된 일이 있었나요?</li>
              <li>오늘은 어떤 점을 개선하고 싶으신가요?</li>
              <li>어제의 경험에서 배운 점은 무엇인가요?</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>이 알림을 받고 싶지 않으시다면 <a href="${process.env.NEXTAUTH_URL}?view=settings">알림 설정</a>에서 변경할 수 있습니다.</p>
            <p>Voice Journal • ${new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      `,
      text: `
Voice Journal - 어제를 돌아보며 오늘을 시작하세요

좋은 아침입니다, ${user.name}님!

새로운 하루가 시작되었습니다. 어제의 경험을 돌아보며 오늘을 더 의미 있게 시작해보세요.

회고 기록하러 가기: ${process.env.NEXTAUTH_URL}?action=record&type=reflection

Voice Journal • ${new Date().toLocaleDateString('ko-KR')}
      `
    }

    await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text)
    
    // 알림 로그 저장
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        type: 'reflection_reminder',
        channel: 'email',
        subject: emailContent.subject,
        content: emailContent.text,
        status: 'sent',
        sentAt: new Date()
      }
    })

    console.log(`Reflection reminder sent to ${user.email}`)
  } catch (error) {
    console.error(`Failed to send reflection reminder to ${user.email}:`, error)
    
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        type: 'reflection_reminder',
        channel: 'email',
        subject: '회고 알림',
        content: '회고 리마인더 이메일',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

// 스트릭 알림 체크
async function checkAndSendStreakAlerts() {
  try {
    const users = await prisma.user.findMany({
      include: {
        notificationSettings: true,
        voiceEntries: {
          orderBy: { createdAt: 'desc' },
          take: 7
        }
      },
      where: {
        notificationSettings: {
          AND: [
            { streakAlertsEnabled: true },
            { emailEnabled: true }
          ]
        }
      }
    })

    for (const user of users) {
      // 스트릭 끊길 위험 또는 축하 메시지 체크
      const streakInfo = calculateUserStreak(user.voiceEntries)
      
      if (streakInfo.shouldAlert) {
        await sendStreakAlert(user, streakInfo)
      }
    }
  } catch (error) {
    console.error('Error checking streak alerts:', error)
  }
}

// 목표 마감일 알림 체크
async function checkAndSendGoalDeadlineAlerts() {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    const users = await prisma.user.findMany({
      include: {
        notificationSettings: true,
        goals: {
          where: {
            completed: false,
            targetDate: {
              lte: tomorrow
            }
          }
        }
      },
      where: {
        notificationSettings: {
          AND: [
            { goalDeadlineAlertsEnabled: true },
            { emailEnabled: true }
          ]
        }
      }
    })

    for (const user of users) {
      if (user.goals.length > 0) {
        await sendGoalDeadlineAlert(user, user.goals)
      }
    }
  } catch (error) {
    console.error('Error checking goal deadline alerts:', error)
  }
}

// 스트릭 계산
function calculateUserStreak(voiceEntries: any[]): { current: number, shouldAlert: boolean, type: 'danger' | 'celebration' | null } {
  // 연속 기록 일수 계산 로직
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const nextDay = new Date(checkDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const hasEntry = voiceEntries.some(entry => {
      const entryDate = new Date(entry.createdAt)
      return entryDate >= checkDate && entryDate < nextDay
    })

    if (hasEntry) {
      streak++
    } else {
      break
    }
  }

  return {
    current: streak,
    shouldAlert: streak >= 3 || (streak === 0 && Math.random() < 0.3), // 3일 이상 연속 또는 기록 없을 때 30% 확률
    type: streak >= 7 ? 'celebration' : streak === 0 ? 'danger' : null
  }
}

// 스트릭 알림 발송
async function sendStreakAlert(user: any, streakInfo: any) {
  // 스트릭 알림 이메일 로직 (생략 - 위와 유사한 패턴)
}

// 목표 마감일 알림 발송
async function sendGoalDeadlineAlert(user: any, goals: any[]) {
  // 목표 마감일 알림 이메일 로직 (생략 - 위와 유사한 패턴)
}