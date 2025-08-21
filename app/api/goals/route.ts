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
    const date = searchParams.get("date") // YYYY-MM-DD 형식
    
    // 오늘 날짜 또는 지정된 날짜의 목표 조회
    const targetDate = date ? new Date(date + 'T00:00:00+09:00') : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    console.log(`목표 조회: 사용자=${user.id}, 날짜범위=${startOfDay.toISOString()} ~ ${endOfDay.toISOString()}`)

    // 날짜 기반 조회를 더 넓은 범위로 확장 (시간대 문제 해결)
    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        targetDate: {
          gte: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000), // 하루 전부터
          lte: new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000) // 하루 후까지
        }
      },
      orderBy: [
        { priority: "desc" }, // high -> medium -> low
        { createdAt: "asc" }
      ]
    })

    // 실제 날짜와 일치하는 목표만 필터링
    const filteredGoals = goals.filter(goal => {
      const goalDate = new Date(goal.targetDate)
      const goalDateString = goalDate.toISOString().split('T')[0]
      const targetDateString = date || new Date().toISOString().split('T')[0]
      return goalDateString === targetDateString
    })

    console.log(`조회된 목표 수: ${goals.length}, 필터링된 목표 수: ${filteredGoals.length}`)
    goals.forEach(goal => {
      console.log(`목표: ${goal.text} (targetDate: ${goal.targetDate.toISOString()})`)
    })
    filteredGoals.forEach(goal => {
      console.log(`필터링된 목표: ${goal.text}`)
    })

    return NextResponse.json({
      success: true,
      data: filteredGoals
    })

  } catch (error: any) {
    console.error("목표 조회 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ error: "목표를 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const { text, priority, category, estimatedMinutes, targetDate } = await request.json()
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "목표 내용이 필요합니다." }, { status: 400 })
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // 목표 날짜가 지정되지 않으면 오늘로 설정
    const goalTargetDate = targetDate ? new Date(targetDate) : new Date()
    goalTargetDate.setHours(23, 59, 59, 999) // 하루 끝으로 설정

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        text: text.trim(),
        priority: priority || "medium",
        category: category || null,
        estimatedMinutes: estimatedMinutes || null,
        targetDate: goalTargetDate
      }
    })

    console.log(`새 목표 생성: ${goal.id} - ${goal.text}`)

    return NextResponse.json({
      success: true,
      data: goal,
      message: "목표가 생성되었습니다."
    })

  } catch (error: any) {
    console.error("목표 생성 오류:", error)

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "이미 존재하는 목표입니다." }, { status: 409 })
    }

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "목표 생성 중 오류가 발생했습니다.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}