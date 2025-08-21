import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!goal) {
      return NextResponse.json({ error: "목표를 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: goal
    })

  } catch (error: any) {
    console.error("목표 조회 오류:", error)
    return NextResponse.json({ error: "목표를 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const body = await request.json()
    const { completed, text, priority, category, estimatedMinutes } = body
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // 업데이트할 데이터 구성
    const updateData: any = {}
    
    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }
    
    if (text !== undefined) updateData.text = text.trim()
    if (priority !== undefined) updateData.priority = priority
    if (category !== undefined) updateData.category = category
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes

    // 해당 사용자의 목표인지 확인 후 업데이트
    const updatedGoal = await prisma.goal.updateMany({
      where: {
        id: id,
        userId: user.id
      },
      data: updateData
    })

    if (updatedGoal.count === 0) {
      return NextResponse.json({ 
        error: "목표를 찾을 수 없거나 수정 권한이 없습니다." 
      }, { status: 404 })
    }

    // 업데이트된 목표 다시 조회
    const goal = await prisma.goal.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    console.log(`목표 업데이트 완료: ${id}`)

    return NextResponse.json({
      success: true,
      data: goal,
      message: "목표가 수정되었습니다."
    })

  } catch (error: any) {
    console.error("목표 수정 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "목표 수정 중 오류가 발생했습니다.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // 해당 사용자의 목표인지 확인 후 삭제
    const deletedGoal = await prisma.goal.deleteMany({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (deletedGoal.count === 0) {
      return NextResponse.json({ error: "목표를 찾을 수 없거나 삭제 권한이 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "목표가 삭제되었습니다."
    })

  } catch (error: any) {
    console.error("목표 삭제 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ error: "목표를 삭제하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}