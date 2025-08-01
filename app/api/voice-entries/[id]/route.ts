import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { deleteFromS3 } from "@/lib/s3"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const voiceEntry = await prisma.voiceEntry.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!voiceEntry) {
      return NextResponse.json({ error: "음성 기록을 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: voiceEntry
    })

  } catch (error: any) {
    console.error("음성 기록 조회 오류:", error)
    return NextResponse.json({ error: "음성 기록을 불러오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const {
      title,
      editedText,
      keywords,
      mood,
      completed
    } = body

    // 기존 기록 확인
    const existingEntry = await prisma.voiceEntry.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "음성 기록을 찾을 수 없습니다." }, { status: 404 })
    }

    // 업데이트할 데이터 구성
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (editedText !== undefined) updateData.editedText = editedText
    if (keywords !== undefined) updateData.keywords = keywords
    if (mood !== undefined) updateData.mood = mood
    if (completed !== undefined) updateData.completed = completed

    const updatedEntry = await prisma.voiceEntry.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: "음성 기록이 업데이트되었습니다."
    })

  } catch (error: any) {
    console.error("음성 기록 업데이트 오류:", error)

    if (error?.code?.startsWith("P")) {
      return NextResponse.json({ error: "데이터베이스 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ error: "음성 기록을 업데이트하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 삭제할 음성 기록 조회
    const voiceEntry = await prisma.voiceEntry.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!voiceEntry) {
      return NextResponse.json({ error: "음성 기록을 찾을 수 없거나 삭제 권한이 없습니다." }, { status: 404 })
    }

    // S3에서 오디오 파일 삭제
    try {
      const s3Key = voiceEntry.audioFileUrl.split('.amazonaws.com/')[1]
      if (s3Key) {
        await deleteFromS3(s3Key)
        console.log(`S3 파일 삭제 완료: ${s3Key}`)
      }
    } catch (s3Error) {
      console.error("S3 파일 삭제 오류:", s3Error)
      // S3 삭제 실패해도 데이터베이스 삭제는 진행
    }

    // 데이터베이스에서 음성 기록 삭제
    await prisma.voiceEntry.delete({
      where: { id: params.id }
    })

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