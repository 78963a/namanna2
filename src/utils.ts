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
  const m = Math.floor(normalized % 60);
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
 * Formats a duration in seconds into a human-readable string (X분 Y초).
 * @param {number} seconds - The duration in seconds.
 * @returns {string} The formatted duration string.
 */
export const formatDurationPrecise = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
};

/**
 * Returns the appropriate Korean postposition based on the final consonant of the input text.
 * 
 * @param {string} text - The input text to check
 * @param {string} type - The type of particle ('이/가', '을/를', '은/는')
 * @returns {string} The correct particle
 */
export const getJosa = (text: string, type: '이/가' | '을/를' | '은/는'): string => {
  if (!text) return type.split('/')[1];
  const lastChar = text.charCodeAt(text.length - 1);
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) return type.split('/')[1]; // Not a Korean character
  const hasBatchim = (lastChar - 0xAC00) % 28 > 0;
  
  const [withBatchim, withoutBatchim] = type.split('/');
  return hasBatchim ? withBatchim : withoutBatchim;
};

/**
 * Calculates the current duration of a task in seconds.
 * Handles midnight rollover and small clock jitters.
 * 
 * @param {Task} task - The task to calculate duration for
 * @param {Date} currentTime - The reference current time
 * @returns {number} Total duration in seconds
 */
export const calculateTaskDuration = (task: Task, currentTime: Date): number => {
  let currentSession = 0;
  if (task.startTime && !task.isPaused) {
    const [h, m, s] = task.startTime.split(':').map(Number);
    const start = new Date(currentTime);
    start.setHours(h, m, s, 0);
    
    // If start time is significantly in the future (e.g., > 1 minute),
    // it likely means the task started before midnight.
    // We use a 1-minute buffer to avoid issues with small clock jitters
    // where startTime might be a few milliseconds ahead of currentTime.
    if (start.getTime() > currentTime.getTime() + 60000) {
      start.setDate(start.getDate() - 1);
    }
    
    currentSession = Math.max(0, Math.floor((currentTime.getTime() - start.getTime()) / 1000));
  }
  return (task.accumulatedDuration || 0) + currentSession;
};
