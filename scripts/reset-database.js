const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🔄 데이터베이스 초기화 시작...')
  
  try {
    // 모든 테이블의 데이터 삭제 (의존성 순서대로)
    console.log('📋 GoalComment 테이블 삭제 중...')
    await prisma.goalComment.deleteMany({})
    
    console.log('🔔 ReminderSetting 테이블 삭제 중...')
    await prisma.reminderSetting.deleteMany({})
    
    console.log('🎯 DailyGoal 테이블 삭제 중...')
    await prisma.dailyGoal.deleteMany({})
    
    console.log('🎯 VoiceEntry 테이블 삭제 중...')
    await prisma.voiceEntry.deleteMany({})
    
    console.log('🔐 Session 테이블 삭제 중...')
    await prisma.session.deleteMany({})
    
    console.log('📊 StreakRecord 테이블 삭제 중...')
    await prisma.streakRecord.deleteMany({})
    
    console.log('💳 Account 테이블 삭제 중...')
    await prisma.account.deleteMany({})
    
    console.log('👤 User 테이블 삭제 중...')
    await prisma.user.deleteMany({})
    
    console.log('✅ 모든 데이터가 성공적으로 삭제되었습니다!')
    
    // 삭제된 레코드 수 확인
    const userCount = await prisma.user.count()
    const voiceEntryCount = await prisma.voiceEntry.count()
    const dailyGoalCount = await prisma.dailyGoal.count()
    const sessionCount = await prisma.session.count()
    const accountCount = await prisma.account.count()
    const streakCount = await prisma.streakRecord.count()
    const reminderCount = await prisma.reminderSetting.count()
    const commentCount = await prisma.goalComment.count()
    
    console.log('\n📊 현재 데이터베이스 상태:')
    console.log(`- Users: ${userCount}`)
    console.log(`- Accounts: ${accountCount}`)
    console.log(`- Voice Entries: ${voiceEntryCount}`)
    console.log(`- Daily Goals: ${dailyGoalCount}`)
    console.log(`- Goal Comments: ${commentCount}`)
    console.log(`- Sessions: ${sessionCount}`)
    console.log(`- Streak Records: ${streakCount}`)
    console.log(`- Reminder Settings: ${reminderCount}`)
    
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 실행
resetDatabase()
  .then(() => {
    console.log('\n🎉 데이터베이스 초기화 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 초기화 실패:', error)
    process.exit(1)
  })