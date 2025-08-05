"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Play,
  Search,
  Filter,
  Calendar,
  Clock,
  FileAudio,
  Download,
  Share,
  Trash2,
  Edit,
  ArrowUpDown,
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
  recordedAt?: string // 원본 타임스탬프 추가
}

interface AllRecordsModalProps {
  isOpen: boolean
  onClose: () => void
  voiceEntries: VoiceEntry[]
  onPlayAudio: (audioUrl: string) => void
  onDeleteEntry: (entryId: string) => void
}

export default function AllRecordsModal({
  isOpen,
  onClose,
  voiceEntries,
  onPlayAudio,
  onDeleteEntry,
}: AllRecordsModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | "plan" | "reflection">("all")
  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest">("newest")
  const [selectedEntry, setSelectedEntry] = React.useState<VoiceEntry | null>(null)

  // 필터링 및 정렬된 기록
  const filteredAndSortedEntries = React.useMemo(() => {
    console.log(`=== 전체 기록 정렬 시작 ===`)
    console.log(`총 기록 수: ${voiceEntries.length}`)
    console.log(`정렬 순서: ${sortOrder}`)
    
    let filtered = voiceEntries

    // 타입 필터
    if (filterType !== "all") {
      filtered = filtered.filter((entry) => entry.type === filterType)
    }

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.fileName?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    console.log(`필터 후 기록 수: ${filtered.length}`)

    // 정렬 - recordedAt 타임스탬프 사용
    const sorted = filtered.sort((a, b) => {
      // recordedAt이 있으면 사용, 없으면 fallback
      if (a.recordedAt && b.recordedAt) {
        const timeA = new Date(a.recordedAt).getTime()
        const timeB = new Date(b.recordedAt).getTime()
        
        console.log(`Comparing: ${a.recordedAt} (${timeA}) vs ${b.recordedAt} (${timeB})`)
        
        return sortOrder === "newest" 
          ? timeB - timeA  // 최신순: 큰 값(최근) - 작은 값(과거) = 양수 (b가 앞으로)
          : timeA - timeB  // 오래된순: 작은 값(과거) - 큰 값(최근) = 음수 (a가 앞으로)
      }
      
      // fallback: 날짜/시간 문자열 조합 사용
      const dateTimeA = new Date(`${a.date}T${a.time}:00`)
      const dateTimeB = new Date(`${b.date}T${b.time}:00`)

      if (isNaN(dateTimeA.getTime()) || isNaN(dateTimeB.getTime())) {
        console.warn("Invalid date detected:", { a: `${a.date}T${a.time}:00`, b: `${b.date}T${b.time}:00` })
        return 0
      }

      return sortOrder === "newest" 
        ? dateTimeB.getTime() - dateTimeA.getTime() 
        : dateTimeA.getTime() - dateTimeB.getTime()
    })

    console.log(`정렬 후 첫 3개 기록:`)
    sorted.slice(0, 3).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.date} ${entry.time} - ${entry.text.substring(0, 30)}...`)
    })

    return sorted
  }, [voiceEntries, filterType, searchTerm, sortOrder])

  // 통계 계산
  const stats = React.useMemo(() => {
    const totalEntries = voiceEntries.length
    const planEntries = voiceEntries.filter((e) => e.type === "plan").length
    const reflectionEntries = voiceEntries.filter((e) => e.type === "reflection").length
    const totalDuration = voiceEntries.reduce((acc, entry) => {
      const [minutes, seconds] = entry.duration.split(":").map(Number)
      return acc + minutes * 60 + seconds
    }, 0)

    return {
      total: totalEntries,
      plans: planEntries,
      reflections: reflectionEntries,
      totalDurationMinutes: Math.floor(totalDuration / 60),
    }
  }, [voiceEntries])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "오늘"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제"
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5" />
            전체 기록 보기
          </DialogTitle>
          <DialogDescription>모든 음성 기록을 확인하고 관리하세요.</DialogDescription>
        </DialogHeader>

        {/* 통계 섹션 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
              <div className="text-sm text-gray-500">총 기록</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.plans}</div>
              <div className="text-sm text-gray-500">계획</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.reflections}</div>
              <div className="text-sm text-gray-500">회고</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalDurationMinutes}</div>
              <div className="text-sm text-gray-500">총 시간(분)</div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="기록 내용이나 파일명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value: "all" | "plan" | "reflection") => setFilterType(value)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="plan">계획</SelectItem>
              <SelectItem value="reflection">회고</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              const newOrder = sortOrder === "newest" ? "oldest" : "newest"
              console.log(`정렬 순서 변경: ${sortOrder} → ${newOrder}`)
              setSortOrder(newOrder)
            }}
            className="w-full sm:w-auto"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortOrder === "newest" ? "최신순" : "오래된순"}
          </Button>
        </div>

        {/* 기록 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {filteredAndSortedEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">기록이 없습니다</p>
              <p className="text-sm">
                {searchTerm || filterType !== "all" ? "검색 조건을 변경해보세요." : "첫 번째 음성 기록을 만들어보세요!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={entry.type === "plan" ? "default" : "secondary"}>
                          {entry.type === "plan" ? "계획" : "회고"}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.date)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {entry.time}
                        </div>
                        <span className="text-sm text-gray-500">{entry.duration}</span>
                        {entry.language && (
                          <Badge variant="outline" className="text-xs">
                            {entry.language === "ko" ? "한국어" : entry.language}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.audioUrl && (
                          <Button variant="ghost" size="icon" onClick={() => onPlayAudio(entry.audioUrl!)} title="재생">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(entry)} title="상세보기">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteEntry(entry.id)}
                          title="삭제"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-900 line-clamp-3">{entry.text}</p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-400">
                      {entry.fileName && <span>파일: {entry.fileName}</span>}
                      {entry.fileSize && <span>크기: {entry.fileSize}</span>}
                      <span className="text-green-600">✓ AI 변환 완료</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 상세보기 모달 */}
        {selectedEntry && (
          <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge variant={selectedEntry.type === "plan" ? "default" : "secondary"}>
                    {selectedEntry.type === "plan" ? "계획" : "회고"}
                  </Badge>
                  {formatDate(selectedEntry.date)} {selectedEntry.time}
                </DialogTitle>
                <DialogDescription>
                  {selectedEntry.fileName && `파일: ${selectedEntry.fileName}`}
                  {selectedEntry.fileSize && ` • 크기: ${selectedEntry.fileSize}`}
                  {` • 길이: ${selectedEntry.duration}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Textarea
                  value={selectedEntry.text}
                  readOnly
                  className="min-h-[200px] resize-none"
                  placeholder="변환된 텍스트가 여기에 표시됩니다..."
                />

                <div className="flex gap-2">
                  {selectedEntry.audioUrl && (
                    <Button onClick={() => onPlayAudio(selectedEntry.audioUrl!)} variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      재생
                    </Button>
                  )}
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                  <Button variant="outline">
                    <Share className="w-4 h-4 mr-2" />
                    공유
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
