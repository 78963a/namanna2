import React from 'react';

/**
 * Represents the type of a routine task.
 */
export enum TaskType {
  TIME_INDEPENDENT = '시간무관루틴',
  TIME_LIMITED = '시간제한루틴',
  TIME_ACCUMULATED = '시간누적루틴',
}

/**
 * Represents an individual item in a checklist.
 */
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

/**
 * Represents a single task within a routine group.
 */
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  points: number; // 1-10 absolute points
  targetDuration?: number; // minutes
  taskType?: TaskType;
  startTime?: string; // HH:mm:ss
  endTime?: string;   // HH:mm:ss
  duration?: number;  // seconds
  givenUp?: boolean;
  laterTimestamp?: number;
  isPaused?: boolean;
  accumulatedDuration?: number; // seconds
  earnedPoints?: number;
  scheduledDays?: number[]; // 0-6 (Sun-Sat)
  isClosingRoutine?: boolean;
  closingNote?: string;
  closingPhoto?: string;
  satisfaction?: number;
  checklist?: ChecklistItem[];
}

/**
 * Represents a group of tasks (a routine chunk).
 */
export interface RoutineChunk {
  id: string;
  name: string;
  tasks: Task[];
  startTime?: string;
  duration?: number;
  endTime?: string;
  purpose?: string;
  completionDates?: string[];
  inactiveDates?: string[];
  scheduleType: 'days' | 'weekly' | 'monthly' | 'yearly';
  scheduledDays: number[]; // 0-6
  frequency?: number;
  isAlarmEnabled?: boolean;
  lastAlarmTriggeredDate?: string;
  startType?: 'anytime' | 'situation' | 'time';
  situation?: string;
}

/**
 * Represents a record of a wake-up event.
 */
export interface WakeUpRecord {
  date: string;
  time: string; // HH:mm:ss
}

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  LATER = 'later',
  GIVEN_UP = 'given_up'
}

/**
 * Represents the entire state of the user's data.
 */
export interface UserData {
  points: number;
  completionRate: number;
  streak: number;
  lastCheckInDate: string | null;
  targetWakeUpTime: string; // HH:mm format
  routineChunks: RoutineChunk[];
  history: WakeUpRecord[];
  startDate: string | null;
  dailyPoints: { [date: string]: number };
  dailyCompletionRate: { [date: string]: number };
  resetTime: string; // HH:mm format
  lastCheckCheckTime: number; // timestamp
  lastResetDate: string | null;
  dailyCheckCheckCounts: { [date: string]: number };
  dailyCheckInPoints: { [date: string]: number };
  dailyCheckIn?: { [date: string]: string }; // date -> time
  inactiveChunks?: { [date: string]: string[] }; // date -> chunkId[]
  dailyTaskStatus?: { [date: string]: { [taskId: string]: TaskStatus } };
}

/**
 * Represents the sub-view state within the settings screen.
 */
export interface SettingsSubView {
  type: 'main' | 'detail';
  chunkId?: string;
}

export type StatsTab = 'wake-up' | 'relative' | 'absolute';

export interface HeaderBoxProps {
  userData: UserData;
  todayStr: string;
  formattedDate: string;
  weather: { icon: React.ReactNode; temp: number } | null;
  challengeDays: number;
  successDays: number;
  currentTime: Date;
}

export interface PointSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export interface HomeViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  currentTime: Date;
  todayStr: string;
  handleCheckIn: () => void;
  handleLateCheckIn: () => void;
  setSelectedChunkId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  startTask: (taskId: string) => void;
  toggleInactive: (chunkId: string) => void;
  getChunkStatus: (chunk: RoutineChunk) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  globalActiveTask: { chunkId: string; task: Task } | null;
  setConfirmModal: (modal: any) => void;
}

export interface StatsViewProps {
  userData: UserData;
  chartData: any[];
  relativeChartData: any[];
  absoluteChartData: any[];
  averageWakeUpTime: string;
  activeStatsTab: StatsTab;
  setActiveStatsTab: (tab: StatsTab) => void;
}

export interface ExecutionViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  selectedChunkId: string | null;
  setActiveTab: (tab: string) => void;
  currentTime: Date;
  todayStr: string;
  toggleTask: (taskId: string, closingData?: { note?: string, photo?: string, satisfaction?: number }) => void;
  togglePauseTask: (taskId: string) => void;
  laterTask: (taskId: string) => void;
  giveUpTask: (taskId: string) => void;
  startTask: (taskId: string) => void;
  onRestart: (taskId: string) => void;
  resetChunk: (chunkId: string) => void;
  setSettingsSubView: (view: SettingsSubView) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

export interface AddRoutineGroupViewProps {
  addChunk: (
    name: string, 
    purpose: string, 
    tasks: Task[], 
    scheduleType: 'days' | 'weekly' | 'monthly' | 'yearly', 
    scheduledDays: number[], 
    frequency?: number,
    startTime?: string,
    isAlarmEnabled?: boolean,
    startType?: 'anytime' | 'situation' | 'time',
    situation?: string
  ) => void;
  setActiveTab: (tab: string) => void;
  setSettingsSubView: (view: SettingsSubView) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  userData: UserData;
}

export interface SettingsViewProps {
  userData: UserData;
  renderSettingsContent: (mode: 'main' | 'modal') => React.ReactNode;
}
