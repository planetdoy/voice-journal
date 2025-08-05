"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
}

interface DailyGoal {
  id: string
  text: string
  completed: boolean
  createdAt: string
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

  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([
    { id: "1", text: "아침 운동 30분", completed: true, createdAt: "2024-01-15" },
    { id: "2", text: "프로젝트 기획서 작성", completed: false, createdAt: "2024-01-15" },
    { id: "3", text: "독서 1시간", completed: false, createdAt: "2024-01-15" },
  ])

  const [voiceEntries, setVoiceEntries] = useState<VoiceEntry[]>([])

  const todayStats = {
    planCompleted: 1,
    totalPlans: 2,
    reflectionDone: 1,
    goalAchievement: 33,
  }

  const weeklyStats = {
    totalEntries: 12,
    avgGoalAchievement: 78,
    longestStreak: 5,
    thisWeekImprovement: 15,
  }

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

  // 페이지 로드 시 음성 기록 불러오기
  useEffect(() => {
    const fetchVoiceEntries = async () => {
      try {
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
              text: entry.originalText,
              audioUrl: entry.audioFileUrl || null,
              fileName: entry.audioFileName,
              fileSize: formatFileSize(entry.audioFileSize),
              language: entry.language,
              completed: entry.completed,
            }
          })
          
          console.log("변환된 기록:", formattedEntries.map(e => ({ id: e.id, audioUrl: e.audioUrl })))
          setVoiceEntries(formattedEntries)
        }
      } catch (error) {
        console.error('음성 기록 불러오기 실패:', error)
      }
    }

    fetchVoiceEntries()
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

      setTranscriptionProgress("변환 완료! 저장 중...")

      // API 응답에서 실제 저장된 데이터 정보를 사용하여 새 항목 생성
      const newEntry: VoiceEntry = {
        id: result.id || Date.now().toString(),
        type: recordingType,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        duration: typeof result.duration === 'number' ? formatDuration(result.duration) : uploadedFile.duration,
        text: result.text,
        audioUrl: null, // S3 URL은 데이터베이스 재조회 시 가져옴
        fileName: uploadedFile.file.name,
        fileSize: formatFileSize(uploadedFile.file.size),
        language: result.language,
        completed: false,
      }

      // 목록에 추가 (audioUrl 없이 텍스트만 표시)
      setVoiceEntries((prev) => [newEntry, ...prev])

      // 데이터베이스에서 전체 목록을 다시 가져와서 S3 URL 포함된 데이터로 업데이트
      setTimeout(async () => {
        try {
          const response = await fetch('/api/voice-entries')
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              console.log("=== 저장 후 목록 업데이트 ===")
              const formattedEntries = result.data.map((entry: any) => {
                console.log(`업데이트 기록 ID: ${entry.id}, audioFileUrl: ${entry.audioFileUrl}, audioDuration: ${entry.audioDuration}`)
                return {
                  id: entry.id,
                  type: entry.type,
                  date: new Date(entry.recordedAt).toISOString().split('T')[0],
                  time: new Date(entry.recordedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  duration: formatDuration(entry.audioDuration),
                  text: entry.originalText,
                  audioUrl: entry.audioFileUrl || null,
                  fileName: entry.audioFileName,
                  fileSize: formatFileSize(entry.audioFileSize),
                  language: entry.language,
                  completed: entry.completed,
                }
              })
              setVoiceEntries(formattedEntries)
              console.log("음성 기록 목록 업데이트 완료:", formattedEntries.length, "개")
            }
          }
        } catch (error) {
          console.error('음성 기록 목록 업데이트 실패:', error)
        }
      }, 1000) // 1초 후 업데이트

      // 무료 플랜 사용량 업데이트
      if (isFreePlan) {
        setDailyUsage((prev) => ({
          ...prev,
          [recordingType === "plan" ? "planCount" : "reflectionCount"]:
            prev[recordingType === "plan" ? "planCount" : "reflectionCount"] + 1,
        }))
      }

      setUploadedFile(null)
      setTranscriptionProgress("")

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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

  // 새 목표 추가 함수
  const addNewGoal = () => {
    if (newGoal.trim()) {
      const goal: DailyGoal = {
        id: Date.now().toString(),
        text: newGoal.trim(),
        completed: false,
        createdAt: new Date().toISOString().split("T")[0],
      }
      setDailyGoals((prev) => [...prev, goal])
      setNewGoal("")
      setIsAddingGoal(false)
    }
  }

  // 목표 삭제 함수
  const deleteGoal = (goalId: string) => {
    setDailyGoals((prev) => prev.filter((goal) => goal.id !== goalId))
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

  const toggleGoalCompletion = (goalId: string) => {
    setDailyGoals((prev) => prev.map((goal) => (goal.id === goalId ? { ...goal, completed: !goal.completed } : goal)))
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">오늘 목표 달성률</p>
                  <p className="text-2xl font-bold text-purple-600">{todayStats.goalAchievement}%</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">이번 주 기록</p>
                  <p className="text-2xl font-bold text-blue-600">{weeklyStats.totalEntries}개</p>
                </div>
                <History className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">연속 기록</p>
                  <p className="text-2xl font-bold text-green-600">{weeklyStats.longestStreak}일</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">이번 주 성장률</p>
                  <p className="text-2xl font-bold text-orange-600">+{weeklyStats.thisWeekImprovement}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
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
                      </div>
                      <Textarea value={entry.text} readOnly className="min-h-[80px] resize-none" />
                      <div className="flex justify-between items-center mt-2">
                        {entry.fileSize && <p className="text-xs text-gray-400">파일 크기: {entry.fileSize}</p>}
                        <p className="text-xs text-green-600">✓ AI 변환 완료</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <button onClick={() => toggleGoalCompletion(goal.id)}>
                        {goal.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <span className={`flex-1 ${goal.completed ? "line-through text-gray-500" : ""}`}>
                        {goal.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <X className="w-3 h-3 text-red-500" />
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
