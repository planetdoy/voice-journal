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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") as "plan" | "reflection" | null

    // 음성 기록 조회
    const whereClause: any = { userId: user.id }
    if (type) {
      whereClause.type = type
    }

    const voiceEntries = await prisma.voiceEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        title: true,
        originalText: true,
        editedText: true,
        audioFileName: true,
        audioFileSize: true,
        audioDuration: true,
        language: true,
        confidence: true,
        keywords: true,
        mood: true,
        completed: true,
        recordedAt: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // 총 개수 조회
    const totalCount = await prisma.voiceEntry.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: voiceEntries,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error: any) {
    console.error("음성 기록 조회 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ error: "음성 기록을 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const entryId = searchParams.get("id")

    if (!entryId) {
      return NextResponse.json({ error: "음성 기록 ID가 필요합니다." }, { status: 400 })
    }

    // 해당 사용자의 음성 기록인지 확인 후 삭제
    const deletedEntry = await prisma.voiceEntry.deleteMany({
      where: {
        id: entryId,
        userId: user.id
      }
    })

    if (deletedEntry.count === 0) {
      return NextResponse.json({ error: "음성 기록을 찾을 수 없거나 삭제 권한이 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "음성 기록이 삭제되었습니다."
    })

  } catch (error: any) {
    console.error("음성 기록 삭제 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ error: "음성 기록을 삭제하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}