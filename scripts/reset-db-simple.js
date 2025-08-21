const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 데이터베이스 초기화 시작...')
  
  try {
    // 트랜잭션으로 모든 데이터 삭제
    await prisma.$transaction([
      // 의존성 순서대로 삭제
      prisma.goalComment.deleteMany(),
      prisma.reminderSetting.deleteMany(),
      prisma.dailyGoal.deleteMany(),
      prisma.voiceEntry.deleteMany(),
      prisma.streakRecord.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.user.deleteMany(),
    ])
    
    console.log('✅ 모든 데이터가 성공적으로 삭제되었습니다!')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()