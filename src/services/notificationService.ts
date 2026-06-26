import { UserData } from '../types';
import i18n from '../i18n';

/**
 * Service for handling browser notifications.
 */
class NotificationService {
  private lastTriggered: Set<string> = new Set();

  /**
   * Requests permission to show notifications.
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) {
      console.warn('This browser does not support notifications.');
      return 'denied';
    }

    const permission = await window.Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // Optional: Show a test notification
      // this.showNotification(i18n.t('notification.setupTitle'), { body: i18n.t('notification.setupBody') });
    }
    return permission;
  }

  /**
   * Shows a notification using the service worker (better for background).
   */
  async showNotification(title: string, options: NotificationOptions = {}) {
    if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) return;
    if (window.Notification.permission !== 'granted') return;

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
      new window.Notification(title, options);
    }
  }

  /**
   * Schedules or triggers notifications based on user data and current time.
   * This should be called regularly (e.g., every minute).
   */
  checkAndTrigger(userData: UserData, currentTime: Date, todayStr: string) {
    if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) return;
    if (window.Notification.permission !== 'granted') return;

    const currentHM = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    const dayOfWeek = currentTime.getDay();

    // 1. Check Wake-up Time
    const hasCheckedInToday = userData.lastCheckInDate === todayStr;
    if (userData.isWakeUpAlarmEnabled !== false && userData.targetWakeUpTime === currentHM && !hasCheckedInToday) {
      const key = `wakeup-${todayStr}-${currentHM}`;
      if (!this.lastTriggered.has(key)) {
        this.showNotification(i18n.t('notification.wakeupTitle'), {
          body: i18n.t('notification.wakeupBody'),
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
          this.showNotification(i18n.t('notification.routineStart', { name: chunk.name }), {
            body: chunk.purpose || i18n.t('notification.routineStartBody'),
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
