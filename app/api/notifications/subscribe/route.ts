import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Push 알림 구독
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = await request.json()

    // Push 구독 정보 저장
    await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: {
        pushEnabled: true,
        pushSubscription: subscription
      },
      create: {
        userId: user.id,
        pushEnabled: true,
        pushSubscription: subscription
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Push notifications subscribed successfully" 
    })
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error)
    return NextResponse.json(
      { error: "Failed to subscribe to push notifications" },
      { status: 500 }
    )
  }
}

// DELETE: Push 알림 구독 취소
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Push 구독 정보 삭제
    await prisma.notificationSettings.update({
      where: { userId: user.id },
      data: {
        pushEnabled: false,
        pushSubscription: null as any
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Push notifications unsubscribed successfully" 
    })
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error)
    return NextResponse.json(
      { error: "Failed to unsubscribe from push notifications" },
      { status: 500 }
    )
  }
}