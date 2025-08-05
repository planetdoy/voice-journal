"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Trash2, AlertTriangle, CheckCircle, Settings, Save, Upload } from "lucide-react"

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    name: string
    email: string
    avatar?: string
    joinDate?: string
    lastLogin?: string
    emailVerified?: boolean
  }
  onUpdateUser: (
    updatedUser: Partial<{
      name: string
      email: string
      avatar?: string
      joinDate?: string
      lastLogin?: string
      emailVerified?: boolean
    }>,
  ) => void
  onLogout: () => void
}

export default function AccountSettingsModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
}: AccountSettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState("profile")
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // 프로필 편집 상태
  const [profileForm, setProfileForm] = React.useState({
    name: user.name,
    email: user.email,
  })


  // 계정 삭제 확인 상태
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  // 프로필 사진 업로드 함수를 컴포넌트 상단에 추가
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 프로필 업데이트
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onUpdateUser({
        name: profileForm.name,
        email: profileForm.email,
      })

      setMessage({ type: "success", text: "프로필이 성공적으로 업데이트되었습니다." })
    } catch (error) {
      setMessage({ type: "error", text: "프로필 업데이트 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }


  // 이메일 인증 재발송
  const handleResendVerification = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessage({ type: "success", text: "인증 이메일이 발송되었습니다." })
    } catch (error) {
      setMessage({ type: "error", text: "이메일 발송 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  // 계정 삭제
  const handleAccountDelete = async () => {
    if (deleteConfirmation !== "DELETE") {
      setMessage({ type: "error", text: "삭제 확인을 위해 'DELETE'를 정확히 입력해주세요." })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // 실제 구현에서는 계정 삭제 API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setMessage({ type: "success", text: "계정이 성공적으로 삭제되었습니다. 잠시 후 로그아웃됩니다." })

      // 3초 후 로그아웃
      setTimeout(() => {
        onLogout()
        onClose()
      }, 3000)
    } catch (error) {
      setMessage({ type: "error", text: "계정 삭제 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  // 프로필 사진 업로드
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "파일 크기는 5MB 이하여야 합니다." })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // 실제 구현에서는 파일 업로드 API 호출
      const avatarUrl = URL.createObjectURL(file)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onUpdateUser({ avatar: avatarUrl })
      setMessage({ type: "success", text: "프로필 사진이 업데이트되었습니다." })
    } catch (error) {
      setMessage({ type: "error", text: "프로필 사진 업로드 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            계정 설정
          </DialogTitle>
          <DialogDescription>계정 정보를 관리하세요.</DialogDescription>
        </DialogHeader>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">프로필</TabsTrigger>
            <TabsTrigger value="danger">위험 구역</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="profile" className="space-y-6">
              {/* 프로필 사진 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    프로필 사진
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user.avatar || "/placeholder.svg?height=80&width=80"} />
                      <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">JPG, PNG 파일만 업로드 가능 (최대 5MB)</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          사진 업로드
                        </Button>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          제거
                        </Button>
                      </div>
                      {/* 숨겨진 파일 입력 */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    기본 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">이름</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="이름을 입력하세요"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            placeholder="이메일을 입력하세요"
                            required
                          />
                          {user.emailVerified ? (
                            <Badge variant="default" className="shrink-0">
                              인증됨
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="shrink-0">
                              미인증
                            </Badge>
                          )}
                        </div>
                        {!user.emailVerified && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={isLoading}
                          >
                            인증 이메일 재발송
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>가입일</Label>
                        <Input value={user.joinDate || "2024-01-15"} readOnly className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>마지막 로그인</Label>
                        <Input value={user.lastLogin || "방금 전"} readOnly className="bg-gray-50" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "저장 중..." : "변경사항 저장"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="danger" className="space-y-6">
              {/* 계정 삭제 */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    계정 삭제
                  </CardTitle>
                  <CardDescription>
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>주의:</strong> 이 작업은 되돌릴 수 없습니다. 계정 삭제 시 다음 데이터가 모두 삭제됩니다:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>모든 음성 기록 및 텍스트</li>
                        <li>목표 및 성장 데이터</li>
                        <li>프로필 정보 및 설정</li>
                        <li>구독 정보 (환불 불가)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      계정 삭제하기
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation">
                          계속하려면 <strong>DELETE</strong>를 입력하세요:
                        </Label>
                        <Input
                          id="delete-confirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                          className="border-red-300 focus:border-red-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={handleAccountDelete}
                          disabled={deleteConfirmation !== "DELETE" || isLoading}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isLoading ? "삭제 중..." : "영구 삭제"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteConfirmation("")
                          }}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
