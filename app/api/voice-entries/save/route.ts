import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToS3, generateS3Key } from "@/lib/s3"

// 초 단위 시간을 분:초 형식으로 변환하는 함수
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00"
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== 음성 기록 저장 API 호출 시작 ===")

    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("audio") as File
    const entryType = (formData.get("type") as string) || "reflection"
    const text = (formData.get("text") as string) || ""
    const language = (formData.get("language") as string) || "ko"
    const duration = parseFloat((formData.get("duration") as string) || "0")
    const audioFileUrl = formData.get("audioFileUrl") as string
    const audioFileName = formData.get("audioFileName") as string
    const audioFileSize = parseInt((formData.get("audioFileSize") as string) || "0")
    const recordedAt = formData.get("recordedAt") as string // 선택한 날짜 받기

    if (!file) {
      return NextResponse.json({ error: "오디오 파일이 필요합니다." }, { status: 400 })
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "텍스트가 필요합니다." }, { status: 400 })
    }

    console.log(`저장 요청: 타입=${entryType}, 텍스트길이=${text.length}, 지속시간=${duration}`)

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // S3 업로드가 이미 완료된 경우 URL을 사용, 아니면 새로 업로드
    let finalAudioFileUrl = audioFileUrl
    let finalAudioFileName = audioFileName || file.name
    let finalAudioFileSize = audioFileSize || file.size
    
    if (!audioFileUrl && file) {
      // S3에 아직 업로드되지 않은 경우
      const s3Key = generateS3Key(user.id, file.name)
      finalAudioFileUrl = await uploadToS3(file, s3Key, file.type)
      console.log(`S3 업로드 완료: ${finalAudioFileUrl}`)
    } else {
      console.log(`기존 S3 URL 사용: ${finalAudioFileUrl}`)
    }

    // 데이터베이스에 음성 기록 저장
    // recordedAt이 제공되면 해당 날짜 사용, 아니면 현재 시간 사용
    const recordDate = recordedAt 
      ? new Date(recordedAt + 'T12:00:00+09:00') // 선택한 날짜의 정오(한국시간)로 설정
      : new Date() // 기본값: 현재 시간
      
    console.log(`날짜 처리: 선택날짜=${recordedAt}, 저장날짜=${recordDate.toISOString()}`)
      
    const voiceEntry = await prisma.voiceEntry.create({
      data: {
        userId: user.id,
        type: entryType as "plan" | "reflection",
        originalText: text.trim(),
        audioFileName: finalAudioFileName,
        audioFileUrl: finalAudioFileUrl,
        audioFileSize: finalAudioFileSize,
        audioDuration: formatDuration(duration),
        language: language,
        recordedAt: recordDate,
      }
    })

    console.log(`음성 기록 저장 완료: ${voiceEntry.id}`)

    return NextResponse.json({
      success: true,
      id: voiceEntry.id,
      message: "음성 기록이 저장되었습니다."
    })

  } catch (error: any) {
    console.error("음성 기록 저장 오류:", error)

    // AWS S3 에러 처리
    if (error?.name === "CredentialsProviderError" || error?.name === "InvalidAccessKeyId") {
      return NextResponse.json({ error: "AWS 자격 증명 오류입니다." }, { status: 500 })
    }

    if (error?.name === "NoSuchBucket") {
      return NextResponse.json({ error: "S3 버킷을 찾을 수 없습니다." }, { status: 500 })
    }

    // Prisma 데이터베이스 에러 처리
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "이미 존재하는 데이터입니다." }, { status: 409 })
    }

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "음성 기록 저장 중 오류가 발생했습니다.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}