import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { getPresignedUrl } from "@/lib/s3"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 음성 기록 조회 및 권한 확인
    const voiceEntry = await prisma.voiceEntry.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!voiceEntry) {
      return NextResponse.json({ error: "음성 기록을 찾을 수 없습니다." }, { status: 404 })
    }

    // S3 키 추출 (URL에서)
    const s3Key = voiceEntry.audioFileUrl.split('.amazonaws.com/')[1]
    
    if (!s3Key) {
      return NextResponse.json({ error: "올바르지 않은 파일 경로입니다." }, { status: 400 })
    }

    // Presigned URL 생성 (1시간 유효)
    const presignedUrl = await getPresignedUrl(s3Key, 3600)

    return NextResponse.json({
      success: true,
      presignedUrl,
      fileName: voiceEntry.audioFileName,
      expiresIn: 3600
    })

  } catch (error: any) {
    console.error("오디오 파일 접근 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ error: "오디오 파일에 접근할 수 없습니다." }, { status: 500 })
  }
}