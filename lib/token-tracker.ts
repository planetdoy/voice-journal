import { prisma } from "@/lib/prisma"
import { encoding_for_model } from "tiktoken"

// 토큰 계산 함수
export function countTokens(text: string, model: string = "gpt-4o-mini"): number {
  try {
    // GPT-4o-mini는 gpt-4o와 같은 인코딩 사용
    const encoding = encoding_for_model("gpt-4o")
    const tokens = encoding.encode(text)
    const count = tokens.length
    encoding.free()
    return count
  } catch (error) {
    // 폴백: 대략적인 추정 (4 characters ≈ 1 token)
    console.error("Token counting error:", error)
    return Math.ceil(text.length / 4)
  }
}

// 비용 계산 함수
export function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o-mini": {
      input: 0.15 / 1_000_000,  // $0.15 per 1M tokens
      output: 0.60 / 1_000_000, // $0.60 per 1M tokens
    },
    "whisper-1": {
      input: 0.006 / 60,  // $0.006 per minute (approximate)
      output: 0,
    },
  }

  const modelPricing = pricing[model] || pricing["gpt-4o-mini"]
  return (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output)
}

// 토큰 사용량 기록 함수
export async function trackTokenUsage({
  userId,
  endpoint,
  model,
  inputText,
  outputText,
  metadata,
}: {
  userId: string
  endpoint: string
  model: string
  inputText?: string
  outputText?: string
  metadata?: any
}) {
  try {
    const inputTokens = inputText ? countTokens(inputText, model) : 0
    const outputTokens = outputText ? countTokens(outputText, model) : 0
    const totalTokens = inputTokens + outputTokens
    const cost = calculateCost(inputTokens, outputTokens, model)

    const usage = await prisma.tokenUsage.create({
      data: {
        userId,
        endpoint,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        metadata,
      },
    })

    console.log(`Token usage tracked: ${endpoint} - ${totalTokens} tokens - $${cost.toFixed(6)}`)
    return usage
  } catch (error) {
    console.error("Failed to track token usage:", error)
    // 실패해도 앱 동작에는 영향 없도록
  }
}

// 일일 사용량 조회 함수
export async function getDailyUsage(date?: Date) {
  const targetDate = date || new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const usages = await prisma.tokenUsage.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // 사용자별 집계
  const userSummary = usages.reduce((acc, usage) => {
    const userEmail = usage.user.email
    if (!acc[userEmail]) {
      acc[userEmail] = {
        name: usage.user.name || "Unknown",
        email: userEmail,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        endpoints: {} as Record<string, number>,
        models: {} as Record<string, number>,
      }
    }

    acc[userEmail].totalInputTokens += usage.inputTokens
    acc[userEmail].totalOutputTokens += usage.outputTokens
    acc[userEmail].totalTokens += usage.totalTokens
    acc[userEmail].totalCost += usage.cost

    // 엔드포인트별 카운트
    acc[userEmail].endpoints[usage.endpoint] = 
      (acc[userEmail].endpoints[usage.endpoint] || 0) + 1

    // 모델별 카운트
    acc[userEmail].models[usage.model] = 
      (acc[userEmail].models[usage.model] || 0) + 1

    return acc
  }, {} as Record<string, any>)

  // 전체 집계
  const totalSummary = {
    date: targetDate.toISOString().split("T")[0],
    totalUsers: Object.keys(userSummary).length,
    totalRequests: usages.length,
    totalInputTokens: usages.reduce((sum, u) => sum + u.inputTokens, 0),
    totalOutputTokens: usages.reduce((sum, u) => sum + u.outputTokens, 0),
    totalTokens: usages.reduce((sum, u) => sum + u.totalTokens, 0),
    totalCost: usages.reduce((sum, u) => sum + u.cost, 0),
    userSummary: Object.values(userSummary),
  }

  return totalSummary
}