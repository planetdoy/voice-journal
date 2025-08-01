import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { uploadToS3, generateS3Key } from "@/lib/s3"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("=== 음성 변환 API 호출 시작 ===")
    console.log("환경 변수 확인:")
    console.log("- AWS_REGION:", process.env.AWS_REGION)
    console.log("- S3_BUCKET_NAME:", process.env.S3_BUCKET_NAME)
    console.log("- AWS_ACCESS_KEY_ID 존재:", !!process.env.AWS_ACCESS_KEY_ID)
    console.log("- AWS_SECRET_ACCESS_KEY 존재:", !!process.env.AWS_SECRET_ACCESS_KEY)
    console.log("- OPENAI_API_KEY 존재:", !!process.env.OPENAI_API_KEY)

    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("audio") as File
    const language = (formData.get("language") as string) || "ko"
    const entryType = (formData.get("type") as string) || "reflection"

    if (!file) {
      return NextResponse.json({ error: "오디오 파일이 필요합니다." }, { status: 400 })
    }

    // 파일 크기 검증 (25MB 제한 - OpenAI 제한)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기가 너무 큽니다. 최대 25MB까지 지원됩니다." }, { status: 400 })
    }

    // 지원되는 파일 형식 검증
    const supportedTypes = [
      "audio/mpeg",     // MP3
      "audio/mp3",      // MP3 (일부 브라우저)
      "audio/wav",      // WAV
      "audio/x-wav",    // WAV (일부 브라우저)
      "audio/m4a",      // M4A
      "audio/x-m4a",    // M4A (일부 브라우저)
      "audio/mp4",      // M4A/MP4 오디오
      "audio/ogg",      // OGG
      "audio/webm",     // WEBM
      "audio/aac",      // AAC
      "audio/flac"      // FLAC
    ]

    console.log(`파일 형식 검증: ${file.name} (${file.type})`)

    if (!supportedTypes.includes(file.type)) {
      console.log(`지원되지 않는 파일 타입: ${file.type}`)
      return NextResponse.json({ 
        error: `지원되지 않는 파일 형식입니다. (감지된 형식: ${file.type})` 
      }, { status: 400 })
    }

    console.log(`음성 변환 시작: ${file.name} (${file.size} bytes)`)

    // OpenAI Whisper API 호출
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: language,
      response_format: "verbose_json",
      temperature: 0.2,
    })

    console.log("음성 변환 완료")

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // S3에 오디오 파일 업로드
    console.log(`S3 업로드 시작: ${file.name}`)
    const s3Key = generateS3Key(user.id, file.name)
    const audioFileUrl = await uploadToS3(file, s3Key, file.type)
    console.log(`S3 업로드 완료: ${audioFileUrl}`)

    // 데이터베이스에 음성 기록 저장
    const voiceEntry = await prisma.voiceEntry.create({
      data: {
        userId: user.id,
        type: entryType as "plan" | "reflection",
        originalText: transcription.text,
        audioFileName: file.name,
        audioFileUrl: audioFileUrl,
        audioFileSize: file.size,
        audioDuration: transcription.duration?.toString() || "0",
        language: transcription.language || language,
        confidence: transcription.segments?.[0]?.avg_logprob || null,
        recordedAt: new Date(),
      }
    })

    console.log(`음성 기록 저장 완료: ${voiceEntry.id}`)

    return NextResponse.json({
      success: true,
      id: voiceEntry.id,
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
      segments: transcription.segments,
    })
  } catch (error: any) {
    console.error("음성 변환 오류:", error)
    console.error("오류 스택:", error?.stack)
    console.error("오류 메시지:", error?.message)

    // AWS S3 에러 처리
    if (error?.name === "CredentialsProviderError" || error?.name === "InvalidAccessKeyId") {
      return NextResponse.json({ error: "AWS 자격 증명 오류입니다. 환경 변수를 확인해주세요." }, { status: 500 })
    }

    if (error?.name === "NoSuchBucket") {
      return NextResponse.json({ error: "S3 버킷을 찾을 수 없습니다. 버킷 이름을 확인해주세요." }, { status: 500 })
    }

    if (error?.message?.includes("파일 업로드에 실패했습니다")) {
      return NextResponse.json({ error: `S3 업로드 실패: ${error.message}` }, { status: 500 })
    }

    // Prisma 데이터베이스 에러 처리
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "이미 존재하는 데이터입니다." }, { status: 409 })
    }

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    // OpenAI API 에러 처리
    if (error?.error?.type === "invalid_request_error") {
      return NextResponse.json({ error: "잘못된 요청입니다. 파일 형식을 확인해주세요." }, { status: 400 })
    }

    if (error?.error?.code === "rate_limit_exceeded") {
      return NextResponse.json({ error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." }, { status: 429 })
    }

    if (error?.error?.code === "insufficient_quota") {
      return NextResponse.json({ error: "OpenAI API 할당량이 부족합니다." }, { status: 402 })
    }

    return NextResponse.json({ 
      error: "음성 변환 중 오류가 발생했습니다. 다시 시도해주세요.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}
