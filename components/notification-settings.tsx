"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Mail, Smartphone, Calendar, Trophy, Target } from "lucide-react"
import { toast } from "sonner"
import { 
  registerServiceWorker, 
  requestNotificationPermission, 
  subscribeToPush,
  unsubscribeFromPush,
  isPushSupported 
} from "@/lib/push-notification"

interface NotificationSettings {
  dailyReminderEnabled: boolean
  dailyReminderTime: string
  emailEnabled: boolean
  pushEnabled: boolean
  timezone: string
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminderEnabled: true,
    dailyReminderTime: "20:00",
    emailEnabled: true,
    pushEnabled: false,
    timezone: "Asia/Seoul"
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    // 현재 시간대 감지
    const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setSettings(prev => ({ ...prev, timezone: currentTimezone }))
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/notifications/settings")
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched settings:", data)
        setSettings(data)
      } else {
        const error = await response.json()
        console.error("Failed to fetch settings:", error)
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      // Push 알림 활성화
      if (!isPushSupported()) {
        toast.error("이 브라우저는 Push 알림을 지원하지 않습니다")
        return
      }

      try {
        // Service Worker 등록
        await registerServiceWorker()
        
        // 알림 권한 요청
        const permissionGranted = await requestNotificationPermission()
        if (!permissionGranted) {
          toast.error("알림 권한이 거부되었습니다")
          return
        }

        // Push 구독
        await subscribeToPush()
        setSettings(prev => ({ ...prev, pushEnabled: true }))
        toast.success("브라우저 알림이 활성화되었습니다")
      } catch (error) {
        console.error("Failed to enable push notifications:", error)
        toast.error("브라우저 알림 활성화에 실패했습니다")
      }
    } else {
      // Push 알림 비활성화
      try {
        await unsubscribeFromPush()
        setSettings(prev => ({ ...prev, pushEnabled: false }))
        toast.success("브라우저 알림이 비활성화되었습니다")
      } catch (error) {
        console.error("Failed to disable push notifications:", error)
        toast.error("브라우저 알림 비활성화에 실패했습니다")
      }
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    console.log("Saving settings:", settings)
    try {
      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        toast.success("알림 설정이 저장되었습니다")
      } else {
        console.error("Save failed:", data)
        toast.error(data.error || "설정 저장에 실패했습니다")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("설정 저장 중 오류가 발생했습니다")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">알림 설정</h3>
        <p className="text-sm text-muted-foreground mb-6">
          원하는 시간에 알림을 받아 꾸준한 기록을 유지하세요
        </p>
      </div>

      {/* 알림 채널 설정 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          알림 채널
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="email-enabled">이메일 알림</Label>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, emailEnabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="push-enabled">브라우저 알림</Label>
            </div>
            <Switch
              id="push-enabled"
              checked={settings.pushEnabled}
              onCheckedChange={handlePushToggle}
            />
          </div>
        </div>
      </div>

      {/* 일일 리마인더 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          일일 리마인더
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="daily-reminder">데일리 기록 알림</Label>
              <p className="text-xs text-muted-foreground">
                오늘을 돌아보고 내일을 계획하는 시간을 알려드립니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.dailyReminderTime}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, dailyReminderTime: e.target.value }))
                }
                className="px-2 py-1 text-sm border rounded"
                disabled={!settings.dailyReminderEnabled}
              />
              <Switch
                id="daily-reminder"
                checked={settings.dailyReminderEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, dailyReminderEnabled: checked }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 시간대 설정 */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <Label>시간대</Label>
            <p className="text-xs text-muted-foreground mt-1">
              현재 시간대: {settings.timezone}
            </p>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end pt-4">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  )
}