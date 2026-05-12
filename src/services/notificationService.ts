import { UserData, RoutineChunk } from '../types';

/**
 * Service for handling browser notifications.
 */
class NotificationService {
  private lastTriggered: Set<string> = new Set();

  /**
   * Requests permission to show notifications.
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // Optional: Show a test notification
      // this.showNotification('알림 설정 완료', { body: '이제 루틴 시작 시간에 알림을 보내드릴게요!' });
    }
    return permission;
  }

  /**
   * Shows a notification using the service worker (better for background).
   */
  async showNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission !== 'granted') return;

    // Use service worker to show notification if available
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      registration.showNotification(title, {
        icon: '/logo192.png',
        badge: '/favicon.ico',
        ...options,
      });
    } else {
      // Fallback to pure web notification
      new Notification(title, options);
    }
  }

  /**
   * Schedules or triggers notifications based on user data and current time.
   * This should be called regularly (e.g., every minute).
   */
  checkAndTrigger(userData: UserData, currentTime: Date, todayStr: string) {
    if (Notification.permission !== 'granted') return;

    const currentHM = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    const dayOfWeek = currentTime.getDay();

    // 1. Check Wake-up Time
    if (userData.isWakeUpAlarmEnabled !== false && userData.targetWakeUpTime === currentHM) {
      const key = `wakeup-${todayStr}-${currentHM}`;
      if (!this.lastTriggered.has(key)) {
        this.showNotification('기상 시간입니다!', {
          body: '상쾌한 하루를 위해 지금 일어나보세요!',
          tag: 'wakeup-alarm'
        });
        this.lastTriggered.add(key);
      }
    }

    // 2. Check Routine Groups
    userData.routineChunks.forEach(chunk => {
      if (!chunk.isAlarmEnabled) return;
      if (chunk.startType !== 'time' || !chunk.startTime) return;
      if (!chunk.scheduledDays.includes(dayOfWeek)) return;

      // Check if already completed or inactive today
      const isInactive = userData.inactiveChunks?.[todayStr]?.includes(chunk.id);
      if (isInactive) return;

      // Extract HM from startTime (format is HH:mm or HH:mm:ss)
      const startHM = chunk.startTime.slice(0, 5);

      if (startHM === currentHM) {
        const key = `chunk-${chunk.id}-${todayStr}-${currentHM}`;
        if (!this.lastTriggered.has(key)) {
          this.showNotification(`루틴 시작: ${chunk.name}`, {
            body: chunk.purpose || '루틴을 시작할 시간입니다.',
            tag: `alarm-${chunk.id}`
          });
          this.lastTriggered.add(key);
        }
      }
    });

    // Cleanup old keys to prevent memory leak (roughly keep last 24h)
    if (this.lastTriggered.size > 100) {
      // Very simple cleanup: clear all and wait for next triggers
      // In a real app we might use a more sophisticated TTL
      this.lastTriggered.clear();
    }
  }
}

export const notificationService = new NotificationService();
