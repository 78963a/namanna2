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
  forcedActiveDates?: string[];
  scheduleType: 'days';
  scheduledDays: number[]; // 0-6
  isAlarmEnabled?: boolean;
  lastAlarmTriggeredDate?: string;
  startType?: 'anytime' | 'situation' | 'time';
  situation?: string;
  activeTaskId?: string;
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
  targetTime: string; // HH:mm
  status: '달성' | '지각' | '미기록';
}

export interface RoutineGroupHistoryEntry {
  date: string;
  groupId: string;
  isActive: boolean;
  firstTaskStartTime: string | null; // HH:mm:ss
  completionStatus: '비활성' | '미실행' | '미완료' | '전체완료';
  completedAt: string | null; // HH:mm:ss
  totalDuration: number; // seconds
  selectedPhrase?: string;
  satisfaction?: number;
  closingNote?: string;
}

export interface NextRoutineSuggestion {
  chunkId: string;
  chunkName: string;
  taskId: string;
  taskName: string;
}

export interface TaskHistoryEntry {
  date: string;
  taskId: string;
  groupId: string;
  isActive: boolean;
  duration: number | null; // seconds
  startTime: string | null; // HH:mm:ss
  endTime: string | null;   // HH:mm:ss
  status: string; // '비활성' | '미실행' | '일시정지' | '실행중' | '스킵' | '완벽' | '완료' | '나중에'
}

/**
 * Settings for the "Nagging" (voice guidance) feature.
 */
export interface NaggingSettings {
  startEnabled: boolean;
  restartEnabled: boolean;
  startMessage: string;
  ongoingEnabled: boolean;
  ongoingInterval: number; // minutes
  ongoingMessage: string;
  beforeEndEnabled: boolean;
  beforeEndTime: number; // minutes
  beforeEndMessage: string;
  endEnabled: boolean;
  endMessage: string;
  ongoingTargetTypes?: TaskType[];
  beforeEndTargetTypes?: TaskType[];
  endTargetTypes?: TaskType[];
  overTimeEnabled: boolean;
  overTimeInterval: number; // minutes
  overTimeMessage: string;
  overTimeTargetTypes?: TaskType[];
}

/**
 * Settings for the individual sound effects.
 */
export interface SoundEffectItem {
  enabled: boolean;
  file: string;
}

export interface SoundEffectSettings {
  wakeUpCheckIn: SoundEffectItem;
  triggerRoutineStart: SoundEffectItem;
  individualRoutineComplete: SoundEffectItem;
  routineGroupComplete: SoundEffectItem;
  todayEnd?: SoundEffectItem;
  allGroupsComplete: SoundEffectItem;
  chickSound?: SoundEffectItem;
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
  autoReorderInactiveGroups: boolean;
  autoReorderCompletedGroups: boolean;
  autoReorderInProgressGroups: boolean;
  lastCheckCheckTime: number; // timestamp
  lastResetDate: string | null;
  dailyCheckCheckCounts: { [date: string]: number };
  availableCheckCheckCount?: number; // 캐릭터를 누를 수 있는 잔여 횟수
  lastCheckInBonusCount?: number; // 체크인 후 29분 경과 보너스를 지급한 누적 횟수 (중복 수령 방지)
  dailyCheckIn?: { [date: string]: string }; // date -> time
  dailyTargetWakeUpTime?: { [date: string]: string }; // date -> target time (HH:mm)
  inactiveChunks?: { [date: string]: string[] }; // date -> chunkId[]
  dailyTaskStatus?: { [date: string]: { [taskId: string]: TaskStatus } };
  wakeUpTimeHistory?: WakeUpTimeHistoryEntry[];
  routineGroupHistory?: RoutineGroupHistoryEntry[];
  taskHistory?: TaskHistoryEntry[];
  dailyResetHour?: number; // 0-4
  firstRoutineAutoStart?: boolean;
  nextRoutineAutoStart?: boolean;
  nextRoutineGroupGuidanceEnabled?: boolean;
  userName?: string;
  forcedActiveTasks?: { [date: string]: { [taskId: string]: boolean } };
  dailyActivityLog?: { [date: string]: number[] };
  lastPerfectDayAnimationDate?: string; // YYYY-MM-DD
  lastTodayEndAnimationDate?: string; // YYYY-MM-DD
  isVoiceEnabled?: boolean;
  isWakeUpAlarmEnabled?: boolean;
  naggingSettings?: NaggingSettings;
  naggingSettingsByLang?: { [lang: string]: NaggingSettings };
  soundSettings?: SoundEffectSettings;
  hideAnytimeTimer?: boolean;
  autoNextAccumulatedRoutine?: boolean;
  darkModeTheme?: 'light' | 'dark';
  darkModeFollowSystem?: boolean;
  completionTemplatesByLang?: { [lang: string]: string[] };
}

/**
 * Represents the sub-view state within the settings screen.
 */
export interface SettingsSubView {
  type: 'main' | 'detail' | 'nagging' | 'sound' | 'groupStats' | 'completionPhrases';
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
  effectiveDate: Date;
  activityLog: number[];
}

export interface HomeViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  currentTime: Date;
  effectiveDate: Date;
  todayStr: string;
  handleCheckIn: () => void;
  handleLateCheckIn: () => void;
  setSelectedChunkId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  startTask: (taskId: string) => void;
  toggleInactive: (chunkId: string) => void;
  getChunkStatus: (chunk: RoutineChunk) => string;
  globalActiveTask: { chunkId: string; task: Task } | null;
  setConfirmModal: (modal: any) => void;
  onEnterExecution: (chunkId: string) => void;
  onRestart?: (taskId: string) => void;
  togglePauseTask?: (taskId: string, forceStart?: boolean) => void;
  menuBarProps?: any;
  challengeDays?: number;
  successDays?: number;
  currentDayActivityLog?: number[];
  formattedDate?: string;
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
  effectiveDate: Date;
  todayStr: string;
  toggleTask: (taskId: string, closingData?: { note?: string, satisfaction?: number }) => void;
  togglePauseTask: (taskId: string) => void;
  laterTask: (taskId: string) => void;
  skipTask: (taskId: string) => void;
  startTask: (taskId: string, resetTimer?: boolean, forceStart?: boolean) => void;
  onRestart: (taskId: string, resetTimer?: boolean) => void;
  resetChunk: (chunkId: string) => void;
  setSettingsSubView: (view: SettingsSubView) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setSelectedChunkId: (id: string | null) => void;
  handleCheckCheckClick: () => void;
  isCheckCheckAvailable: boolean;
  setConfirmModal: (modal: any) => void;
  setStatsKey?: React.Dispatch<React.SetStateAction<number>>;
  setSelectedTaskForStats?: (id: string | null) => void;
  onEnterExecution?: (chunkId: string) => void;
  onGroupCompleted?: (chunkId: string) => void;
  menuBarProps?: any;
}

export interface AddRoutineGroupViewProps {
  addChunk: (
    name: string, 
    purpose: string, 
    tasks: Task[], 
    scheduleType: 'days', 
    scheduledDays: number[], 
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
