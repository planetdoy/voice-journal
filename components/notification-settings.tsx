"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Mail, Smartphone, Calendar, Trophy, Target } from "lucide-react"
import { toast } from "sonner"

interface NotificationSettings {
  planReminderEnabled: boolean
  planReminderTime: string
  reflectionReminderEnabled: boolean
  reflectionReminderTime: string
  streakAlertsEnabled: boolean
  goalDeadlineAlertsEnabled: boolean
  emailEnabled: boolean
  pushEnabled: boolean
  timezone: string
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    planReminderEnabled: true,
    planReminderTime: "21:00",
    reflectionReminderEnabled: true,
    reflectionReminderTime: "07:00",
    streakAlertsEnabled: true,
    goalDeadlineAlertsEnabled: true,
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
        setSettings(data)
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success("알림 설정이 저장되었습니다")
        
        // Push 알림 권한 요청
        if (settings.pushEnabled && "Notification" in window) {
          const permission = await Notification.requestPermission()
          if (permission === "granted") {
            // Push 구독 로직 (추후 구현)
            console.log("Push notifications enabled")
          } else {
            setSettings(prev => ({ ...prev, pushEnabled: false }))
            toast.error("브라우저 알림 권한이 거부되었습니다")
          }
        }
      } else {
        toast.error("설정 저장에 실패했습니다")
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
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, pushEnabled: checked }))
              }
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
              <Label htmlFor="plan-reminder">저녁 계획 알림</Label>
              <p className="text-xs text-muted-foreground">
                내일을 위한 계획을 세울 시간입니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.planReminderTime}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, planReminderTime: e.target.value }))
                }
                className="px-2 py-1 text-sm border rounded"
                disabled={!settings.planReminderEnabled}
              />
              <Switch
                id="plan-reminder"
                checked={settings.planReminderEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, planReminderEnabled: checked }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reflection-reminder">아침 회고 알림</Label>
              <p className="text-xs text-muted-foreground">
                어제를 돌아보고 오늘을 시작하세요
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.reflectionReminderTime}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, reflectionReminderTime: e.target.value }))
                }
                className="px-2 py-1 text-sm border rounded"
                disabled={!settings.reflectionReminderEnabled}
              />
              <Switch
                id="reflection-reminder"
                checked={settings.reflectionReminderEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, reflectionReminderEnabled: checked }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 동기부여 알림 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          동기부여 알림
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="streak-alerts">연속 기록 알림</Label>
              <p className="text-xs text-muted-foreground">
                기록 스트릭 유지를 위한 알림
              </p>
            </div>
            <Switch
              id="streak-alerts"
              checked={settings.streakAlertsEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, streakAlertsEnabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="goal-deadlines">목표 마감일 알림</Label>
              <p className="text-xs text-muted-foreground">
                목표 달성 기한이 임박하면 알려드립니다
              </p>
            </div>
            <Switch
              id="goal-deadlines"
              checked={settings.goalDeadlineAlertsEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, goalDeadlineAlertsEnabled: checked }))
              }
            />
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