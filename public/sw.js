// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  event.waitUntil(clients.claim())
})

// Push 알림 수신
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  let notificationData = {
    title: 'Voice Journal',
    body: '알림이 도착했습니다',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'voice-journal-notification',
    data: {}
  }

  // Push 메시지에서 데이터 추출
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || notificationData.data
      }
    } catch (e) {
      console.error('Failed to parse push data:', e)
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      requireInteraction: false
    }
  )

  event.waitUntil(promiseChain)
})

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  event.notification.close()

  // 알림 데이터에 따른 처리
  const data = event.notification.data
  let targetUrl = '/'

  if (data.type === 'plan_reminder') {
    targetUrl = '/?action=record&type=plan'
  } else if (data.type === 'reflection_reminder') {
    targetUrl = '/?action=record&type=reflection'
  } else if (data.type === 'goal_deadline') {
    targetUrl = '/?view=goals'
  } else if (data.type === 'streak_alert') {
    targetUrl = '/?view=dashboard'
  }

  // 클라이언트 창 열기 또는 포커스
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes('localhost:3000') || client.url.includes('voice-journal')) {
            return client.focus().then((client) => {
              client.navigate(targetUrl)
            })
          }
        }
        // 열린 창이 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

// Background Sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  try {
    // 오프라인 동안 대기 중인 알림 처리
    console.log('Syncing notifications...')
  } catch (error) {
    console.error('Sync failed:', error)
  }
}