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
  const dateStr = formatDate(date);
  if (chunk.inactiveDates?.includes(dateStr)) return false;
  if (chunk.forcedActiveDates?.includes(dateStr)) return true;
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  return chunk.scheduledDays.includes(day);
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
  const dateStr = formatDate(date);
  if (userData.forcedActiveTasks?.[dateStr]?.[task.id]) return true;

  if (chunk.forcedActiveDates?.includes(dateStr)) {
    // If the chunk is forced active, the task is active unless it has its own scheduledDays
    // and those days are specifically set and don't include today.
    // However, if task.scheduledDays matches chunk.scheduledDays, it should show up.
    if (!task.scheduledDays) return true;
    
    // If task has specific days, we only show it if it's one of those days
    // OR if its days are identical to the chunk's days (meaning it's just following the group).
    const isSameSchedule = JSON.stringify([...task.scheduledDays].sort()) === JSON.stringify([...chunk.scheduledDays].sort());
    if (isSameSchedule) return true;

    return task.scheduledDays.includes(date.getDay());
  }

  if (!isChunkScheduledToday(chunk, date, userData)) return false;
  if (!task.scheduledDays) return true;
  return task.scheduledDays.includes(date.getDay());
};

/**
 * Checks if a specific task should be counted for statistics performance calculation.
 * According to Rule 10.2.8:
 * - State (A) and (D) are recorded normally.
 * - State (B) (User skipped scheduled rest) is counted as a target (failure if not done).
 * - State (C) (Normal inactive) is NOT a target.
 * 
 * @param {Task} task - The task to check
 * @param {RoutineChunk} chunk - The parent routine group
 * @param {Date} date - The date to check against
 * @param {UserData} userData - The current user data
 * @returns {boolean} True if should be counted for stats, false otherwise
 */
export const isTaskTargetForStats = (task: Task, chunk: RoutineChunk, date: Date, userData: UserData): boolean => {
  const dateStr = formatDate(date);
  
  // (D) Forced Active: Not scheduled day but user forced it
  const isForcedActive = userData.forcedActiveTasks?.[dateStr]?.[task.id] || chunk.forcedActiveDates?.includes(dateStr);
  if (isForcedActive) return true;

  // Check if it's a scheduled day
  const isScheduledDay = chunk.scheduledDays.includes(date.getDay());
  
  // If it's a scheduled day:
  // - (A) normal active (not in inactiveDates)
  // - (B) manual rested (in inactiveDates) -> COUNTS as failure target per Rule 94
  if (isScheduledDay) {
    if (!task.scheduledDays) return true;
    return task.scheduledDays.includes(date.getDay());
  }

  // (C) Normal Inactive: Not scheduled and not forced -> NOT a target per Rule 95
  return false;
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
 * Returns the effective date object based on the reset hour.
 * If the current hour is less than the reset hour, it returns the previous day's date.
 * 
 * @param {Date} date - The current date/time
 * @param {number} resetHour - The hour (0-23) when the day resets
 * @returns {Date} Effective date object
 */
export const getEffectiveDateObject = (date: Date, resetHour: number): Date => {
  const d = new Date(date);
  if (d.getHours() < resetHour) {
    d.setDate(d.getDate() - 1);
  }
  return d;
};

/**
 * Returns the effective date string (YYYY-MM-DD) based on the reset hour.
 * If the current hour is less than the reset hour, it returns the previous day's date.
 * 
 * @param {Date} date - The current date/time
 * @param {number} resetHour - The hour (0-23) when the day resets
 * @returns {string} Effective date string
 */
export const getEffectiveDate = (date: Date, resetHour: number): string => {
  return formatDate(getEffectiveDateObject(date, resetHour));
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
 * @param {string} type - The type of particle ('이/가', '을/를', '은/는', '으로/로', etc.)
 * @returns {string} The correct particle
 */
export const getJosa = (text: string, type: '이/가' | '을/를' | '은/는' | '으로/로' | '이' | '가' | '을' | '를' | '은' | '는' | '으로' | '로'): string => {
  if (!text) return type.split('/')[1] || type;
  
  // Mapping for single particle inputs
  const map: Record<string, string> = {
    '이': '이/가', '가': '이/가',
    '을': '을/를', '를': '을/를',
    '은': '은/는', '는': '은/는',
    '으로': '으로/로', '로': '으로/로'
  };
  
  const targetType = map[type] || type;
  const lastChar = text.charCodeAt(text.length - 1);
  
  // Handle numbers ending
  const isNumber = /[0-9]$/.test(text);
  let hasBatchim = false;
  
  if (isNumber) {
    const lastDigit = text[text.length - 1];
    // Numbers ending in 2, 4, 5, 9 (and English names for 1, 3, 6, 7, 8, 0 if treated as digits)
    // In Korean: 0(영), 1(일), 2(이), 3(삼), 4(사), 5(오), 6(육), 7(칠), 8(팔), 9(구)
    // Batchim: 0(ㅇ), 1(ㄹ), 3(ㅁ), 6(ㄱ), 7(ㄹ), 8(ㄹ)
    hasBatchim = ['0', '1', '3', '6', '7', '8'].includes(lastDigit);
  } else if (lastChar >= 0xAC00 && lastChar <= 0xD7A3) {
    hasBatchim = (lastChar - 0xAC00) % 28 > 0;
  } else {
    // Fallback for non-Korean/non-number characters
    return targetType.split('/')[1] || targetType;
  }
  
  const [withBatchim, withoutBatchim] = targetType.split('/');
  
  // Special case for '으로/로': 'ㄹ' batchim follows the 'withoutBatchim' rule
  if (targetType === '으로/로') {
    if (isNumber) {
      // 1(일), 7(칠), 8(팔) end in 'ㄹ'
      const isL = ['1', '7', '8'].includes(text[text.length - 1]);
      return isL ? withoutBatchim : (hasBatchim ? withBatchim : withoutBatchim);
    }
    const jong = (lastChar - 0xAC00) % 28;
    if (jong === 8) return withoutBatchim; // 'ㄹ'
  }
  
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
  if (!task) return 0;
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
