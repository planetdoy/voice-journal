// Push 알림 관련 유틸리티 함수

// Service Worker 등록
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  } else {
    throw new Error('Push notifications are not supported in this browser')
  }
}

// Push 알림 권한 요청
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications')
  }

  const permission = await Notification.requestPermission()
  
  if (permission === 'granted') {
    console.log('Notification permission granted')
    return true
  } else if (permission === 'denied') {
    console.log('Notification permission denied')
    return false
  } else {
    console.log('Notification permission dismissed')
    return false
  }
}

// Push 구독 생성
export async function subscribeToPush() {
  try {
    // Service Worker 등록 확인
    const registration = await navigator.serviceWorker.ready
    
    // 기존 구독 확인
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      console.log('Already subscribed to push notifications')
      return existingSubscription
    }

    // VAPID public key (실제 구현 시 환경 변수에서 가져오기)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
      'BKQGXGecJnzGTShQlHxRfVoUkB_5VRqnJGdmZU9HV4hfg0J7_5rQPxMPKpV_IH6Xy6oLSx_b9rZPqFwH_X9E5zQ'
    
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

    // Push 구독 생성
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    })

    console.log('Push subscription created:', subscription)

    // 서버에 구독 정보 전송
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    })

    if (!response.ok) {
      throw new Error('Failed to save subscription on server')
    }

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    throw error
  }
}

// Push 구독 취소
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
      
      // 서버에서 구독 정보 삭제
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE'
      })
      
      console.log('Unsubscribed from push notifications')
      return true
    }
    
    return false
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error)
    throw error
  }
}

// VAPID key 변환 헬퍼 함수
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// 로컬 알림 표시 (Service Worker 없이)
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options)
  }
}

// Push 알림 지원 여부 확인
export function isPushSupported() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window
}

// 현재 알림 권한 상태 확인
export function getNotificationPermissionStatus() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}