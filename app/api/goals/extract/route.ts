import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { trackTokenUsage } from "@/lib/token-tracker"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const { text, targetDate } = await request.json()
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "분석할 텍스트가 필요합니다." }, { status: 400 })
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    console.log("목표 추출 시작:", text.substring(0, 100) + "...")

    // 텍스트가 길 경우 먼저 요약 처리
    let processedText = text
    if (text.length > 500) {
      console.log("긴 텍스트 감지, 요약 진행 중...")
      
      const summaryPrompt = `다음 텍스트를 핵심 계획과 목표 중심으로 간결하게 요약해주세요. 구체적인 할 일과 행동 계획을 중심으로 정리하되, 불필요한 설명은 제거하세요:

${text}`

      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: summaryPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })

      processedText = summaryCompletion.choices[0].message.content || text
      console.log("요약 완료:", processedText.substring(0, 100) + "...")
      
      // 요약 토큰 사용량 추적
      try {
        await trackTokenUsage({
          userId: user.id,
          endpoint: "goals/extract/summary",
          model: "gpt-4o-mini",
          inputText: summaryPrompt,
          outputText: processedText,
          metadata: {
            originalLength: text.length,
            summaryLength: processedText.length
          }
        })
      } catch (trackingError) {
        console.error("요약 토큰 사용량 추적 실패:", trackingError)
      }
    }

    // 시스템 프롬프트 준비
    const systemPrompt = `당신은 사용자의 계획 텍스트에서 구체적인 할 일(목표)을 추출하는 전문가입니다.
          
규칙:
1. 텍스트에서 구체적인 행동이나 할 일만 추출합니다
2. 각 목표는 명확하고 실행 가능해야 합니다
3. 중복되는 내용은 제거합니다
4. 각 목표에 적절한 우선순위(high/medium/low)를 지정합니다
5. 가능하면 카테고리(work/personal/health/study/other)를 지정합니다
6. 예상 소요 시간을 분 단위로 추정합니다 (선택사항)
7. 최대 10개까지만 추출합니다

응답 형식 (JSON):
{
  "goals": [
    {
      "text": "목표 내용",
      "priority": "high|medium|low",
      "category": "work|personal|health|study|other",
      "estimatedMinutes": 30
    }
  ]
}`
    
    const userPrompt = `다음 계획에서 구체적인 목표들을 추출해주세요:\n\n${processedText}`

    // OpenAI를 사용하여 텍스트에서 목표 추출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    })

    const responseText = completion.choices[0].message.content || '{"goals": []}'
    const result = JSON.parse(responseText)
    const extractedGoals = result.goals || []

    console.log(`${extractedGoals.length}개의 목표 추출됨`)

    // 목표 날짜 설정 - 항상 오늘 날짜로 저장
    const goalTargetDate = new Date() // 오늘 날짜로 고정
    goalTargetDate.setHours(23, 59, 59, 999)

    // 토큰 사용량 추적
    try {
      await trackTokenUsage({
        userId: user.id,
        endpoint: "goals/extract",
        model: "gpt-4o-mini",
        inputText: systemPrompt + userPrompt,
        outputText: responseText,
        metadata: {
          goalsExtracted: extractedGoals.length,
          targetDate: goalTargetDate.toISOString(),
          originalTextLength: text.length,
          processedTextLength: processedText.length,
          wasSummarized: text.length > 500
        }
      })
    } catch (trackingError) {
      console.error("토큰 사용량 추적 실패:", trackingError)
    }

    // 추출된 목표들을 데이터베이스에 저장
    const savedGoals = []
    for (const goal of extractedGoals) {
      try {
        const newGoal = await prisma.goal.create({
          data: {
            userId: user.id,
            text: goal.text,
            priority: goal.priority || "medium",
            category: goal.category || null,
            estimatedMinutes: goal.estimatedMinutes || null,
            targetDate: goalTargetDate
          }
        })
        savedGoals.push(newGoal)
        console.log(`목표 저장: ${newGoal.text}`)
      } catch (error) {
        console.error(`목표 저장 실패: ${goal.text}`, error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        extracted: extractedGoals,
        saved: savedGoals
      },
      message: `${savedGoals.length}개의 목표가 추가되었습니다.`
    })

  } catch (error: any) {
    console.error("목표 추출 오류:", error)

    if (error?.error?.type === "invalid_request_error") {
      return NextResponse.json({ 
        error: "OpenAI API 요청이 잘못되었습니다.",
        details: error.error.message 
      }, { status: 400 })
    }

    if (error?.error?.code === "rate_limit_exceeded") {
      return NextResponse.json({ 
        error: "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." 
      }, { status: 429 })
    }

    return NextResponse.json({ 
      error: "목표 추출 중 오류가 발생했습니다.",
      details: error?.message || "알 수 없는 오류"
    }, { status: 500 })
  }
}