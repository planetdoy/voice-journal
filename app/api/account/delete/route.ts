import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFromS3 } from "@/lib/s3"

export async function DELETE() {
  try {
    console.log("=== 계정 삭제 요청 시작 ===")
    
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

    console.log(`계정 삭제 시작: ${user.email} (ID: ${user.id})`)

    // S3에서 음성 파일들 삭제
    try {
      const voiceEntries = await prisma.voiceEntry.findMany({
        where: { userId: user.id },
        select: { audioFileUrl: true }
      })

      for (const entry of voiceEntries) {
        if (entry.audioFileUrl) {
          try {
            // S3 URL에서 키 추출
            const url = new URL(entry.audioFileUrl)
            const key = url.pathname.substring(1) // 첫 번째 '/' 제거
            await deleteFromS3(key)
            console.log(`S3 파일 삭제 완료: ${key}`)
          } catch (s3Error) {
            console.error("S3 파일 삭제 실패:", s3Error)
            // S3 삭제 실패해도 계정 삭제는 계속 진행
          }
        }
      }
    } catch (s3Error) {
      console.error("S3 파일 삭제 중 오류:", s3Error)
    }

    // 데이터베이스에서 사용자 데이터 삭제 (순서 중요 - 외래키 제약조건)
    await prisma.$transaction(async (tx: any) => {
      // 1. Goal 삭제
      const goalCount = await tx.goal.deleteMany({
        where: { userId: user.id }
      })
      console.log(`Goal 삭제: ${goalCount.count}개`)

      // 2. VoiceEntry 삭제
      const voiceEntryCount = await tx.voiceEntry.deleteMany({
        where: { userId: user.id }
      })
      console.log(`VoiceEntry 삭제: ${voiceEntryCount.count}개`)

      // 3. Session 삭제
      const sessionCount = await tx.session.deleteMany({
        where: { userId: user.id }
      })
      console.log(`Session 삭제: ${sessionCount.count}개`)

      // 4. Account 삭제 (소셜 로그인 연동)
      const accountCount = await tx.account.deleteMany({
        where: { userId: user.id }
      })
      console.log(`Account 삭제: ${accountCount.count}개`)

      // 5. 마지막으로 User 삭제
      await tx.user.delete({
        where: { id: user.id }
      })
      console.log(`User 삭제 완료: ${user.email}`)
    })

    console.log("=== 계정 삭제 완료 ===")

    return NextResponse.json({
      success: true,
      message: "계정이 성공적으로 삭제되었습니다."
    })

  } catch (error: any) {
    console.error("계정 삭제 오류:", error)
    console.error("오류 스택:", error?.stack)

    // Prisma 오류 처리
    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ 
        error: "데이터베이스 오류가 발생했습니다.",
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "계정 삭제 중 오류가 발생했습니다.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}