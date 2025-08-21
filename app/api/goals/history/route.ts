import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "week" // week, month, all
    const includeCompleted = searchParams.get("includeCompleted") !== "false" // 기본값 true

    // 기간 설정
    let dateFilter: any = {}
    const now = new Date()
    
    switch (period) {
      case "week":
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = { targetDate: { gte: weekAgo } }
        break
      case "month":
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter = { targetDate: { gte: monthAgo } }
        break
      case "all":
        // 모든 기간 - 빈 필터
        dateFilter = {}
        break
      default:
        // 특정 날짜
        const date = new Date(period)
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)
        dateFilter = { targetDate: { gte: startOfDay, lte: endOfDay } }
    }

    // 목표 조회
    console.log(`목표 히스토리 조회: 사용자=${user.id}, 기간=${period}, dateFilter=${JSON.stringify(dateFilter)}`)
    
    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        ...dateFilter,
        ...(includeCompleted === false && { completed: false })
      },
      orderBy: [
        { targetDate: "desc" },
        { priority: "desc" },
        { createdAt: "asc" }
      ]
    })

    console.log(`히스토리 조회된 목표 수: ${goals.length}`)
    goals.forEach(goal => {
      console.log(`히스토리 목표: ${goal.text} (targetDate: ${goal.targetDate.toISOString()}, completed: ${goal.completed})`)
    })

    // 날짜별로 그룹화
    const groupedGoals = goals.reduce((acc: any, goal: any) => {
      const dateKey = goal.targetDate.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          goals: [],
          totalCount: 0,
          completedCount: 0,
          completionRate: 0
        }
      }
      
      acc[dateKey].goals.push(goal)
      acc[dateKey].totalCount++
      if (goal.completed) {
        acc[dateKey].completedCount++
      }
      acc[dateKey].completionRate = Math.round((acc[dateKey].completedCount / acc[dateKey].totalCount) * 100)
      
      return acc
    }, {} as Record<string, any>)

    // 통계 계산
    const stats = {
      totalGoals: goals.length,
      completedGoals: goals.filter((g: any) => g.completed).length,
      pendingGoals: goals.filter((g: any) => !g.completed).length,
      completionRate: goals.length > 0 
        ? Math.round((goals.filter((g: any) => g.completed).length / goals.length) * 100) 
        : 0,
      periodLabel: period === "week" ? "최근 7일" : period === "month" ? "최근 30일" : "전체 기간"
    }

    return NextResponse.json({
      success: true,
      data: {
        groupedGoals: Object.values(groupedGoals).sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        stats
      }
    })

  } catch (error: any) {
    console.error("목표 히스토리 조회 오류:", error)
    return NextResponse.json({ 
      error: "목표 히스토리를 불러오는 중 오류가 발생했습니다." 
    }, { status: 500 })
  }
}