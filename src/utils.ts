import { RoutineChunk, UserData, Task, WakeUpRecord } from './types';

/**
 * Converts a time string (HH:mm) to total minutes from the start of the day.
 * 
 * @param {string} timeStr - Time string in HH:mm format
 * @returns {number} Total minutes
 */
export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Converts total minutes into a time string (HH:mm).
 * 
 * @param {number} minutes - The total minutes.
 * @returns {string} The formatted time string.
 */
export const minutesToTime = (minutes: number): string => {
  let normalized = minutes % 1440;
  if (normalized < 0) normalized += 1440;
  const h = Math.floor(normalized / 60);
  const m = Math.round(normalized % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Checks if a routine group (chunk) is scheduled for a specific date.
 * 
 * @param {RoutineChunk} chunk - The routine group to check
 * @param {Date} date - The date to check against
 * @param {UserData} userData - The current user data
 * @returns {boolean} True if scheduled, false otherwise
 */
export const isChunkScheduledToday = (chunk: RoutineChunk, date: Date, userData: UserData): boolean => {
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  
  if (chunk.scheduleType === 'days') {
    return chunk.scheduledDays.includes(day);
  }
  
  // For weekly, monthly, yearly: check frequency vs completion count in period
  const getStartOfPeriod = (type: string, d: Date) => {
    const start = new Date(d);
    if (type === 'weekly') {
      const day = d.getDay();
      start.setDate(d.getDate() - day);
    } else if (type === 'monthly') {
      start.setDate(1);
    } else if (type === 'yearly') {
      start.setMonth(0, 1);
    }
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfPeriod = getStartOfPeriod(chunk.scheduleType, date);
  const completionsInPeriod = (chunk.completionDates || []).filter(d => new Date(d) >= startOfPeriod).length;
  
  return completionsInPeriod < (chunk.frequency || 1);
};

/**
 * Checks if a specific task is scheduled for today.
 * 
 * @param {Task} task - The task to check
 * @param {RoutineChunk} chunk - The parent routine group
 * @param {Date} date - The date to check against
 * @param {UserData} userData - The current user data
 * @returns {boolean} True if scheduled, false otherwise
 */
export const isTaskScheduledToday = (task: Task, chunk: RoutineChunk, date: Date, userData: UserData): boolean => {
  if (!isChunkScheduledToday(chunk, date, userData)) return false;
  if (!task.scheduledDays) return true;
  return task.scheduledDays.includes(date.getDay());
};

/**
 * Formats a Date object into a YYYY-MM-DD string.
 * 
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Calculates the average wake-up time from a list of records.
 * 
 * @param {WakeUpRecord[]} history - List of wake-up records
 * @returns {string} Average time in HH:mm format
 */
export const getAverageWakeUpTime = (history: WakeUpRecord[]): string => {
  if (history.length === 0) return '--:--';
  const totalMinutes = history.reduce((acc, curr) => {
    const [h, m] = curr.time.split(':').map(Number);
    return acc + h * 60 + m;
  }, 0);
  const avgMinutes = Math.floor(totalMinutes / history.length);
  return minutesToTime(avgMinutes);
};

/**
 * Calculates the number of days between two date strings (inclusive).
 * @param {string} date1 - The start date string (YYYY-MM-DD).
 * @param {string} date2 - The end date string (YYYY-MM-DD).
 * @returns {number} The number of days.
 */
export const getDaysBetween = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Calculates the current consecutive day streak based on completion dates.
 * @param {string[]} completionDates - List of dates when the routine was completed.
 * @param {string} todayStr - Today's date string (YYYY-MM-DD).
 * @returns {number} The streak count.
 */
export const getConsecutiveCompletionDays = (completionDates: string[], todayStr: string): number => {
  if (!completionDates || completionDates.length === 0) return 0;
  const sortedDates = [...new Set(completionDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let count = 0;
  let checkDate = new Date(todayStr);
  
  // If today is completed, start from today. Otherwise, start from yesterday to check the streak.
  if (sortedDates.includes(todayStr)) {
    while (true) {
      const dateStr = formatDate(checkDate);
      if (sortedDates.includes(dateStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const dateStr = formatDate(checkDate);
      if (sortedDates.includes(dateStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  return count;
};

/**
 * Formats a duration in seconds into a human-readable string (X분 Y초).
 * @param {number} seconds - The duration in seconds.
 * @returns {string} The formatted duration string.
 */
export const formatDurationPrecise = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
};
