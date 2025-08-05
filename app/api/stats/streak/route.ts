import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 두 날짜 간의 차이 (일 단위) - 정확한 날짜 차이 계산
function daysDifference(laterDate: Date, earlierDate: Date): number {
  const later = new Date(laterDate)
  const earlier = new Date(earlierDate)
  
  // 시간을 00:00:00으로 정규화
  later.setHours(0, 0, 0, 0)
  earlier.setHours(0, 0, 0, 0)
  
  const timeDiff = later.getTime() - earlier.getTime()
  return Math.round(timeDiff / (1000 * 60 * 60 * 24))
}

// 연속 기록 계산 함수
function calculateStreak(recordDates: string[]): {
  currentStreak: number
  longestStreak: number
  lastRecordDate: string | null
  streakStatus: 'active' | 'broken' | 'none'
} {
  if (recordDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastRecordDate: null,
      streakStatus: 'none'
    }
  }

  // 날짜를 정렬 (최신순)
  const sortedDates = [...new Set(recordDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  const today = new Date()
  const todayStr = formatDate(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatDate(yesterday)

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  // 현재 연속 기록 계산
  const latestRecordDate = sortedDates[0]
  
  // 오늘 또는 어제까지 기록이 있으면 활성 스트릭
  const isStreakActive = latestRecordDate === todayStr || latestRecordDate === yesterdayStr
  
  if (isStreakActive) {
    currentStreak = 1
    
    // 연속된 날짜들을 찾아서 카운트 (최신 날짜부터 과거로)
    for (let i = 1; i < sortedDates.length; i++) {
      const recentDate = new Date(sortedDates[i - 1])
      const olderDate = new Date(sortedDates[i])
      const dayDiff = daysDifference(recentDate, olderDate)
      
      console.log(`연속 기록 확인: ${sortedDates[i - 1]} vs ${sortedDates[i]}, 차이: ${dayDiff}일`)
      
      if (dayDiff === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // 가장 긴 연속 기록 계산
  for (let i = 1; i < sortedDates.length; i++) {
    const recentDate = new Date(sortedDates[i - 1])
    const olderDate = new Date(sortedDates[i])
    const dayDiff = daysDifference(recentDate, olderDate)
    
    if (dayDiff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // 스트릭 상태 결정
  let streakStatus: 'active' | 'broken' | 'none'
  if (currentStreak === 0) {
    streakStatus = recordDates.length > 0 ? 'broken' : 'none'
  } else {
    streakStatus = 'active'
  }

  return {
    currentStreak,
    longestStreak,
    lastRecordDate: latestRecordDate,
    streakStatus
  }
}

export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // 사용자의 모든 음성 기록 날짜 조회 (중복 제거)
    const voiceEntries = await prisma.voiceEntry.findMany({
      where: { userId: user.id },
      select: { recordedAt: true },
      orderBy: { recordedAt: 'desc' }
    })

    // 기록된 날짜들을 YYYY-MM-DD 형식으로 변환
    const recordDates = voiceEntries.map(entry => formatDate(new Date(entry.recordedAt)))

    console.log("=== 연속 기록 계산 시작 ===")
    console.log("총 음성 기록 수:", voiceEntries.length)
    console.log("기록된 날짜들:", recordDates)
    console.log("오늘 날짜:", formatDate(new Date()))

    // 연속 기록 계산
    const streakData = calculateStreak(recordDates)
    
    console.log("계산된 연속 기록:", streakData)

    // 추가 통계 계산
    const totalRecords = voiceEntries.length
    const uniqueDays = new Set(recordDates).size
    
    // 이번 주 기록 수
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // 주 시작 (일요일)
    weekStart.setHours(0, 0, 0, 0)
    
    const thisWeekRecords = voiceEntries.filter(entry => 
      new Date(entry.recordedAt) >= weekStart
    ).length

    // 이번 달 기록 수
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const thisMonthRecords = voiceEntries.filter(entry => 
      new Date(entry.recordedAt) >= monthStart
    ).length

    return NextResponse.json({
      success: true,
      data: {
        ...streakData,
        totalRecords,
        uniqueDays,
        thisWeekRecords,
        thisMonthRecords,
        recordDates: recordDates.slice(0, 30) // 최근 30일 날짜만 반환
      }
    })

  } catch (error: any) {
    console.error("연속 기록 조회 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ error: "연속 기록을 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}