import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// 사용자별 알림 발송 (매일 정오에 실행)
export async function sendReminderNotifications() {
  console.log(`Starting daily reminder check at ${new Date().toISOString()}`)

  try {
    // 활성화된 알림 설정이 있는 사용자 조회
    const usersWithNotifications = await prisma.user.findMany({
      include: {
        notificationSettings: true,
        voiceEntries: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
            }
          }
        }
      },
      where: {
        notificationSettings: {
          AND: [
            { dailyReminderEnabled: true },
            { emailEnabled: true }
          ]
        }
      }
    })

    console.log(`Found ${usersWithNotifications.length} users with notification settings`)

    for (const user of usersWithNotifications) {
      const settings = user.notificationSettings!
      const hasRecordedToday = user.voiceEntries.length > 0
      
      // 오늘 기록이 없는 사용자에게만 알림 발송
      if (!hasRecordedToday) {
        await sendDailyReminder(user, settings)
      } else {
        console.log(`User ${user.email} already has records for today, skipping reminder`)
      }
    }

  } catch (error) {
    console.error('Error sending reminder notifications:', error)
  }
}

// 데일리 리마인더 이메일
async function sendDailyReminder(user: any, settings: any) {
  try {
    const emailContent = {
      subject: "🌟 Voice Journal - 오늘의 기록을 남겨보세요",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">🌟 Voice Journal</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">오늘 하루를 기록해보세요</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">안녕하세요, ${user.name}님!</h2>
            <p style="margin: 0; color: #666; line-height: 1.6;">
              오늘 하루는 어떠셨나요?<br>
              오늘을 돌아보고 내일을 계획하는 시간을 가져보세요.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}" 
               style="background: #667eea; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">
              🎤 지금 기록하기
            </a>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px;">💡 오늘의 기록 가이드</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>오늘 가장 뿌듯했던 순간은 무엇인가요?</li>
              <li>어떤 도전이 있었고, 어떻게 해결했나요?</li>
              <li>내일은 무엇을 시도해보고 싶으신가요?</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>이 알림을 받고 싶지 않으시다면 <a href="${process.env.NEXTAUTH_URL}?view=settings">알림 설정</a>에서 변경할 수 있습니다.</p>
            <p>Voice Journal • ${new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      `,
      text: `
Voice Journal - 오늘의 기록을 남겨보세요

안녕하세요, ${user.name}님!

오늘 하루는 어떠셨나요?
오늘을 돌아보고 내일을 계획하는 시간을 가져보세요.

지금 기록하러 가기: ${process.env.NEXTAUTH_URL}

Voice Journal • ${new Date().toLocaleDateString('ko-KR')}
      `
    }

    await sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text)
    
    // 알림 로그 저장
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        type: 'daily_reminder',
        channel: 'email',
        subject: emailContent.subject,
        content: emailContent.text,
        status: 'sent',
        sentAt: new Date()
      }
    })

    console.log(`Daily reminder sent to ${user.email}`)
  } catch (error) {
    console.error(`Failed to send daily reminder to ${user.email}:`, error)
    
    // 실패 로그 저장
    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        type: 'daily_reminder',
        channel: 'email',
        subject: '데일리 알림',
        content: '데일리 리마인더 이메일',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}