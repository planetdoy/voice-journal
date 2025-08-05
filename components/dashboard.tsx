"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Mic,
  History,
  Target,
  TrendingUp,
  Calendar,
  Play,
  Pause,
  Settings,
  LogOut,
  ArrowLeft,
  Plus,
  CheckCircle,
  Circle,
  Upload,
  FileAudio,
  X,
  Loader2,
  AlertCircle,
  Volume2,
  Edit,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
// 임포트에 AllRecordsModal 추가
import AllRecordsModal from "./all-records-modal"
// 임포트에 AccountSettingsModal 추가
import AccountSettingsModal from "./account-settings-modal"

interface DashboardProps {
  user: { name: string; email: string } | null
  onBackToLanding: () => void
  onLogout: () => void
}

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

interface DailyGoal {
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

interface UploadedFile {
  file: File
  url: string
  duration: string
}

interface TranscriptionResult {
  success: boolean
  text: string
  language?: string
  duration?: number
  segments?: any[]
  error?: string
}

export default function Dashboard({ user, onBackToLanding, onLogout }: DashboardProps) {
  const [recordingType, setRecordingType] = useState<"plan" | "reflection">("plan")
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [transcriptionProgress, setTranscriptionProgress] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([])

  const [voiceEntries, setVoiceEntries] = useState<VoiceEntry[]>([])
  
  // 연속 기록 상태 추가
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastRecordDate: null as string | null,
    streakStatus: 'none' as 'active' | 'broken' | 'none',
    totalRecords: 0,
    uniqueDays: 0,
    thisWeekRecords: 0,
    thisMonthRecords: 0
  })

  // 로딩 상태 관리
  const [loadingStates, setLoadingStates] = useState({
    voiceEntries: false,
    goals: false,
    streak: false,
    initialLoad: true
  })

  // 실시간 목표 달성률 계산
  const todayStats = useMemo(() => {
    const totalGoals = dailyGoals.length
    const completedGoals = dailyGoals.filter(goal => goal.completed).length
    const goalAchievement = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    
    const planEntries = voiceEntries.filter(entry => entry.type === 'plan').length
    const reflectionEntries = voiceEntries.filter(entry => entry.type === 'reflection').length
    
    return {
      totalGoals,
      completedGoals,
      goalAchievement,
      planEntries,
      reflectionEntries
    }
  }, [dailyGoals, voiceEntries])

  // 주간 통계 계산 (연속 기록 데이터 포함)
  const weeklyStats = useMemo(() => {
    const totalEntries = voiceEntries.length
    const avgGoalAchievement = todayStats.goalAchievement
    
    // 실제 연속 기록 데이터 사용
    const currentStreak = streakData.currentStreak
    const longestStreak = streakData.longestStreak
    
    // 성장률 계산 (이번 주 기록 수 기반) 
    const thisWeekImprovement = streakData.thisWeekRecords > 0 ? 
      Math.min(streakData.thisWeekRecords * 10, 100) : 0
    
    return {
      totalEntries,
      avgGoalAchievement,
      currentStreak,
      longestStreak,
      thisWeekImprovement,
      thisWeekRecords: streakData.thisWeekRecords,
      thisMonthRecords: streakData.thisMonthRecords
    }
  }, [voiceEntries, todayStats, streakData])

  // 스켈레톤 로더 컴포넌트
  const SkeletonCard = ({ children }: { children?: React.ReactNode }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-center h-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  )

  // 상태 변수 추가
  const [dailyUsage, setDailyUsage] = useState({
    planCount: 0,
    reflectionCount: 0,
    maxDaily: 1, // 무료 플랜 제한
  })

  const [isFreePlan, setIsFreePlan] = useState(true) // 무료 플랜 여부

  // 상태 변수에 추가
  const [showAllRecords, setShowAllRecords] = useState(false)
  const [recordFilter, setRecordFilter] = useState<"all" | "plan" | "reflection">("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  // 상태 변수에 추가
  const [showAccountSettings, setShowAccountSettings] = useState(false)

  // 오디오 재생 상태 관리
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // 음성 변환 후 편집 상태 관리
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null)
  const [editableText, setEditableText] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // 기록 편집 상태 관리
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  // 시간을 분:초 형식으로 변환하는 함수 (소수점 또는 문자열 처리)
  const formatDuration = (duration: string | number | null): string => {
    if (!duration) return "0:00"
    
    // 이미 분:초 형식인지 확인 (예: "2:05")
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration
    }
    
    // 숫자로 변환 시도
    const seconds = typeof duration === 'string' ? parseFloat(duration) : duration
    
    if (isNaN(seconds) || seconds <= 0) return "0:00"
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // 오늘 목표 불러오기 함수
  const fetchTodayGoals = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, goals: true }))
      
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const response = await fetch(`/api/goals?date=${today}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        console.log("=== 오늘 목표 데이터 로드 ===")
        console.log("총 목표 수:", result.data.length)
        
        // API 응답을 컴포넌트 형식에 맞게 변환
        const formattedGoals = result.data.map((goal: any) => ({
          id: goal.id,
          text: goal.text,
          completed: goal.completed,
          priority: goal.priority,
          category: goal.category,
          estimatedMinutes: goal.estimatedMinutes,
          targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
          completedAt: goal.completedAt,
          createdAt: new Date(goal.createdAt).toISOString().split('T')[0],
          updatedAt: new Date(goal.updatedAt).toISOString().split('T')[0]
        }))
        
        setDailyGoals(formattedGoals)
      }
    } catch (error) {
      console.error('목표 불러오기 실패:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, goals: false }))
    }
  }

  // 연속 기록 데이터 불러오기 함수
  const fetchStreakData = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, streak: true }))
      
      const response = await fetch('/api/stats/streak')
      const result = await response.json()
      
      if (result.success && result.data) {
        console.log("=== 연속 기록 데이터 로드 ===")
        console.log("현재 연속:", result.data.currentStreak)
        console.log("최장 연속:", result.data.longestStreak)
        
        setStreakData(result.data)
      }
    } catch (error) {
      console.error('연속 기록 불러오기 실패:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, streak: false }))
    }
  }

  // 음성 기록 불러오기 함수
  const fetchVoiceEntries = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, voiceEntries: true }))
      
      const response = await fetch('/api/voice-entries')
      if (!response.ok) {
        throw new Error('Failed to fetch voice entries')
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        console.log("=== 음성 기록 데이터 로드 ===")
        console.log("총 기록 수:", result.data.length)
        
        // 데이터베이스에서 가져온 데이터를 컴포넌트 형식에 맞게 변환
        const formattedEntries = result.data.map((entry: any) => {
          console.log(`기록 ID: ${entry.id}, audioFileUrl: ${entry.audioFileUrl}, audioDuration: ${entry.audioDuration}`)
          return {
            id: entry.id,
            type: entry.type,
            date: new Date(entry.recordedAt).toISOString().split('T')[0],
            time: new Date(entry.recordedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            duration: formatDuration(entry.audioDuration),
            text: entry.editedText || entry.originalText, // 편집된 텍스트가 있으면 우선 표시
            audioUrl: entry.audioFileUrl || null,
            fileName: entry.audioFileName,
            fileSize: formatFileSize(entry.audioFileSize),
            language: entry.language,
            completed: entry.completed,
            recordedAt: entry.recordedAt, // 원본 타임스탬프 보존
          }
        })
        
        console.log("변환된 기록:", formattedEntries.map(e => ({ id: e.id, audioUrl: e.audioUrl })))
        setVoiceEntries(formattedEntries)
      }
    } catch (error) {
      console.error('음성 기록 불러오기 실패:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, voiceEntries: false }))
    }
  }

  // 페이지 로드 시 모든 데이터 불러오기
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchVoiceEntries(),
          fetchTodayGoals(),
          fetchStreakData()
        ])
      } catch (error) {
        console.error('데이터 로딩 오류:', error)
      } finally {
        setLoadingStates(prev => ({ ...prev, initialLoad: false }))
      }
    }
    
    loadAllData()
  }, [])

  // 지원되는 오디오 파일 형식
  const supportedFormats = [
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
  const maxFileSize = 25 * 1024 * 1024 // 25MB (OpenAI 제한)

  // 파일 검증
  const validateFile = (file: File): string | null => {
    console.log("파일 정보:", {
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    if (!supportedFormats.includes(file.type)) {
      console.log("지원되지 않는 파일 타입:", file.type)
      console.log("지원되는 형식:", supportedFormats)
      return `지원되지 않는 파일 형식입니다. (감지된 형식: ${file.type})\nMP3, WAV, M4A, OGG 파일만 업로드 가능합니다.`
    }
    if (file.size > maxFileSize) {
      return "파일 크기가 너무 큽니다. 최대 25MB까지 업로드 가능합니다."
    }
    return null
  }

  // 오디오 파일 길이 계산
  const getAudioDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        const duration = audio.duration
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        resolve(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      }
      audio.onerror = () => resolve("0:00")
      audio.src = URL.createObjectURL(file)
    })
  }

  // OpenAI Whisper API를 사용한 음성 변환
  const transcribeAudio = async (file: File): Promise<TranscriptionResult> => {
    const formData = new FormData()
    formData.append("audio", file)
    formData.append("language", "ko") // 한국어로 설정
    formData.append("type", recordingType) // 선택한 타입을 전달

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "음성 변환에 실패했습니다.")
    }

    return result
  }

  // 파일 업로드 처리
  const handleFileUpload = async (file: File) => {
    setUploadError(null)

    const error = validateFile(file)
    if (error) {
      setUploadError(error)
      return
    }

    setIsProcessing(true)
    setTranscriptionProgress("파일 분석 중...")

    try {
      const duration = await getAudioDuration(file)
      const url = URL.createObjectURL(file)

      setUploadedFile({
        file,
        url,
        duration,
      })
      setTranscriptionProgress("업로드 완료")
    } catch (error) {
      setUploadError("파일 처리 중 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
    }
  }

  // 드래그 앤 드롭 이벤트
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // 파일 선택 이벤트
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // 실제 음성 변환 처리
  const handleTranscription = async () => {
    if (!uploadedFile) return

    // 무료 플랜 사용량 체크
    if (isFreePlan) {
      const currentCount = recordingType === "plan" ? dailyUsage.planCount : dailyUsage.reflectionCount
      if (currentCount >= dailyUsage.maxDaily) {
        setUploadError(
          `무료 플랜은 ${recordingType === "plan" ? "계획" : "회고"}을 하루에 ${dailyUsage.maxDaily}회만 이용할 수 있습니다. 프리미엄으로 업그레이드하세요.`,
        )
        return
      }
    }

    setIsProcessing(true)
    setUploadError(null)

    try {
      setTranscriptionProgress("OpenAI Whisper로 음성 변환 중...")

      const result = await transcribeAudio(uploadedFile.file)

      if (!result.success) {
        throw new Error(result.error || "음성 변환에 실패했습니다.")
      }

      setTranscriptionProgress("변환 완료! 텍스트를 확인하고 수정하세요.")

      // 변환 결과를 편집 모드로 설정
      setTranscriptionResult(result)
      setEditableText(result.text)
      
      console.log("음성 변환 완료. 편집 모드로 전환:", result.text)
    } catch (error: any) {
      console.error("음성 변환 오류:", error)
      setUploadError(error.message || "음성 변환 중 오류가 발생했습니다.")
      setTranscriptionProgress("")
    } finally {
      setIsProcessing(false)
    }
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // 업로드 취소
  const handleUploadCancel = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url)
    }
    setUploadedFile(null)
    setUploadError(null)
    setTranscriptionProgress("")
    setTranscriptionResult(null)
    setEditableText("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 변환 결과 저장
  const handleSaveTranscription = async () => {
    if (!transcriptionResult || !uploadedFile || !editableText.trim()) return

    setIsSaving(true)
    try {
      // 별도의 저장 API 호출
      const formData = new FormData()
      formData.append("audio", uploadedFile.file)
      formData.append("type", recordingType)
      formData.append("text", editableText.trim()) // 수정된 텍스트
      formData.append("language", transcriptionResult.language || "ko")
      formData.append("duration", transcriptionResult.duration?.toString() || "0")

      const response = await fetch("/api/voice-entries/save", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "저장에 실패했습니다.")
      }

      console.log("음성 기록 저장 완료:", result.id)

      // 데이터 새로고침 (순서 중요: 음성 기록 먼저, 그 다음 연속 기록)
      await fetchVoiceEntries()
      await fetchStreakData()

      // 성공 시 상태 초기화
      setTranscriptionResult(null)
      setEditableText("")
      setUploadedFile(null)
      setTranscriptionProgress("")
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // 무료 플랜 사용량 업데이트
      if (isFreePlan) {
        setDailyUsage((prev) => ({
          ...prev,
          [recordingType === "plan" ? "planCount" : "reflectionCount"]:
            prev[recordingType === "plan" ? "planCount" : "reflectionCount"] + 1,
        }))
      }

      // 목록 새로고침
      const listResponse = await fetch('/api/voice-entries')
      if (listResponse.ok) {
        const listResult = await listResponse.json()
        if (listResult.success && listResult.data) {
          const formattedEntries = listResult.data.map((entry: any) => ({
            id: entry.id,
            type: entry.type,
            date: new Date(entry.recordedAt).toISOString().split('T')[0],
            time: new Date(entry.recordedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            duration: formatDuration(entry.audioDuration),
            text: entry.editedText || entry.originalText, // 편집된 텍스트가 있으면 우선 표시
            audioUrl: entry.audioFileUrl || null,
            fileName: entry.audioFileName,
            fileSize: formatFileSize(entry.audioFileSize),
            language: entry.language,
            completed: entry.completed,
            recordedAt: entry.recordedAt, // 원본 타임스탬프 보존
          }))
          setVoiceEntries(formattedEntries)
        }
      }

    } catch (error: any) {
      console.error("저장 오류:", error)
      setUploadError(error.message || "저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  // 변환 결과 취소
  const handleCancelTranscription = () => {
    setTranscriptionResult(null)
    setEditableText("")
    setTranscriptionProgress("")
    // 파일은 유지하여 다시 변환할 수 있도록 함
  }

  // 기록 편집 시작
  const handleStartEdit = (entryId: string, currentText: string) => {
    setEditingEntryId(entryId)
    setEditingText(currentText)
  }

  // 기록 편집 저장
  const handleSaveEdit = async (entryId: string) => {
    if (!editingText.trim()) return

    try {
      const response = await fetch(`/api/voice-entries/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          editedText: editingText.trim()
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "저장에 실패했습니다.")
      }

      // 목록에서 해당 항목 업데이트
      setVoiceEntries(prev => 
        prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, text: editingText.trim() }
            : entry
        )
      )

      // 편집 모드 종료
      setEditingEntryId(null)
      setEditingText("")

      console.log("텍스트 편집 저장 완료:", entryId)

    } catch (error: any) {
      console.error("편집 저장 오류:", error)
      alert(error.message || "저장 중 오류가 발생했습니다.")
    }
  }

  // 기록 편집 취소
  const handleCancelEdit = () => {
    setEditingEntryId(null)
    setEditingText("")
  }

  // 오디오 재생/일시정지 제어
  const playAudio = (audioUrl: string) => {
    console.log("=== playAudio 호출 ===")
    console.log("audioUrl:", audioUrl)
    console.log("playingAudioUrl:", playingAudioUrl)
    console.log("isPlaying:", isPlaying)
    console.log("currentAudio exists:", !!currentAudio)

    if (!audioUrl) {
      console.error("오디오 URL이 없습니다.")
      return
    }

    // 현재 재생 중인 오디오가 같은 URL이면 일시정지/재생 토글
    if (playingAudioUrl === audioUrl && currentAudio) {
      console.log("같은 오디오 토글 - isPlaying:", isPlaying)
      if (isPlaying) {
        currentAudio.pause()
        setIsPlaying(false)
        console.log("오디오 일시정지")
      } else {
        currentAudio.play()
          .then(() => {
            setIsPlaying(true)
            console.log("오디오 재생 시작")
          })
          .catch((err) => {
            console.error("오디오 재생 실패:", err)
            setIsPlaying(false)
          })
      }
      return
    }

    // 다른 오디오가 재생 중이면 먼저 정지
    if (currentAudio) {
      console.log("기존 오디오 정지")
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    console.log("새 오디오 생성 및 재생 시작")
    // 새 오디오 생성 및 재생
    const audio = new Audio()
    
    // 오디오 이벤트 리스너 추가
    audio.addEventListener('loadstart', () => console.log("오디오 로딩 시작"))
    audio.addEventListener('canplay', () => console.log("오디오 재생 가능"))
    audio.addEventListener('play', () => {
      console.log("오디오 재생 이벤트 발생")
      setIsPlaying(true)
    })
    audio.addEventListener('pause', () => {
      console.log("오디오 일시정지 이벤트 발생")
      setIsPlaying(false)
    })
    audio.addEventListener('ended', () => {
      console.log("오디오 재생 완료")
      setIsPlaying(false)
      setPlayingAudioUrl(null)
      setCurrentAudio(null)
    })
    audio.addEventListener('error', (err) => {
      console.error("오디오 오류 이벤트:", err)
      console.error("오디오 오류 상세:", audio.error)
      setIsPlaying(false)
      setPlayingAudioUrl(null)
      setCurrentAudio(null)
    })

    setCurrentAudio(audio)
    setPlayingAudioUrl(audioUrl)
    
    // 오디오 소스 설정
    audio.src = audioUrl
    console.log("오디오 소스 설정 완료:", audioUrl)
    
    // 재생 시도
    audio.play()
      .then(() => {
        console.log("오디오 재생 성공")
        setIsPlaying(true)
      })
      .catch((err) => {
        console.error("오디오 재생 실패:", err)
        console.error("오디오 readyState:", audio.readyState)
        console.error("오디오 networkState:", audio.networkState)
        setIsPlaying(false)
        setPlayingAudioUrl(null)
        setCurrentAudio(null)
      })
  }

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }
  }, [currentAudio])

  const [newGoal, setNewGoal] = useState("")
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  
  // 목표별 로딩 상태 관리
  const [goalLoadingStates, setGoalLoadingStates] = useState<{[key: string]: boolean}>({})

  // 새 목표 추가 함수
  const addNewGoal = async () => {
    if (newGoal.trim()) {
      try {
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: newGoal.trim(),
            priority: "medium", // 기본 우선순위
            targetDate: new Date().toISOString() // 오늘
          })
        })
        
        const result = await response.json()
        if (result.success && result.data) {
          // 목표 목록 새로고침
          await fetchTodayGoals()
          setNewGoal("")
          setIsAddingGoal(false)
          console.log("새 목표 추가 완료:", result.data.text)
        } else {
          console.error("목표 추가 실패:", result.error)
        }
      } catch (error) {
        console.error("목표 추가 오류:", error)
      }
    }
  }

  // 목표 삭제 함수
  const deleteGoal = async (goalId: string) => {
    // 삭제할 목표 백업
    const goalToDelete = dailyGoals.find(goal => goal.id === goalId)
    if (!goalToDelete) return

    // 해당 목표의 로딩 상태 설정
    setGoalLoadingStates(prev => ({ ...prev, [goalId]: true }))
    
    // 낙관적 업데이트 - 즉시 UI에서 제거
    setDailyGoals(prev => prev.filter(goal => goal.id !== goalId))
    
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        console.log("목표 삭제 완료:", goalId)
        // 이미 낙관적 업데이트로 제거됨
      } else {
        console.error("목표 삭제 실패:", result.error)
        // 실패 시 목표 복원
        setDailyGoals(prev => [...prev, goalToDelete])
      }
    } catch (error) {
      console.error("목표 삭제 오류:", error)
      // 에러 시 목표 복원
      setDailyGoals(prev => [...prev, goalToDelete])
    } finally {
      // 로딩 상태 해제
      setGoalLoadingStates(prev => {
        const newState = { ...prev }
        delete newState[goalId]
        return newState
      })
    }
  }

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addNewGoal()
    } else if (e.key === "Escape") {
      setIsAddingGoal(false)
      setNewGoal("")
    }
  }

  const toggleGoalCompletion = async (goalId: string) => {
    // 현재 완료 상태 찾기
    const currentGoal = dailyGoals.find(goal => goal.id === goalId)
    if (!currentGoal) return
    
    // 해당 목표의 로딩 상태 설정
    setGoalLoadingStates(prev => ({ ...prev, [goalId]: true }))
    
    // 낙관적 업데이트 - 즉시 UI 반영
    const newCompletedState = !currentGoal.completed
    setDailyGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, completed: newCompletedState }
        : goal
    ))
    
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: newCompletedState
        })
      })
      
      const result = await response.json()
      if (result.success) {
        console.log("목표 완료 상태 변경 성공:", goalId, newCompletedState)
        // 서버 응답으로 최종 확인 (이미 낙관적 업데이트로 반영됨)
      } else {
        console.error("목표 상태 변경 실패:", result.error)
        // 실패 시 원래 상태로 롤백
        setDailyGoals(prev => prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, completed: currentGoal.completed }
            : goal
        ))
      }
    } catch (error) {
      console.error("목표 상태 변경 오류:", error)
      // 에러 시 원래 상태로 롤백
      setDailyGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, completed: currentGoal.completed }
          : goal
      ))
    } finally {
      // 로딩 상태 해제
      setGoalLoadingStates(prev => ({ ...prev, [goalId]: false }))
    }
  }

  // 필터링 및 정렬된 기록 가져오기 함수 추가
  const getFilteredAndSortedRecords = () => {
    let filtered = voiceEntries

    if (recordFilter !== "all") {
      filtered = voiceEntries.filter((entry) => entry.type === recordFilter)
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)

      return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
    })
  }

  // 기록 삭제 함수 추가
  const deleteVoiceEntry = (entryId: string) => {
    setVoiceEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  // 사용자 업데이트 함수 추가
  const handleUserUpdate = (
    updatedUser: Partial<{
      name: string
      email: string
      avatar?: string
      emailVerified?: boolean
      twoFactorEnabled?: boolean
    }>,
  ) => {
    // 실제 구현에서는 상위 컴포넌트로 전달하거나 전역 상태 업데이트
    console.log("사용자 정보 업데이트:", updatedUser)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBackToLanding}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Voice Journal</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">안녕하세요, {user?.name}님!</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* 목표 달성률 카드 */}
          {loadingStates.goals || loadingStates.initialLoad ? (
            <SkeletonCard>
              <Target className="w-8 h-8 text-gray-300" />
            </SkeletonCard>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">오늘 목표 달성률</p>
                    <p className="text-2xl font-bold text-purple-600">{todayStats.goalAchievement}%</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>완료된 목표</span>
                    <span>{todayStats.completedGoals}/{todayStats.totalGoals}</span>
                  </div>
                  <Progress value={todayStats.goalAchievement} className="h-1.5" />
                  <div className="text-xs text-gray-500">
                    {todayStats.totalGoals === 0 ? "오늘의 목표를 설정해보세요!" : 
                     todayStats.completedGoals === todayStats.totalGoals ? "🎉 모든 목표 완료!" :
                     `${todayStats.totalGoals - todayStats.completedGoals}개 목표 남음`}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 음성 기록 카드 */}
          {loadingStates.voiceEntries || loadingStates.initialLoad ? (
            <SkeletonCard>
              <History className="w-8 h-8 text-gray-300" />
            </SkeletonCard>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 음성 기록</p>
                    <p className="text-2xl font-bold text-blue-600">{weeklyStats.totalEntries}개</p>
                  </div>
                  <History className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>계획</span>
                    <span>{todayStats.planEntries}개</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>회고</span>
                    <span>{todayStats.reflectionEntries}개</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 연속 기록 카드 */}
          {loadingStates.streak || loadingStates.initialLoad ? (
            <SkeletonCard>
              <Calendar className="w-8 h-8 text-gray-300" />
            </SkeletonCard>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">연속 기록</p>
                    <p className="text-2xl font-bold text-green-600">{weeklyStats.currentStreak}일</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>최장 기록</span>
                    <span>{weeklyStats.longestStreak}일</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>상태</span>
                    <span className={`font-medium ${
                      streakData.streakStatus === 'active' ? 'text-green-600' :
                      streakData.streakStatus === 'broken' ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {streakData.streakStatus === 'active' ? '🔥 활성' :
                       streakData.streakStatus === 'broken' ? '⏳ 중단' : '📝 시작 대기'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 활동 통계 카드 */}
          {loadingStates.streak || loadingStates.initialLoad ? (
            <SkeletonCard>
              <TrendingUp className="w-8 h-8 text-gray-300" />
            </SkeletonCard>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">이번 주 활동</p>
                    <p className="text-2xl font-bold text-orange-600">{weeklyStats.thisWeekRecords}개</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>이번 달</span>
                    <span>{weeklyStats.thisMonthRecords}개</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>활동 점수</span>
                    <span className="font-medium text-orange-600">+{weeklyStats.thisWeekImprovement}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  음성 파일 업로드 & AI 변환
                </CardTitle>
                <CardDescription>
                  계획이나 회고를 담은 음성 파일을 업로드하면 OpenAI Whisper가 자동으로 텍스트로 변환합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={recordingType === "plan" ? "default" : "outline"}
                    onClick={() => setRecordingType("plan")}
                    disabled={isProcessing}
                  >
                    내일 계획
                  </Button>
                  <Button
                    variant={recordingType === "reflection" ? "default" : "outline"}
                    onClick={() => setRecordingType("reflection")}
                    disabled={isProcessing}
                  >
                    오늘 회고
                  </Button>
                </div>

                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}

                {isProcessing ? (
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <div className="space-y-4">
                      <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                      <div>
                        <p className="text-lg font-medium text-blue-600">AI 처리 중...</p>
                        <p className="text-sm text-blue-500">{transcriptionProgress}</p>
                        <div className="mt-2">
                          <Progress value={undefined} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : transcriptionResult ? (
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileAudio className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">음성 변환 완료</p>
                          <p className="text-sm text-gray-500">
                            {uploadedFile?.file.name} • {formatDuration(transcriptionResult.duration || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">변환된 텍스트 (수정 가능)</label>
                        <Textarea 
                          value={editableText} 
                          onChange={(e) => setEditableText(e.target.value)}
                          className="min-h-[120px] resize-none" 
                          placeholder="변환된 텍스트를 확인하고 필요시 수정하세요..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => uploadedFile && playAudio(uploadedFile.url)} 
                          variant="outline"
                        >
                          {playingAudioUrl === uploadedFile?.url && isPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              일시정지
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              음성 재생
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={handleSaveTranscription} 
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={isSaving || !editableText.trim()}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              저장 중...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              저장하기
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={handleCancelTranscription} 
                          variant="outline"
                        >
                          <X className="w-4 h-4 mr-2" />
                          취소
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : uploadedFile ? (
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileAudio className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{uploadedFile.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(uploadedFile.file.size)} • {uploadedFile.duration}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleUploadCancel}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <Alert>
                        <Volume2 className="h-4 w-4" />
                        <AlertDescription>
                          파일이 준비되었습니다. OpenAI Whisper AI가 음성을 정확하게 텍스트로 변환합니다.
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            console.log("업로드된 파일 재생 시도:", uploadedFile.url)
                            playAudio(uploadedFile.url)
                          }} 
                          variant="outline"
                        >
                          {playingAudioUrl === uploadedFile.url && isPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              일시정지
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              재생
                            </>
                          )}
                        </Button>
                        <Button onClick={handleTranscription} className="bg-purple-600 hover:bg-purple-700">
                          <Mic className="w-4 h-4 mr-2" />
                          AI로 텍스트 변환하기
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {recordingType === "plan"
                            ? "내일 계획 음성 파일을 업로드하세요"
                            : "오늘 회고 음성 파일을 업로드하세요"}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">파일을 드래그 앤 드롭하거나 클릭하여 선택하세요</p>
                        <p className="text-xs text-gray-400 mt-1">
                          지원 형식: MP3, WAV, M4A, OGG (최대 25MB) • OpenAI Whisper AI 변환
                        </p>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        파일 선택
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.m4a,.ogg,.webm,.aac,.flac,audio/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Entries */}
            <Card>
              <CardHeader>
                <CardTitle>최근 기록</CardTitle>
                <CardDescription>AI로 변환된 음성 텍스트를 확인하세요.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStates.voiceEntries || loadingStates.initialLoad ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center justify-center h-16">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voiceEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant={entry.type === "plan" ? "default" : "secondary"}>
                            {entry.type === "plan" ? "계획" : "회고"}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {entry.date} {entry.time}
                          </span>
                          <span className="text-sm text-gray-500">{entry.duration}</span>
                          {entry.fileName && <span className="text-xs text-gray-400">• {entry.fileName}</span>}
                          {entry.language && (
                            <Badge variant="outline" className="text-xs">
                              {entry.language === "ko" ? "한국어" : entry.language}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {editingEntryId === entry.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveEdit(entry.id)}
                                disabled={!editingText.trim()}
                                title="저장"
                              >
                                <Save className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                title="취소"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(entry.id, entry.text)}
                                title="텍스트 편집"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  console.log("기록 재생 시도:", entry.audioUrl, "disabled:", !entry.audioUrl)
                                  if (entry.audioUrl) {
                                    playAudio(entry.audioUrl)
                                  }
                                }}
                                disabled={!entry.audioUrl}
                                title={
                                  !entry.audioUrl 
                                    ? "오디오 파일이 없습니다"
                                    : playingAudioUrl === entry.audioUrl && isPlaying
                                    ? "일시정지"
                                    : "재생"
                                }
                              >
                                {playingAudioUrl === entry.audioUrl && isPlaying ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {editingEntryId === entry.id ? (
                        <Textarea 
                          value={editingText} 
                          onChange={(e) => setEditingText(e.target.value)}
                          className="min-h-[80px] resize-none border-blue-300 focus:border-blue-500" 
                          placeholder="텍스트를 수정하세요..."
                          autoFocus
                        />
                      ) : (
                        <Textarea value={entry.text} readOnly className="min-h-[80px] resize-none" />
                      )}
                      <div className="flex justify-between items-center mt-2">
                        {entry.fileSize && <p className="text-xs text-gray-400">파일 크기: {entry.fileSize}</p>}
                        <p className="text-xs text-green-600">✓ AI 변환 완료</p>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  오늘의 목표
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingGoal(true)} disabled={isAddingGoal}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 새 목표 추가 입력 */}
                  {isAddingGoal && (
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-blue-50">
                      <Circle className="w-5 h-5 text-gray-400" />
                      <Input
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="새 목표를 입력하세요..."
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0"
                        autoFocus
                      />
                      <Button size="sm" onClick={addNewGoal} disabled={!newGoal.trim()}>
                        추가
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingGoal(false)
                          setNewGoal("")
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  )}

                  {/* 기존 목표 리스트 */}
                  {dailyGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3 group">
                      <button 
                        onClick={() => toggleGoalCompletion(goal.id)}
                        disabled={goalLoadingStates[goal.id]}
                        className="relative"
                      >
                        {goalLoadingStates[goal.id] ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        ) : goal.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                      <span className={`flex-1 transition-all duration-200 ${
                        goal.completed 
                          ? "line-through text-gray-500" 
                          : goalLoadingStates[goal.id] 
                            ? "text-gray-400" 
                            : ""
                      }`}>
                        {goal.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteGoal(goal.id)}
                        disabled={goalLoadingStates[goal.id]}
                      >
                        {goalLoadingStates[goal.id] ? (
                          <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        ) : (
                          <X className="w-3 h-3 text-red-500" />
                        )}
                      </Button>
                    </div>
                  ))}

                  {/* 목표가 없을 때 */}
                  {dailyGoals.length === 0 && !isAddingGoal && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">아직 목표가 없습니다.</p>
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingGoal(true)} className="mt-2">
                        <Plus className="w-4 h-4 mr-1" />첫 목표 추가하기
                      </Button>
                    </div>
                  )}
                </div>

                {/* 진행률 표시 - 목표가 있을 때만 */}
                {dailyGoals.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>진행률</span>
                      <span>
                        {Math.round((dailyGoals.filter((g) => g.completed).length / dailyGoals.length) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(dailyGoals.filter((g) => g.completed).length / dailyGoals.length) * 100}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>이번 주 성장</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">목표 달성률</span>
                    <span className="font-semibold">{weeklyStats.avgGoalAchievement}%</span>
                  </div>
                  <Progress value={weeklyStats.avgGoalAchievement} className="h-2" />

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{weeklyStats.totalEntries}</div>
                      <div className="text-xs text-gray-500">총 기록</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{weeklyStats.longestStreak}</div>
                      <div className="text-xs text-gray-500">연속 일수</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Limit Card - 무료 플랜인 경우만 표시 */}
            {isFreePlan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    오늘의 사용량
                    <Badge variant="outline">무료 플랜</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>계획 세우기</span>
                        <span>
                          {dailyUsage.planCount}/{dailyUsage.maxDaily}
                        </span>
                      </div>
                      <Progress value={(dailyUsage.planCount / dailyUsage.maxDaily) * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>회고하기</span>
                        <span>
                          {dailyUsage.reflectionCount}/{dailyUsage.maxDaily}
                        </span>
                      </div>
                      <Progress value={(dailyUsage.reflectionCount / dailyUsage.maxDaily) * 100} className="h-2" />
                    </div>

                    <div className="pt-4 border-t">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600" size="sm">
                        프리미엄 업그레이드
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">무제한 이용 + 고급 기능</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>빠른 실행</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setShowAllRecords(true)}
                  >
                    <History className="w-4 h-4 mr-2" />
                    전체 기록 보기
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setShowAccountSettings(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    설정
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      {/* All Records Modal */}
      <AllRecordsModal
        isOpen={showAllRecords}
        onClose={() => setShowAllRecords(false)}
        voiceEntries={voiceEntries}
        onPlayAudio={playAudio}
        onDeleteEntry={deleteVoiceEntry}
      />
      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        user={{
          name: user?.name || "",
          email: user?.email || "",
          joinDate: "2024-01-15",
          lastLogin: "방금 전",
          emailVerified: true,
          twoFactorEnabled: false,
        }}
        onUpdateUser={handleUserUpdate}
        onLogout={onLogout}
      />
    </div>
  )
}
