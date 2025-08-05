import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
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
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        targetDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: [
        { priority: "desc" }, // high -> medium -> low
        { createdAt: "asc" }
      ]
    })

    return NextResponse.json({
      success: true,
      data: goals
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