import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
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

    const { goalIds, targetDate } = await request.json()
    
    if (!goalIds || !Array.isArray(goalIds) || goalIds.length === 0) {
      return NextResponse.json({ error: "이관할 목표를 선택해주세요." }, { status: 400 })
    }

    // 목표 날짜가 지정되지 않으면 오늘로 설정
    const newTargetDate = targetDate ? new Date(targetDate) : new Date()
    newTargetDate.setHours(23, 59, 59, 999)

    // 선택된 목표들이 해당 사용자의 것인지 확인
    const goals = await prisma.goal.findMany({
      where: {
        id: { in: goalIds },
        userId: user.id,
        completed: false // 미완료 목표만 이관 가능
      }
    })

    if (goals.length !== goalIds.length) {
      return NextResponse.json({ 
        error: "일부 목표를 찾을 수 없거나 이미 완료된 목표입니다." 
      }, { status: 400 })
    }

    // 목표들을 새로운 날짜로 이관 (복사)
    const transferredGoals = await Promise.all(
      goals.map((goal: any) => 
        prisma.goal.create({
          data: {
            userId: user.id,
            text: goal.text,
            priority: goal.priority,
            category: goal.category,
            estimatedMinutes: goal.estimatedMinutes,
            targetDate: newTargetDate,
            // 새로운 목표이므로 completed는 false로
            completed: false
          }
        })
      )
    )

    // 원본 목표들에 이관 표시 (선택사항: 원본 삭제 또는 표시)
    // 여기서는 원본을 유지하되, 나중에 히스토리에서 확인 가능하도록 둠

    console.log(`${transferredGoals.length}개 목표 이관 완료`)

    return NextResponse.json({
      success: true,
      data: transferredGoals,
      message: `${transferredGoals.length}개의 목표가 ${newTargetDate.toLocaleDateString('ko-KR')}로 이관되었습니다.`
    })

  } catch (error: any) {
    console.error("목표 이관 오류:", error)
    return NextResponse.json({ 
      error: "목표 이관 중 오류가 발생했습니다.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}