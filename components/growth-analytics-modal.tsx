"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Clock,
  Award,
  Zap,
  Brain,
  Heart,
  Activity,
  PieChart,
  LineChart,
  Download,
  Share,
} from "lucide-react"

interface VoiceEntry {
  id: string
  type: "plan" | "reflection"
  date: string
  time: string
  duration: string
  text: string
  audioUrl?: string
  fileName?: string
  fileSize?: string
  completed?: boolean
  language?: string
  confidence?: number
}

interface DailyGoal {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

interface GrowthAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  voiceEntries: VoiceEntry[]
  dailyGoals: DailyGoal[]
}

export default function GrowthAnalyticsModal({ isOpen, onClose, voiceEntries, dailyGoals }: GrowthAnalyticsModalProps) {
  // 분석 데이터 계산
  const analytics = React.useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 기본 통계
    const totalEntries = voiceEntries.length
    const planEntries = voiceEntries.filter((e) => e.type === "plan").length
    const reflectionEntries = voiceEntries.filter((e) => e.type === "reflection").length

    // 최근 30일 데이터
    const recentEntries = voiceEntries.filter((entry) => new Date(entry.date) >= thirtyDaysAgo)
    const recentGoals = dailyGoals.filter((goal) => new Date(goal.createdAt) >= thirtyDaysAgo)

    // 주간 비교
    const thisWeekEntries = voiceEntries.filter((entry) => new Date(entry.date) >= sevenDaysAgo)
    const lastWeekEntries = voiceEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate >= new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && entryDate < sevenDaysAgo
    })

    // 연속 기록 일수 계산
    const sortedDates = [...new Set(voiceEntries.map((e) => e.date))].sort().reverse()
    let currentStreak = 0
    let maxStreak = 0
    let tempStreak = 0

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)

      if (currentDate.toDateString() === expectedDate.toDateString()) {
        tempStreak++
        if (i === 0) currentStreak = tempStreak
      } else {
        maxStreak = Math.max(maxStreak, tempStreak)
        tempStreak = 0
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak)

    // 목표 달성률 계산
    const completedGoals = dailyGoals.filter((g) => g.completed).length
    const goalCompletionRate = dailyGoals.length > 0 ? (completedGoals / dailyGoals.length) * 100 : 0

    // 주간 성장률
    const weeklyGrowth =
      lastWeekEntries.length > 0
        ? ((thisWeekEntries.length - lastWeekEntries.length) / lastWeekEntries.length) * 100
        : thisWeekEntries.length > 0
          ? 100
          : 0

    // 시간대별 활동 패턴
    const hourlyActivity = Array(24).fill(0)
    voiceEntries.forEach((entry) => {
      const hour = Number.parseInt(entry.time.split(":")[0])
      hourlyActivity[hour]++
    })

    // 요일별 활동 패턴
    const weeklyActivity = Array(7).fill(0)
    voiceEntries.forEach((entry) => {
      const dayOfWeek = new Date(entry.date).getDay()
      weeklyActivity[dayOfWeek]++
    })

    // 월별 트렌드 (최근 6개월)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthEntries = voiceEntries.filter((entry) => {
        const entryDate = new Date(entry.date)
        return entryDate >= monthDate && entryDate < nextMonthDate
      })
      monthlyTrend.push({
        month: monthDate.toLocaleDateString("ko-KR", { month: "short" }),
        count: monthEntries.length,
        plans: monthEntries.filter((e) => e.type === "plan").length,
        reflections: monthEntries.filter((e) => e.type === "reflection").length,
      })
    }

    // 키워드 분석 (간단한 버전)
    const allText = voiceEntries.map((e) => e.text).join(" ")
    const commonWords = ["목표", "계획", "성장", "발전", "개선", "노력", "성취", "도전", "학습", "경험"]
    const wordFrequency = commonWords
      .map((word) => ({
        word,
        count: (allText.match(new RegExp(word, "g")) || []).length,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      totalEntries,
      planEntries,
      reflectionEntries,
      recentEntries: recentEntries.length,
      currentStreak,
      maxStreak,
      goalCompletionRate,
      weeklyGrowth,
      hourlyActivity,
      weeklyActivity,
      monthlyTrend,
      wordFrequency,
      avgEntriesPerWeek: recentEntries.length / 4,
      mostActiveHour: hourlyActivity.indexOf(Math.max(...hourlyActivity)),
      mostActiveDay: ["일", "월", "화", "수", "목", "금", "토"][weeklyActivity.indexOf(Math.max(...weeklyActivity))],
    }
  }, [voiceEntries, dailyGoals])

  const getGrowthInsights = () => {
    const insights = []

    if (analytics.currentStreak >= 7) {
      insights.push({
        type: "positive",
        icon: <Award className="w-5 h-5" />,
        title: "연속 기록 달성!",
        description: `${analytics.currentStreak}일 연속으로 기록하고 있어요. 훌륭합니다!`,
      })
    }

    if (analytics.weeklyGrowth > 20) {
      insights.push({
        type: "positive",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "활동량 증가",
        description: `이번 주 기록이 지난 주보다 ${Math.round(analytics.weeklyGrowth)}% 증가했어요.`,
      })
    } else if (analytics.weeklyGrowth < -20) {
      insights.push({
        type: "warning",
        icon: <TrendingDown className="w-5 h-5" />,
        title: "활동량 감소",
        description: `이번 주 기록이 지난 주보다 ${Math.abs(Math.round(analytics.weeklyGrowth))}% 감소했어요.`,
      })
    }

    if (analytics.goalCompletionRate >= 80) {
      insights.push({
        type: "positive",
        icon: <Target className="w-5 h-5" />,
        title: "목표 달성 우수",
        description: `목표 달성률이 ${Math.round(analytics.goalCompletionRate)}%로 매우 높아요!`,
      })
    }

    if (analytics.mostActiveHour >= 21 || analytics.mostActiveHour <= 6) {
      insights.push({
        type: "info",
        icon: <Clock className="w-5 h-5" />,
        title: "야간 활동 패턴",
        description: `주로 ${analytics.mostActiveHour}시에 기록하시는군요. 규칙적인 패턴이 좋아요!`,
      })
    }

    return insights
  }

  const insights = getGrowthInsights()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            성장 분석 대시보드
          </DialogTitle>
          <DialogDescription>당신의 성장 패턴을 분석하고 인사이트를 제공합니다.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="patterns">패턴 분석</TabsTrigger>
            <TabsTrigger value="trends">트렌드</TabsTrigger>
            <TabsTrigger value="insights">인사이트</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-6">
              {/* 핵심 지표 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.totalEntries}</div>
                    <div className="text-sm text-gray-500">총 기록</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.currentStreak}</div>
                    <div className="text-sm text-gray-500">연속 기록 일수</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.round(analytics.goalCompletionRate)}%</div>
                    <div className="text-sm text-gray-500">목표 달성률</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.weeklyGrowth > 0 ? "+" : ""}
                      {Math.round(analytics.weeklyGrowth)}%
                    </div>
                    <div className="text-sm text-gray-500">주간 성장률</div>
                  </CardContent>
                </Card>
              </div>

              {/* 계획 vs 회고 비율 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    기록 유형 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>계획 ({analytics.planEntries}개)</span>
                        <span>{Math.round((analytics.planEntries / analytics.totalEntries) * 100)}%</span>
                      </div>
                      <Progress value={(analytics.planEntries / analytics.totalEntries) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>회고 ({analytics.reflectionEntries}개)</span>
                        <span>{Math.round((analytics.reflectionEntries / analytics.totalEntries) * 100)}%</span>
                      </div>
                      <Progress value={(analytics.reflectionEntries / analytics.totalEntries) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 성장 인사이트 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI 성장 인사이트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          insight.type === "positive"
                            ? "bg-green-50 border border-green-200"
                            : insight.type === "warning"
                              ? "bg-yellow-50 border border-yellow-200"
                              : "bg-blue-50 border border-blue-200"
                        }`}
                      >
                        <div
                          className={`${
                            insight.type === "positive"
                              ? "text-green-600"
                              : insight.type === "warning"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        >
                          {insight.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <p className="text-sm text-gray-600">{insight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-6">
              {/* 시간대별 활동 패턴 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    시간대별 활동 패턴
                  </CardTitle>
                  <CardDescription>가장 활발한 시간: {analytics.mostActiveHour}시</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.hourlyActivity.map((count, hour) => (
                      <div key={hour} className="flex items-center gap-3">
                        <div className="w-12 text-sm text-gray-500">{hour.toString().padStart(2, "0")}시</div>
                        <div className="flex-1">
                          <Progress
                            value={count > 0 ? (count / Math.max(...analytics.hourlyActivity)) * 100 : 0}
                            className="h-2"
                          />
                        </div>
                        <div className="w-8 text-sm text-gray-600">{count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 요일별 활동 패턴 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    요일별 활동 패턴
                  </CardTitle>
                  <CardDescription>가장 활발한 요일: {analytics.mostActiveDay}요일</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                      <div key={day} className="flex items-center gap-3">
                        <div className="w-8 text-sm text-gray-500">{day}</div>
                        <div className="flex-1">
                          <Progress
                            value={
                              analytics.weeklyActivity[index] > 0
                                ? (analytics.weeklyActivity[index] / Math.max(...analytics.weeklyActivity)) * 100
                                : 0
                            }
                            className="h-3"
                          />
                        </div>
                        <div className="w-8 text-sm text-gray-600">{analytics.weeklyActivity[index]}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              {/* 월별 트렌드 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    월별 기록 트렌드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.monthlyTrend.map((month, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{month.month}</span>
                          <span className="text-sm text-gray-500">총 {month.count}개</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">
                              계획
                            </Badge>
                            <Progress
                              value={month.count > 0 ? (month.plans / month.count) * 100 : 0}
                              className="h-2 flex-1"
                            />
                            <span className="text-xs text-gray-500">{month.plans}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              회고
                            </Badge>
                            <Progress
                              value={month.count > 0 ? (month.reflections / month.count) * 100 : 0}
                              className="h-2 flex-1"
                            />
                            <span className="text-xs text-gray-500">{month.reflections}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 성장 지표 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    성장 지표
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">최대 연속 기록</span>
                        <span className="font-semibold">{analytics.maxStreak}일</span>
                      </div>
                      <Progress value={(analytics.maxStreak / 30) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">주평균 기록</span>
                        <span className="font-semibold">{Math.round(analytics.avgEntriesPerWeek)}개</span>
                      </div>
                      <Progress value={(analytics.avgEntriesPerWeek / 7) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* 키워드 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    자주 사용하는 키워드
                  </CardTitle>
                  <CardDescription>당신의 관심사와 목표를 분석했습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.wordFrequency.slice(0, 8).map((word, index) => (
                      <div key={word.word} className="flex items-center gap-3">
                        <div className="w-16 text-sm text-gray-500">#{index + 1}</div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{word.word}</span>
                            <span className="text-sm text-gray-500">{word.count}회</span>
                          </div>
                          <Progress
                            value={word.count > 0 ? (word.count / analytics.wordFrequency[0].count) * 100 : 0}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 성장 추천사항 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    AI 성장 추천
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.currentStreak < 7 && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">연속 기록 도전</h4>
                          <p className="text-sm text-blue-700">
                            7일 연속 기록을 목표로 해보세요. 현재 {analytics.currentStreak}일째입니다!
                          </p>
                        </div>
                      </div>
                    )}

                    {analytics.planEntries < analytics.reflectionEntries && (
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-purple-900">계획 세우기 늘리기</h4>
                          <p className="text-sm text-purple-700">
                            회고보다 계획을 더 많이 세워보세요. 미래 지향적 사고가 성장을 가속화합니다.
                          </p>
                        </div>
                      </div>
                    )}

                    {analytics.goalCompletionRate < 70 && (
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <Award className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-900">목표 달성률 개선</h4>
                          <p className="text-sm text-orange-700">
                            현재 목표 달성률이 {Math.round(analytics.goalCompletionRate)}%입니다. 더 구체적이고 달성
                            가능한 목표를 설정해보세요.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Heart className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">꾸준함이 핵심</h4>
                        <p className="text-sm text-green-700">
                          매일 조금씩이라도 기록하는 것이 큰 변화를 만듭니다.
                          {analytics.mostActiveHour}시경이 가장 활발한 시간이니 이 시간을 활용해보세요!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" />
            성과 공유
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
