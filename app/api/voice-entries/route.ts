import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPresignedUrl, extractFileNameFromKey } from "@/lib/s3"

// 시간을 분:초 형식으로 변환하는 함수 (소수점 또는 문자열 처리)
function formatDuration(duration: string | number | null): string {
  if (!duration) return "0:00"
  
  // 이미 분:초 형식인지 확인 (예: "2:05")
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration
  }
  
  // 숫자로 변환 시도
  const seconds = typeof duration === 'string' ? parseFloat(duration) : duration
  
  if (isNaN(seconds) || seconds <= 0) return "0:00"
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
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
        audioFileUrl: true,
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

    // Presigned URL 생성하고 duration 포맷팅하여 오디오 파일 접근 가능하게 만들기
    const voiceEntriesWithPresignedUrls = await Promise.all(
      voiceEntries.map(async (entry: any) => {
        let updatedEntry = { 
          ...entry, 
          audioDuration: formatDuration(entry.audioDuration) // duration 포맷팅
        }
        
        if (entry.audioFileUrl) {
          try {
            // S3 URL에서 키 추출
            const urlParts = entry.audioFileUrl.split('.amazonaws.com/')
            if (urlParts.length > 1) {
              const s3Key = urlParts[1]
              const presignedUrl = await getPresignedUrl(s3Key, 3600) // 1시간 유효
              updatedEntry.audioFileUrl = presignedUrl
            }
          } catch (error) {
            console.error('Presigned URL 생성 실패:', error)
            // 실패하면 원본 URL 유지
          }
        }
        return updatedEntry
      })
    )

    // 총 개수 조회
    const totalCount = await prisma.voiceEntry.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: voiceEntriesWithPresignedUrls,
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