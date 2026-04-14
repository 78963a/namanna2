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
  targetDuration?: number; // minutes
  taskType?: TaskType;
  startTime?: string; // HH:mm:ss
  endTime?: string;   // HH:mm:ss
  duration?: number;  // seconds
  givenUp?: boolean;
  laterTimestamp?: number;
  isPaused?: boolean;
  accumulatedDuration?: number; // seconds
  scheduledDays?: number[]; // 0-6 (Sun-Sat)
  closingNote?: string;
  satisfaction?: number;
  checklist?: ChecklistItem[];
  status?: TaskStatus;
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
  PERFECT = 'perfect',
  FAILED = 'failed',
  LATER = 'later',
  SKIP = 'skip'
}

export interface WakeUpTimeHistoryEntry {
  date: string;
  wakeUpTime: string; // HH:mm:ss
}

export interface RoutineGroupHistoryEntry {
  date: string;
  groupId: string;
  isActive: boolean;
  firstTaskStartTime: string | null; // HH:mm:ss
  completionStatus: '비활성' | '미실행' | '미완료' | '전체완료';
  completedAt: string | null; // HH:mm:ss
  totalDuration: number; // seconds
  satisfaction?: number;
  closingNote?: string;
}

export interface TaskHistoryEntry {
  date: string;
  taskId: string;
  groupId: string;
  isActive: boolean;
  duration: number; // seconds
  status: string; // '미실행' | '일시정지' | '실행중' | '스킵' | '완벽' | '완료'
}

/**
 * Represents the entire state of the user's data.
 */
export interface UserData {
  completionRate: number;
  streak: number;
  lastCheckInDate: string | null;
  targetWakeUpTime: string; // HH:mm format
  routineChunks: RoutineChunk[];
  history: WakeUpRecord[];
  startDate: string | null;
  dailyCompletionRate: { [date: string]: number };
  resetTime: string; // HH:mm format
  autoReorderGroups: boolean;
  lastCheckCheckTime: number; // timestamp
  lastResetDate: string | null;
  dailyCheckCheckCounts: { [date: string]: number };
  dailyCheckIn?: { [date: string]: string }; // date -> time
  inactiveChunks?: { [date: string]: string[] }; // date -> chunkId[]
  dailyTaskStatus?: { [date: string]: { [taskId: string]: TaskStatus } };
  wakeUpTimeHistory?: WakeUpTimeHistoryEntry[];
  routineGroupHistory?: RoutineGroupHistoryEntry[];
  taskHistory?: TaskHistoryEntry[];
}

/**
 * Represents the sub-view state within the settings screen.
 */
export interface SettingsSubView {
  type: 'main' | 'detail';
  chunkId?: string;
}

export type StatsTab = 'wake-up' | 'relative';

export interface HeaderBoxProps {
  userData: UserData;
  todayStr: string;
  formattedDate: string;
  challengeDays: number;
  successDays: number;
  currentTime: Date;
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
  onEnterExecution: (chunkId: string) => void;
}

export interface StatsViewProps {
  userData: UserData;
  chartData: any[];
  relativeChartData: any[];
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
  toggleTask: (taskId: string, closingData?: { note?: string, satisfaction?: number }) => void;
  togglePauseTask: (taskId: string) => void;
  laterTask: (taskId: string) => void;
  giveUpTask: (taskId: string) => void;
  startTask: (taskId: string, resetTimer?: boolean) => void;
  onRestart: (taskId: string, resetTimer?: boolean) => void;
  resetChunk: (chunkId: string) => void;
  setSettingsSubView: (view: SettingsSubView) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setSelectedChunkId: (id: string | null) => void;
  handleCheckCheckClick: () => void;
  isSad: boolean;
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
