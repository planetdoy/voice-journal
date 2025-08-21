"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  Target, 
  CheckCircle, 
  Circle, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface Goal {
  id: string
  text: string
  completed: boolean
  priority: "low" | "medium" | "high"
  category?: string | null
  estimatedMinutes?: number | null
  targetDate: string
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

interface GroupedGoals {
  date: string
  goals: Goal[]
  totalCount: number
  completedCount: number
  completionRate: number
}

interface GoalHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onTransferGoals?: (goalIds: string[]) => void
}

export default function GoalHistoryModal({ isOpen, onClose, onTransferGoals }: GoalHistoryModalProps) {
  const [period, setPeriod] = useState<"week" | "month" | "all">("week")
  const [groupedGoals, setGroupedGoals] = useState<GroupedGoals[]>([])
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    completionRate: 0,
    periodLabel: "최근 7일"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [expandedDates, setExpandedDates] = useState<string[]>([])
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<{id: string, text: string} | null>(null)

  // 목표 히스토리 불러오기
  const fetchGoalHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/goals/history?period=${period}`)
      if (!response.ok) throw new Error("Failed to fetch goal history")
      
      const result = await response.json()
      if (result.success) {
        console.log("목표 히스토리 응답:", result.data)
        console.log("그룹화된 목표:", result.data.groupedGoals)
        setGroupedGoals(result.data.groupedGoals)
        setStats(result.data.stats)
        // 모든 날짜를 펼친 상태로 시작
        setExpandedDates(result.data.groupedGoals.map((g: GroupedGoals) => g.date))
      }
    } catch (error) {
      console.error("목표 히스토리 로드 오류:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchGoalHistory()
      setSelectedGoals([])
    }
  }, [isOpen, period])

  // 목표 선택 토글
  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  // 날짜 섹션 토글
  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    )
  }

  // 미완료 목표만 선택 (오늘 날짜 제외)
  const selectAllPendingGoals = () => {
    const today = new Date().toISOString().split('T')[0]
    const pendingGoalIds = groupedGoals.flatMap(group => 
      group.date !== today 
        ? group.goals.filter(goal => !goal.completed).map(goal => goal.id)
        : []
    )
    setSelectedGoals(pendingGoalIds)
  }

  // 목표 삭제
  const handleDeleteGoal = async (goalId: string, goalText: string) => {
    setGoalToDelete({ id: goalId, text: goalText })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!goalToDelete) return
    
    setDeletingGoalId(goalToDelete.id)
    setShowDeleteConfirm(false)
    
    try {
      const response = await fetch(`/api/goals/${goalToDelete.id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete goal")
      
      const result = await response.json()
      if (result.success) {
        // 목록에서 제거
        setGroupedGoals(prev => {
          return prev.map(group => ({
            ...group,
            goals: group.goals.filter(g => g.id !== goalToDelete.id),
            totalCount: group.goals.filter(g => g.id !== goalToDelete.id).length,
            completedCount: group.goals.filter(g => g.id !== goalToDelete.id && g.completed).length,
            completionRate: group.goals.filter(g => g.id !== goalToDelete.id).length > 0
              ? Math.round((group.goals.filter(g => g.id !== goalToDelete.id && g.completed).length / group.goals.filter(g => g.id !== goalToDelete.id).length) * 100)
              : 0
          })).filter(group => group.goals.length > 0)
        })
        
        // 통계 업데이트
        setStats(prev => ({
          ...prev,
          totalGoals: prev.totalGoals - 1,
          completedGoals: groupedGoals.flatMap(g => g.goals).find(g => g.id === goalToDelete.id)?.completed 
            ? prev.completedGoals - 1 
            : prev.completedGoals,
          pendingGoals: !groupedGoals.flatMap(g => g.goals).find(g => g.id === goalToDelete.id)?.completed
            ? prev.pendingGoals - 1
            : prev.pendingGoals,
          completionRate: (prev.totalGoals - 1) > 0
            ? Math.round(((groupedGoals.flatMap(g => g.goals).find(g => g.id === goalToDelete.id)?.completed ? prev.completedGoals - 1 : prev.completedGoals) / (prev.totalGoals - 1)) * 100)
            : 0
        }))
      }
    } catch (error) {
      console.error("목표 삭제 오류:", error)
    } finally {
      setDeletingGoalId(null)
      setGoalToDelete(null)
    }
  }

  // 선택한 목표 오늘로 이관
  const handleTransferToToday = async () => {
    if (selectedGoals.length === 0) return

    try {
      const response = await fetch("/api/goals/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalIds: selectedGoals })
      })

      if (!response.ok) throw new Error("Failed to transfer goals")
      
      const result = await response.json()
      if (result.success) {
        onTransferGoals?.(selectedGoals)
        setSelectedGoals([])
        fetchGoalHistory() // 목록 새로고침
      }
    } catch (error) {
      console.error("목표 이관 오류:", error)
    }
  }

  const priorityConfig = {
    high: { label: "높음", color: "destructive" },
    medium: { label: "중간", color: "default" },
    low: { label: "낮음", color: "secondary" }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            목표 히스토리
          </DialogTitle>
          <DialogDescription>
            지난 목표들을 확인하고 미완료 목표를 오늘로 이관할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">최근 7일</TabsTrigger>
            <TabsTrigger value="month">최근 30일</TabsTrigger>
            <TabsTrigger value="all">전체</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* 통계 카드 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {stats.periodLabel} 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats.totalGoals}</p>
                    <p className="text-xs text-gray-500">전체 목표</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.completedGoals}</p>
                    <p className="text-xs text-gray-500">완료</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingGoals}</p>
                    <p className="text-xs text-gray-500">미완료</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
                    <p className="text-xs text-gray-500">달성률</p>
                  </div>
                </div>
                <Progress value={stats.completionRate} className="mt-3 h-2" />
              </CardContent>
            </Card>

            {/* 미완료 목표 이관 도구 */}
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const pastPendingGoals = groupedGoals
                .filter(group => group.date !== today)
                .reduce((sum, group) => sum + group.goals.filter(g => !g.completed).length, 0)
              
              return pastPendingGoals > 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>과거 미완료 목표가 {pastPendingGoals}개 있습니다.</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllPendingGoals}
                      >
                        모두 선택
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleTransferToToday}
                        disabled={selectedGoals.length === 0}
                      >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        오늘로 이관 ({selectedGoals.length})
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null
            })()}

            {/* 목표 목록 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* 디버깅 정보 */}
                {groupedGoals.length > 0 && (
                  <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded mb-2">
                    조회된 날짜 그룹: {groupedGoals.length}개, 
                    전체 목표: {stats.totalGoals}개 (완료: {stats.completedGoals}, 미완료: {stats.pendingGoals})
                  </div>
                )}
                {groupedGoals.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">이 기간에 설정한 목표가 없습니다.</p>
                    </CardContent>
                  </Card>
                ) : (
              <div className="space-y-3">
                {groupedGoals.map((group) => (
                  <Card key={group.date}>
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleDateExpansion(group.date)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">
                            {format(new Date(group.date), "M월 d일 (EEEEE)", { locale: ko })}
                            {group.date === new Date().toISOString().split('T')[0] && (
                              <span className="ml-2 text-xs text-blue-600 font-normal">(오늘)</span>
                            )}
                          </CardTitle>
                          <Badge variant="outline">
                            {group.completedCount}/{group.totalCount}
                          </Badge>
                          <Progress 
                            value={group.completionRate} 
                            className="w-20 h-2"
                          />
                        </div>
                        {expandedDates.includes(group.date) ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                    
                    {expandedDates.includes(group.date) && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {group.goals.map((goal) => (
                            <div
                              key={goal.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                goal.completed ? "bg-gray-50" : "bg-white"
                              }`}
                            >
                              {!goal.completed && (
                                <Checkbox
                                  checked={selectedGoals.includes(goal.id)}
                                  onCheckedChange={() => toggleGoalSelection(goal.id)}
                                  className="mt-0.5"
                                  disabled={group.date === new Date().toISOString().split('T')[0]}
                                />
                              )}
                              
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${goal.completed ? "line-through text-gray-400" : ""}`}>
                                    {goal.text}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:bg-red-50"
                                    onClick={() => handleDeleteGoal(goal.id, goal.text)}
                                    disabled={deletingGoalId === goal.id}
                                  >
                                    {deletingGoalId === goal.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    )}
                                  </Button>
                                </div>
                                
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  {goal.completed ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                      완료됨
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Circle className="w-3 h-3" />
                                      미완료
                                    </span>
                                  )}
                                </div>
                                
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
                )}
              </>
            )}
          </div>
        </Tabs>
        
        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>목표 삭제 확인</DialogTitle>
              <DialogDescription>
                다음 목표를 삭제하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">{goalToDelete?.text}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                삭제
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}