import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import localForage from 'localforage';
import confetti from 'canvas-confetti';
import { 
  UserData, 
  Task, 
  RoutineChunk, 
  TaskStatus, 
  TaskType, 
  WakeUpTimeHistoryEntry, 
  RoutineGroupHistoryEntry, 
  TaskHistoryEntry,
  SettingsSubView
} from '../types';
import phrases from '../phrases.json';
import { STORAGE_KEY } from '../constants';
import { 
  isTaskScheduledToday, 
  formatDate, 
  getEffectiveDateObject,
  calculateTaskDuration,
  getJosa
} from '../utils';
import { getNaggingDefaultSettings, healNaggingSettings } from '../utils/naggingDefaults';
import { useCheckCheckBox } from './useCheckCheckBox';
import { soundService } from '../services/soundService';
import { voiceService } from '../services/voiceService';
import { notificationService } from '../services/notificationService';

// Audio and Speech Sequential helpers
const playAudioAsync = (path: string, isEnabled: boolean): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (!isEnabled) {
      resolve();
      return;
    }
    try {
      const resolveFullPath = (p: string): string => {
        if (p.startsWith('http') || p.startsWith('data:')) return p;
        let adjustedPath = p;
        if (p.startsWith('public/')) {
          adjustedPath = '/' + p.slice(7);
        }
        if (adjustedPath.includes('bbo-yong.mp3')) {
          return 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
        }
        const baseUrl = (import.meta.env && import.meta.env.BASE_URL) || '/';
        const normalizedPath = adjustedPath.startsWith('/') ? adjustedPath.slice(1) : adjustedPath;
        return baseUrl.endsWith('/') ? `${baseUrl}${normalizedPath}` : `${baseUrl}/${normalizedPath}`;
      };

      const fullPath = resolveFullPath(path);
      const audio = new Audio(fullPath);
      audio.preload = 'auto';
      audio.addEventListener('ended', () => resolve());
      audio.addEventListener('error', () => resolve());
      audio.play().catch((err) => {
        console.warn('Audio play failed in auto-next sequential player:', err);
        resolve();
      });
    } catch (e) {
      console.error(e);
      resolve();
    }
  });
};

const speakAsync = (message: string, isEnabled: boolean, variables?: any): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (!isEnabled || !message || typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      let msg = message;
      if (variables) {
        const { name = '', task = '', n = 0, m = 0, r = 0 } = variables;
        const josaRegex = /(name|task)(이\/가|을\/를|은\/는|으로\/로|이죠\/죠|이야\/야|이다\/다)/g;
        msg = msg.replace(josaRegex, (_match, variable, p1) => {
          const val = variable === 'name' ? name : task;
          return val + getJosa(val, p1 as any);
        });
        
        // Use updated placeholder replacement logic to prevent replacing 'task' in 'taskHistory' etc.
        const placeholderRegex = /(?<![a-zA-Z])(name|task|n|m|r)(?![a-zA-Z])/g;
        msg = msg.replace(placeholderRegex, (match) => {
          if (match === 'name') return name;
          if (match === 'task') return task;
          if (match === 'n') return n.toString();
          if (match === 'm') return m.toString();
          if (match === 'r') return r.toString();
          return match;
        });
      }

      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = 'ko-KR';
      const voices = synth.getVoices();
      const voice = voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko')) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    } catch (e) {
      console.error(e);
      resolve();
    }
  });
};

const rebuildActivityLogs = (userData: UserData, now: Date, existingLogState?: Record<string, number[]>): Record<string, number[]> => {
  const logs: Record<string, number[]> = { 
    ...(userData.dailyActivityLog || {}),
    ...(existingLogState || {})
  };
  const [resetH] = (userData.resetTime || '00:00').split(':').map(Number);

  const todayCalStr = formatDate(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayCalStr = formatDate(yesterday);
  const datesToRebuild = [yesterdayCalStr, todayCalStr];

  const getCalendarDate = (effDateStr: string, timeStr: string): Date | null => {
    if (!timeStr) return null;
    const parts = effDateStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const effDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    const [h, m, s] = timeStr.split(':').map(Number);
    
    const d = new Date(effDate);
    if (h >= resetH) {
      d.setHours(h, m, s || 0, 0);
    } else {
      d.setDate(d.getDate() + 1);
      d.setHours(h, m, s || 0, 0);
    }
    return d;
  };

  const getResetTimeOfDate = (effDateStr: string): Date | null => {
    const parts = effDateStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    d.setHours(resetH, 0, 0, 0);
    return d;
  };

  const currentEffDateStr = formatDate(getEffectiveDateObject(now, resetH));

  datesToRebuild.forEach(calDateStr => {
    const parts = calDateStr.split('-').map(Number);
    if (parts.length !== 3) return;
    
    const existingLog = logs[calDateStr];
    const log = existingLog ? [...existingLog] : new Array(1440).fill(0);

    for (let m = 0; m < 1440; m++) {
      const minuteDate = new Date(parts[0], parts[1] - 1, parts[2], Math.floor(m / 60), m % 60, 0, 0);
      
      if (minuteDate > now) {
        log[m] = 0;
        continue;
      }

      // 3. 이미 기록된 타임라인 색상을 이후에 추적해서 역산해서 채워넣거나 수정하지는 말아줘.
      if (existingLog && existingLog[m] !== 0) {
        continue;
      }

      let timerRunning = false;

      userData.routineChunks.forEach(chunk => {
        chunk.tasks.forEach(task => {
          if (task.startTime && task.status === TaskStatus.IN_PROGRESS && !task.isPaused && !task.completed) {
            const startCalDate = getCalendarDate(currentEffDateStr, task.startTime);
            const resetCalDate = getResetTimeOfDate(currentEffDateStr);
            if (startCalDate && resetCalDate) {
              const endCalDate = now > resetCalDate ? resetCalDate : now;
              if (minuteDate >= startCalDate && minuteDate <= endCalDate) {
                timerRunning = true;
              }
            }
          }
        });
      });

      if (userData.taskHistory) {
        userData.taskHistory.forEach(entry => {
          if (entry.startTime) {
            const startCalDate = getCalendarDate(entry.date, entry.startTime);
            let endCalDate: Date | null = null;
            if (entry.endTime) {
              endCalDate = getCalendarDate(entry.date, entry.endTime);
            } else if (entry.duration) {
              if (startCalDate) {
                endCalDate = new Date(startCalDate.getTime() + entry.duration * 1000);
              }
            } else {
              endCalDate = getResetTimeOfDate(entry.date);
            }

            if (startCalDate && endCalDate) {
              if (minuteDate >= startCalDate && minuteDate <= endCalDate) {
                timerRunning = true;
              }
            }
          }
        });
      }

      if (timerRunning) {
        log[m] = 3; // 타이머 실행 중 background
      } else {
        log[m] = 1; // 비활성 black
      }
    }

    logs[calDateStr] = log;
  });

  return logs;
};

export interface UseRoutineManagerProps {
  activeTab: string;
  selectedChunkId: string | null;
}

export const useRoutineManager = (_props: UseRoutineManagerProps) => {
  const { i18n } = useTranslation();

  // --- Core States ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isForeground, setIsForeground] = useState(true);
  const [activityLog, setActivityLog] = useState<Record<string, number[]>>({});

  const [userData, setUserData] = useState<UserData>({
    completionRate: 0,
    streak: 0,
    lastCheckInDate: null,
    targetWakeUpTime: '07:00',
    routineChunks: [],
    history: [],
    startDate: formatDate(new Date()),
    dailyCompletionRate: {},
    resetTime: '00:00',
    dailyResetHour: 0,
    lastCheckCheckTime: Date.now(),
    lastResetDate: null,
    dailyCheckCheckCounts: {},
    availableCheckCheckCount: 5,
    lastCheckInBonusCount: 0,
    autoReorderInactiveGroups: true,
    autoReorderCompletedGroups: true,
    autoReorderInProgressGroups: true,
    firstRoutineAutoStart: false,
    nextRoutineAutoStart: false,
    nextRoutineGroupGuidanceEnabled: false,
    hideAnytimeTimer: false,
    autoNextAccumulatedRoutine: false,
    darkModeTheme: 'light',
    darkModeFollowSystem: false,
    userName: '나',
    isVoiceEnabled: true,
    isWakeUpAlarmEnabled: false,
    naggingSettings: getNaggingDefaultSettings('ko'),
    naggingSettingsByLang: {
      ko: getNaggingDefaultSettings('ko'),
      en: getNaggingDefaultSettings('en'),
      ja: getNaggingDefaultSettings('ja')
    },
    soundSettings: {
      wakeUpCheckIn: { enabled: true, file: '/sounds/freesound_community-success-fanfare-trumpets-6185.mp3' },
      triggerRoutineStart: { enabled: true, file: '/sounds/driken5482-applause-cheer-236786.mp3' },
      individualRoutineComplete: { enabled: true, file: '/sounds/tithuh-level-up-523624.mp3' },
      routineGroupComplete: { enabled: true, file: '/sounds/dragon-studio-fireworks-02-419019.mp3' },
      todayEnd: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
      allGroupsComplete: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
      chickSound: { enabled: true, file: 'public/sounds/nikin-short-chick-sound-171389.mp3' }
    }
  });

  const todayStr = useMemo(() => {
    const [resetH] = userData.resetTime.split(':').map(Number);
    const effDate = getEffectiveDateObject(currentTime, resetH);
    return formatDate(effDate);
  }, [currentTime, userData.resetTime]);

  const effectiveDate = useMemo(() => {
    const [resetH] = userData.resetTime.split(':').map(Number);
    return getEffectiveDateObject(currentTime, resetH);
  }, [todayStr, userData.resetTime]);

  const globalActiveTask = useMemo(() => {
    for (const chunk of userData.routineChunks) {
      const active = chunk.tasks.find(t => 
        t.startTime && 
        !t.isPaused && 
        !t.completed && 
        t.status !== TaskStatus.SKIP && 
        t.status !== TaskStatus.COMPLETED && 
        t.status !== TaskStatus.PERFECT
      );
      if (active) return { task: active, chunkId: chunk.id };
    }
    return null;
  }, [userData.routineChunks]);

  const {
    checkCheckIconId,
    isCheckCheckAvailable,
    handleCheckCheckClick,
    addAvailableCheckCheckPoints
  } = useCheckCheckBox(userData, setUserData, todayStr);

  // --- UI/Animation/Message States ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<SettingsSubView>({ type: 'main' });
  const [lastCompletedTaskName, setLastCompletedTaskName] = useState<string | null>(null);
  const [activeAlarmChunk, setActiveAlarmChunk] = useState<RoutineChunk | null>(null);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [groupAddedMessage, setGroupAddedMessage] = useState<string | null>(null);
  const [resetPauseModal, setResetPauseModal] = useState<{ isOpen: boolean, taskTitle: string | null }>({ isOpen: false, taskTitle: null });

  // --- Refs ---
  const prevLanguageRef = useRef(i18n.language);
  const isAutoNextTransitioningRef = useRef<boolean>(false);
  const lastProcessedStartTimeRef = useRef<{ taskId: string; startTime: string } | null>(null);
  const lastLoggedMinuteRef = useRef<number>(-1);

  // Sync nagging settings when language changes
  useEffect(() => {
    if (!isDataLoaded) {
      prevLanguageRef.current = i18n.language;
      return;
    }
    const oldLang = prevLanguageRef.current;
    const newLang = i18n.language;
    if (oldLang && newLang && oldLang !== newLang) {
      setUserData(prev => {
        const naggingSettingsByLang = prev.naggingSettingsByLang || {};
        const currentNagging = prev.naggingSettings || getNaggingDefaultSettings(oldLang);
        
        const updatedByLang = {
          ...naggingSettingsByLang,
          [oldLang]: currentNagging
        };

        // Heal all lang settings to make sure none have leftover unmodified Korean defaults
        const healedByLang: { [lang: string]: any } = {};
        Object.keys(updatedByLang).forEach(k => {
          healedByLang[k] = healNaggingSettings(updatedByLang[k], k);
        });

        const nextNagging = healNaggingSettings(healedByLang[newLang] || getNaggingDefaultSettings(newLang), newLang);

        return {
          ...prev,
          naggingSettingsByLang: healedByLang,
          naggingSettings: nextNagging
        };
      });
      prevLanguageRef.current = newLang;
    }
  }, [i18n.language, isDataLoaded]);

  // Automatically clear deletionMessage after 3 seconds (Toast message auto-close)
  useEffect(() => {
    if (deletionMessage) {
      const timer = setTimeout(() => {
        setDeletionMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deletionMessage]);

  // Async Load and migration from localStorage to localForage on mount
  useEffect(() => {
    const loadStateAndMigrate = async () => {
      try {
        const today = formatDate(new Date());

        // 1. Try to load from localForage
        let mainData = await localForage.getItem<any>(STORAGE_KEY);
        let activityLogData = await localForage.getItem<Record<string, number[]>>('routine_activity_log');

        // 2. Migration from localStorage if localForage is empty but localStorage has data
        const oldMainDataStr = localStorage.getItem(STORAGE_KEY);
        const oldActivityLogStr = localStorage.getItem('routine_activity_log');

        if (!mainData && oldMainDataStr) {
          console.log('Migrating main data from localStorage to localForage...');
          try {
            mainData = JSON.parse(oldMainDataStr);
            await localForage.setItem(STORAGE_KEY, mainData);
          } catch (e) {
            console.error('Failed to parse and migrate old main data', e);
          }
        }

        if (!activityLogData && oldActivityLogStr) {
          console.log('Migrating activity log from localStorage to localForage...');
          try {
            activityLogData = JSON.parse(oldActivityLogStr);
            await localForage.setItem('routine_activity_log', activityLogData);
          } catch (e) {
            console.error('Failed to parse and migrate old activity log', e);
          }
        }

        // Migrate other separate keys if they exist
        const separateKeys = ['WakeUpTimeHistory', 'RoutineGroupHistory', 'TaskHistory'];
        for (const key of separateKeys) {
          let value = await localForage.getItem<any>(key);
          const oldValueStr = localStorage.getItem(key);
          if (!value && oldValueStr) {
            console.log(`Migrating ${key} from localStorage...`);
            try {
              value = JSON.parse(oldValueStr);
              await localForage.setItem(key, value);
            } catch (e) {
              console.error(`Failed to parse and migrate ${key}`, e);
            }
          }
        }

        // 3. Fallback and Parse userData
        let parsed = mainData || null;

        if (!parsed) {
          parsed = {
            completionRate: 0,
            streak: 0,
            lastCheckInDate: null,
            targetWakeUpTime: '07:00',
            routineChunks: [],
            history: [],
            startDate: today,
            dailyCompletionRate: {},
            resetTime: '00:00',
            dailyResetHour: 0,
            lastCheckCheckTime: Date.now(),
            lastResetDate: null,
            dailyCheckCheckCounts: {},
            availableCheckCheckCount: 5,
            lastCheckInBonusCount: 0,
            autoReorderInactiveGroups: true,
            autoReorderCompletedGroups: true,
            autoReorderInProgressGroups: true,
            firstRoutineAutoStart: false,
            nextRoutineAutoStart: false,
            nextRoutineGroupGuidanceEnabled: false,
            hideAnytimeTimer: false,
            autoNextAccumulatedRoutine: false,
            darkModeTheme: 'light',
            darkModeFollowSystem: false,
            userName: '나',
            isVoiceEnabled: true,
            isWakeUpAlarmEnabled: false,
            naggingSettings: getNaggingDefaultSettings(i18n.language || 'ko')
          };
        }

        if (parsed.darkModeTheme === undefined) parsed.darkModeTheme = 'light';
        if (parsed.darkModeFollowSystem === undefined) parsed.darkModeFollowSystem = false;
        if (parsed.isVoiceEnabled === undefined) parsed.isVoiceEnabled = true;

        const currentLang = i18n.language || 'ko';

        if (parsed.naggingSettingsByLang === undefined) {
          parsed.naggingSettingsByLang = {
            ko: getNaggingDefaultSettings('ko'),
            en: getNaggingDefaultSettings('en'),
            ja: getNaggingDefaultSettings('ja'),
            [currentLang]: parsed.naggingSettings || getNaggingDefaultSettings(currentLang)
          };
        } else {
          // Ensure all default languages exist
          parsed.naggingSettingsByLang = {
            ko: getNaggingDefaultSettings('ko'),
            en: getNaggingDefaultSettings('en'),
            ja: getNaggingDefaultSettings('ja'),
            ...parsed.naggingSettingsByLang
          };
        }

        // Heal all lang settings to make sure none have leftover unmodified Korean defaults
        if (parsed.naggingSettingsByLang) {
          Object.keys(parsed.naggingSettingsByLang).forEach(k => {
            parsed.naggingSettingsByLang[k] = healNaggingSettings(parsed.naggingSettingsByLang[k], k);
          });
        }

        // Always sync the active naggingSettings to the loaded settings for the current language
        parsed.naggingSettings = healNaggingSettings(parsed.naggingSettingsByLang[currentLang] || getNaggingDefaultSettings(currentLang), currentLang);

        if (parsed.naggingSettings) {
          if (parsed.naggingSettings.ongoingTargetTypes === undefined) {
            parsed.naggingSettings.ongoingTargetTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
          }
          if (parsed.naggingSettings.beforeEndTargetTypes === undefined) {
            parsed.naggingSettings.beforeEndTargetTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
          }
          if (parsed.naggingSettings.endTargetTypes === undefined) {
            parsed.naggingSettings.endTargetTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
          }
          if (parsed.naggingSettings.overTimeTargetTypes === undefined) {
            parsed.naggingSettings.overTimeTargetTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
          }
        }

        if (parsed.soundSettings === undefined) {
          parsed.soundSettings = {
            wakeUpCheckIn: { enabled: true, file: '/sounds/freesound_community-success-fanfare-trumpets-6185.mp3' },
            triggerRoutineStart: { enabled: true, file: '/sounds/driken5482-applause-cheer-236786.mp3' },
            individualRoutineComplete: { enabled: true, file: '/sounds/tithuh-level-up-523624.mp3' },
            routineGroupComplete: { enabled: true, file: '/sounds/dragon-studio-fireworks-02-419019.mp3' },
            todayEnd: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
            allGroupsComplete: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
            chickSound: { enabled: true, file: 'public/sounds/nikin-short-chick-sound-171389.mp3' }
          };
        }

        // Load histories if they are not in parsed object but exist in localForage
        if (!parsed.wakeUpTimeHistory) {
          const wakeUpHistory = await localForage.getItem<any>('WakeUpTimeHistory');
          if (wakeUpHistory) parsed.wakeUpTimeHistory = wakeUpHistory;
        }
        if (!parsed.routineGroupHistory) {
          const groupHistory = await localForage.getItem<any>('RoutineGroupHistory');
          if (groupHistory) parsed.routineGroupHistory = groupHistory;
        }
        if (!parsed.taskHistory) {
          const taskHistory = await localForage.getItem<any>('TaskHistory');
          if (taskHistory) parsed.taskHistory = taskHistory;
        }

        const rebuiltLogs = rebuildActivityLogs(parsed, new Date(), activityLogData || undefined);
        parsed.dailyActivityLog = rebuiltLogs;
        setUserData(parsed);
        setActivityLog(rebuiltLogs);
        prevLanguageRef.current = i18n.language;
        setIsDataLoaded(true);
      } catch (err) {
        console.error('Failed to load state and migrate from localForage/localStorage', err);
        prevLanguageRef.current = i18n.language;
        setIsDataLoaded(true); // Fallback to proceed even if load fails
      }
    };

    loadStateAndMigrate();
  }, []);

  // Synchronize activityLog to localForage on change
  useEffect(() => {
    if (isDataLoaded) {
      localForage.setItem('routine_activity_log', activityLog).catch(e => {
        console.error('Failed to save activityLog to localForage', e);
      });
    }
  }, [activityLog, isDataLoaded]);

  // Synchronize userData to localForage on change
  useEffect(() => {
    if (isDataLoaded) {
      saveData(userData);
    }
  }, [userData, isDataLoaded]);

  // Foreground Tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsForeground(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Daily Reset Logic when date changes or on mount
  useEffect(() => {
    if (!isDataLoaded) return;

    const performDailyReset = async () => {
      const lastReset = userData.lastResetDate;
      
      // 1. 처음 앱을 실행하여 lastResetDate가 아예 없는 경우
      if (!lastReset) {
        console.log(`[Daily Reset] No lastResetDate found. Setting lastResetDate to current today: ${todayStr}`);
        setUserData(prev => ({
          ...prev,
          lastResetDate: todayStr
        }));
        return;
      }

      // 2. 이미 오늘 날짜로 리셋된 경우
      if (lastReset === todayStr) return;

      console.log(`[Daily Reset Triggered] Last Reset Date: ${lastReset}, Today: ${todayStr}`);

      setUserData(prev => {
        // A. 기존 날짜(lastReset)의 데이터를 히스토리와 동기화하여 저장
        const syncedData = syncHistory(prev, lastReset);

        // B. 루틴 상태를 미실행(NOT_STARTED) 및 진행률 리셋 (체크리스트 체크여부도 같이 리셋)
        const resetChunks = syncedData.routineChunks.map(chunk => {
          const resetTasks = chunk.tasks.map(task => {
            return {
              ...task,
              completed: false,
              startTime: undefined,
              endTime: undefined,
              duration: undefined,
              accumulatedDuration: 0,
              isPaused: false,
              status: TaskStatus.NOT_STARTED,
              closingNote: undefined,
              satisfaction: undefined,
              laterTimestamp: undefined,
              checklist: task.checklist?.map(item => ({ ...item, completed: false }))
            };
          });

          // 각 청크의 activeTaskId는 첫 번째 태스크 ID로 설정
          const firstTask = resetTasks[0];
          
          return {
            ...chunk,
            tasks: resetTasks,
            activeTaskId: firstTask ? firstTask.id : undefined,
            completedAt: undefined
          };
        });

        // C. 일일 캐릭터 클릭 기회 횟수를 5회로 리셋
        const defaultAvailableCount = 5;

        return {
          ...syncedData,
          routineChunks: resetChunks,
          lastResetDate: todayStr,
          availableCheckCheckCount: defaultAvailableCount,
          lastCheckInBonusCount: 0 // 보너스 수령 카운트도 초기화
        };
      });
    };

    performDailyReset();
  }, [isDataLoaded, todayStr]);

  // 1-second interval for clock, notifications, and real-time activity logging
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Every minute (roughly), check for notifications
      if (now.getSeconds() === 0) {
        notificationService.checkAndTrigger(userData, now, todayStr);
      }

      // Real-time minute logging
      if (isDataLoaded) {
        const currentMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        if (currentMinutesSinceMidnight !== lastLoggedMinuteRef.current) {
          const calDateStr = formatDate(now);
          const isTimerRunning = globalActiveTask !== null;
          const isAppForeground = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;

          const color = isTimerRunning ? (isAppForeground ? 4 : 3) : (isAppForeground ? 2 : 1);

          setUserData(prev => {
            const logs = { ...(prev.dailyActivityLog || {}) };
            const currentLog = [...(logs[calDateStr] || new Array(1440).fill(0))];
            currentLog[currentMinutesSinceMidnight] = color;
            for (let i = 0; i < currentMinutesSinceMidnight; i++) {
              if (currentLog[i] === 0) {
                currentLog[i] = 1;
              }
            }
            logs[calDateStr] = currentLog;
            return { ...prev, dailyActivityLog: logs };
          });

          setActivityLog(prev => {
            const logs = { ...prev };
            const currentLog = [...(logs[calDateStr] || new Array(1440).fill(0))];
            currentLog[currentMinutesSinceMidnight] = color;
            for (let i = 0; i < currentMinutesSinceMidnight; i++) {
              if (currentLog[i] === 0) {
                currentLog[i] = 1;
              }
            }
            logs[calDateStr] = currentLog;
            return logs;
          });

          lastLoggedMinuteRef.current = currentMinutesSinceMidnight;
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [userData, todayStr, isDataLoaded, globalActiveTask]);

  const saveData = async (data: UserData) => {
    try {
      await localForage.setItem(STORAGE_KEY, data);
      if (data.wakeUpTimeHistory) {
        await localForage.setItem('WakeUpTimeHistory', data.wakeUpTimeHistory);
      }
      if (data.routineGroupHistory) {
        await localForage.setItem('RoutineGroupHistory', data.routineGroupHistory);
      }
      if (data.taskHistory) {
        await localForage.setItem('TaskHistory', data.taskHistory);
      }
    } catch (e) {
      console.error('Error saving data to localForage', e);
    }
  };

  const syncHistory = (data: UserData, today: string): UserData => {
    const [y, m, d] = today.split('-').map(Number);
    const syncDate = new Date(y, m - 1, d);

    let newTaskHistory = [...(data.taskHistory || [])];
    let newGroupHistory = [...(data.routineGroupHistory || [])];
    let newWakeUpHistory = [...(data.wakeUpTimeHistory || [])];

    // Update WakeUp History
    if (data.lastCheckInDate === today) {
      const checkInTime = data.dailyCheckIn?.[today];
      const savedTarget = data.dailyTargetWakeUpTime?.[today] || data.targetWakeUpTime;
      
      if (checkInTime) {
        const [targetH, targetM] = savedTarget.split(':').map(Number);
        const [checkH, checkM, checkS] = checkInTime.split(':').map(Number);
        
        const targetDateForStatus = new Date(syncDate);
        targetDateForStatus.setHours(targetH, targetM, 0, 0);
        
        const checkInDateForStatus = new Date(syncDate);
        checkInDateForStatus.setHours(checkH, checkM, checkS || 0, 0);
        
        const lateLimit = phrases.wakeUpCheckInSettings?.lateWindowMinutes || 10;
        const status = checkInDateForStatus.getTime() > targetDateForStatus.getTime() + (lateLimit * 60 * 1000) ? '지각' : '달성';

        const existingIdx = newWakeUpHistory.findIndex(h => h.date === today);
        const newEntry: WakeUpTimeHistoryEntry = { 
          date: today, 
          wakeUpTime: checkInTime,
          targetTime: savedTarget,
          status: status as '달성' | '지각'
        };

        if (existingIdx >= 0) {
          newWakeUpHistory[existingIdx] = newEntry;
        } else {
          newWakeUpHistory.push(newEntry);
        }
      }
    }

    // Update Task and Group History
    data.routineChunks.forEach(chunk => {
      let firstStartTime: string | null = null;
      let totalDuration = 0;
      let anyStarted = false;
      let lastEndTime: string | null = null;
      const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, syncDate, data));
      let allFinished = scheduledTasks.length > 0;
      const isActive = scheduledTasks.length > 0;

      chunk.tasks.forEach(task => {
        const isScheduled = isTaskScheduledToday(task, chunk, syncDate, data);
        
        let statusStr = isScheduled ? '미실행' : '비활성';
        const taskDuration = task.duration || task.accumulatedDuration || 0;
        if (isScheduled) {
          if (task.status === TaskStatus.PERFECT) statusStr = '완벽';
          else if (task.status === TaskStatus.COMPLETED || task.completed) statusStr = '완료';
          else if (task.status === TaskStatus.SKIP) statusStr = '스킵';
          else if (task.laterTimestamp) statusStr = '나중에';
          else if (task.isPaused && taskDuration > 0) statusStr = '일시정지';
          else if (task.startTime) statusStr = '실행중';
        }
        
        const taskEntryIdx = newTaskHistory.findIndex(h => h.date === today && h.taskId === task.id);
        const existingTaskEntry = taskEntryIdx >= 0 ? newTaskHistory[taskEntryIdx] : null;

        const isExcluded = !isScheduled || statusStr === '미실행' || statusStr === '스킵';

        const finalTaskStartTime = isExcluded
          ? null
          : ([task.startTime, existingTaskEntry?.startTime]
              .filter(Boolean)
              .sort()[0] || null);

        const isFinished = task.completed || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.PERFECT || task.status === TaskStatus.SKIP;
        const finalTaskEndTime = isExcluded
          ? null
          : (isFinished ? (task.endTime || existingTaskEntry?.endTime || null) : null);

        const taskEntry: TaskHistoryEntry = {
          date: today,
          taskId: task.id,
          groupId: chunk.id,
          isActive: isScheduled,
          startTime: finalTaskStartTime,
          endTime: finalTaskEndTime,
          duration: isExcluded ? null : taskDuration,
          status: statusStr
        };

        if (taskEntryIdx >= 0) {
          newTaskHistory[taskEntryIdx] = taskEntry;
        } else {
          newTaskHistory.push(taskEntry);
        }

        if (isScheduled) {
          if (task.startTime && (!firstStartTime || task.startTime < firstStartTime)) {
            firstStartTime = task.startTime;
          }
          if (task.endTime && (!lastEndTime || task.endTime > lastEndTime)) {
            lastEndTime = task.endTime;
          }
          totalDuration += taskDuration;
          if (!task.completed && task.status !== TaskStatus.SKIP && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.PERFECT) {
            allFinished = false;
          }
          if (task.startTime || task.completed || task.status !== TaskStatus.NOT_STARTED) {
            anyStarted = true;
          }
        }
      });

      let completionStatus: '비활성' | '미실행' | '미완료' | '전체완료' = '미실행';
      if (!isActive) completionStatus = '비활성';
      else if (allFinished) completionStatus = '전체완료';
      else if (anyStarted) completionStatus = '미완료';

      const existingEntry = newGroupHistory.find(h => h.date === today && h.groupId === chunk.id);
      const satisfaction = existingEntry?.satisfaction;
      const closingNote = existingEntry?.closingNote;
      const selectedPhrase = existingEntry?.selectedPhrase;

      const finalFirstStartTime = [firstStartTime, existingEntry?.firstTaskStartTime]
        .filter(Boolean)
        .sort()[0] || null;

      const groupEntryIdx = newGroupHistory.findIndex(h => h.date === today && h.groupId === chunk.id);
      const groupEntry: RoutineGroupHistoryEntry = {
        date: today,
        groupId: chunk.id,
        isActive,
        firstTaskStartTime: finalFirstStartTime,
        completionStatus,
        completedAt: lastEndTime,
        totalDuration,
        satisfaction,
        closingNote,
        selectedPhrase
      };

      if (groupEntryIdx >= 0) {
        newGroupHistory[groupEntryIdx] = groupEntry;
      } else {
        newGroupHistory.push(groupEntry);
      }
    });

    return {
      ...data,
      wakeUpTimeHistory: newWakeUpHistory,
      routineGroupHistory: newGroupHistory,
      taskHistory: newTaskHistory
    };
  };

  const autoCompleteAccumulatedTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    let targetChunkId: string | null = null;
    let foundTask: Task | null = null;

    for (const chunk of userData.routineChunks) {
      const t = chunk.tasks.find(task => task.id === id);
      if (t) {
        foundTask = t;
        targetChunkId = chunk.id;
        break;
      }
    }

    if (!foundTask || !targetChunkId) return;

    isAutoNextTransitioningRef.current = true;

    const settings = userData.naggingSettings;
    const taskText = foundTask.text;
    const totalSeconds = (foundTask.targetDuration || 0) * 60;
    const variables = {
      name: userData.userName || '나',
      task: taskText,
      n: foundTask.targetDuration || 0,
      r: 0,
      m: 0
    };

    const endVoiceEnabled = userData.isVoiceEnabled && settings && settings.endEnabled;
    const endVoiceMessage = settings?.endMessage || '';

    const routineConfig = userData.soundSettings?.individualRoutineComplete;
    const routineEnabled = routineConfig ? routineConfig.enabled : true;
    const routineFile = routineConfig?.file || '/sounds/tithuh-level-up-523624.mp3';

    let nextTaskText = '';
    let nextVoiceMessage = '';
    let nextVoiceEnabled = false;

    const chunkObj = userData.routineChunks.find(c => c.id === targetChunkId);
    let nextTaskObj: Task | undefined;
    if (chunkObj) {
      const updatedTasks = chunkObj.tasks.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: true,
            status: TaskStatus.PERFECT,
            duration: totalSeconds,
            accumulatedDuration: totalSeconds,
            endTime: nowStr,
            startTime: undefined,
            isPaused: false
          };
        }
        return t;
      });

      const getNext = (ts: Task[]) => {
        const sched = ts.filter(t => 
          t.id !== id && 
          isTaskScheduledToday(t, chunkObj, effectiveDate, userData) && 
          !(t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP)
        );
        return sched.find(t => !t.startTime && !t.isPaused && (t.accumulatedDuration || 0) === 0 && !t.laterTimestamp)
            || sched.find(t => !!t.laterTimestamp)
            || sched.find(t => !!t.isPaused || (t.accumulatedDuration || 0) > 0 || !!t.startTime);
      };

      nextTaskObj = getNext(updatedTasks);
      if (nextTaskObj && userData.nextRoutineAutoStart) {
        lastProcessedStartTimeRef.current = {
          taskId: nextTaskObj.id,
          startTime: nowStr
        };
        nextTaskText = nextTaskObj.text;
        nextVoiceEnabled = userData.isVoiceEnabled && settings && settings.startEnabled;
        nextVoiceMessage = settings?.startMessage || 'task 시작합니다';
      }
    }

    const runSequence = async () => {
      if (endVoiceEnabled && endVoiceMessage) {
        await speakAsync(endVoiceMessage, true, variables);
      }
      if (routineEnabled && routineFile) {
        await playAudioAsync(routineFile, true);
      }
      if (nextVoiceEnabled && nextVoiceMessage && nextTaskText) {
        const nextVariables = {
          name: userData.userName || '나',
          task: nextTaskText,
          n: 0,
          r: 0,
          m: 0
        };
        await speakAsync(nextVoiceMessage, true, nextVariables);
      }
    };

    runSequence();

    setUserData(prev => {
      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const updatedTasks = chunk.tasks.map(t => {
            if (t.id === id) {
              const updated = {
                ...t,
                completed: true,
                endTime: nowStr,
                duration: totalSeconds,
                accumulatedDuration: totalSeconds,
                startTime: undefined,
                isPaused: false,
                status: TaskStatus.PERFECT
              };
              return updated;
            } else if (t.status === TaskStatus.IN_PROGRESS) {
              const updated = { ...t };
              updated.isPaused = !!updated.startTime || (updated.isPaused && (updated.accumulatedDuration || 0) > 0);
              updated.accumulatedDuration = calculateTaskDuration(updated, now);
              updated.startTime = undefined;
              updated.status = TaskStatus.NOT_STARTED;
              return updated;
            }
            return t;
          });

          const getNext = (ts: Task[]) => {
            const sched = ts.filter(t => 
              t.id !== id && 
              isTaskScheduledToday(t, chunk, effectiveDate, prev) && 
              !(t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP)
            );
            return sched.find(t => !t.startTime && !t.isPaused && (t.accumulatedDuration || 0) === 0 && !t.laterTimestamp)
                || sched.find(t => !!t.laterTimestamp)
                || sched.find(t => !!t.isPaused || (t.accumulatedDuration || 0) > 0 || !!t.startTime);
          };

          const nextTask = getNext(updatedTasks);
          const nextActiveId = nextTask ? nextTask.id : undefined;
          
          const allCompleted = updatedTasks.every(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT);
          let newCompletionDates = chunk.completionDates || [];
          if (allCompleted && !newCompletionDates.includes(todayStr)) {
            newCompletionDates = [...newCompletionDates, todayStr];
          }

          return {
            ...chunk,
            completionDates: newCompletionDates,
            activeTaskId: nextActiveId,
            tasks: updatedTasks.map(t => {
              if (nextTask && t.id === nextTask.id) {
                return { 
                  ...t, 
                  status: TaskStatus.IN_PROGRESS, 
                  startTime: prev.nextRoutineAutoStart ? nowStr : undefined,
                  isPaused: !prev.nextRoutineAutoStart,
                  laterTimestamp: undefined 
                };
              }
              return t;
            })
          };
        }
        return chunk;
      });

      const totalCompleted = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData) && t.completed).length, 0
      );
      const totalScheduledTasksCount = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData)).length, 0
      );
      const completionPercentage = totalScheduledTasksCount > 0 
        ? Math.floor((totalCompleted / totalScheduledTasksCount) * 100) 
        : 0;

      const nextState = {
        ...prev,
        routineChunks: newChunks,
        dailyCompletionRate: {
          ...prev.dailyCompletionRate,
          [todayStr]: completionPercentage
        }
      };

      try {
        const nextWithHistory = syncHistory(nextState, todayStr);
        nextWithHistory.availableCheckCheckCount = (nextWithHistory.availableCheckCheckCount || 0) + 3;
        return nextWithHistory;
      } catch (e) {
        return syncHistory(nextState, todayStr);
      }
    });

    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
        });
      } catch (e) {}
    }

    setTimeout(() => {
      isAutoNextTransitioningRef.current = false;
    }, 1500);
  };

  const toggleTask = (id: string, closingData?: { note?: string, satisfaction?: number }) => {
    soundService.unlock();
    voiceService.unlock();
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      let foundTask: Task | null = null;
      let targetChunkId: string | null = null;

      for (const chunk of prev.routineChunks) {
        const t = chunk.tasks.find(task => task.id === id);
        if (t) {
          foundTask = t;
          targetChunkId = chunk.id;
          break;
        }
      }

      if (!foundTask || !targetChunkId) return prev;

      const isBecomingCompleted = !foundTask.completed;
      if (isBecomingCompleted) {
        soundService.stop();
        voiceService.stop();
        addAvailableCheckCheckPoints(3, '루틴(태스크) 완료/완벽');
      }
      
      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const updatedTasks = chunk.tasks.map(t => {
            let updated = { ...t };
            if (t.id === id) {
              updated = { ...t, completed: isBecomingCompleted };
              if (isBecomingCompleted) {
                updated.endTime = nowStr;
                const totalSeconds = calculateTaskDuration(t, now);
                updated.duration = totalSeconds;
                updated.accumulatedDuration = totalSeconds;
                updated.startTime = undefined;
                updated.isPaused = false;
                
                const targetSeconds = (t.targetDuration || 0) * 60;
                if (t.taskType === TaskType.TIME_LIMITED) {
                  updated.status = totalSeconds <= targetSeconds ? TaskStatus.PERFECT : TaskStatus.COMPLETED;
                } else if (t.taskType === TaskType.TIME_ACCUMULATED) {
                  updated.status = totalSeconds >= targetSeconds ? TaskStatus.PERFECT : TaskStatus.COMPLETED;
                } else {
                  updated.status = TaskStatus.PERFECT;
                }

                if (closingData) {
                  updated.closingNote = closingData.note;
                  updated.satisfaction = closingData.satisfaction;
                }
                const routineConfig = prev.soundSettings?.individualRoutineComplete;
                const routineEnabled = routineConfig ? routineConfig.enabled : true;
                const routineFile = routineConfig?.file || '/tithuh-level-up-523624.mp3';
                soundService.refresh(routineFile);
                soundService.play(routineFile, routineEnabled);
                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate([200, 100, 200]);
                }
              } else {
                updated.accumulatedDuration = t.duration ?? t.accumulatedDuration ?? 0;
                updated.endTime = undefined;
                updated.duration = undefined;
                updated.status = TaskStatus.NOT_STARTED;
                updated.isPaused = false;
              }
            } else if (updated.status === TaskStatus.IN_PROGRESS && isBecomingCompleted) {
              updated.isPaused = !!updated.startTime || (updated.isPaused && (updated.accumulatedDuration || 0) > 0);
              updated.accumulatedDuration = calculateTaskDuration(updated, now);
              updated.startTime = undefined;
              updated.status = TaskStatus.NOT_STARTED;
            }
            return updated;
          });

          if (isBecomingCompleted) {
            const getNext = (ts: Task[]) => {
              const sched = ts.filter(t => 
                t.id !== id && 
                isTaskScheduledToday(t, chunk, effectiveDate, prev) && 
                !(t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP)
              );
              
              const unstarted = sched.find(t => !t.startTime && !t.isPaused && (t.accumulatedDuration || 0) === 0 && !t.laterTimestamp);
              if (unstarted) return unstarted;
              
              const later = sched.find(t => !!t.laterTimestamp);
              if (later) return later;
              
              const paused = sched.find(t => !!t.isPaused || (t.accumulatedDuration || 0) > 0 || !!t.startTime);
              if (paused) return paused;
              
              return undefined;
            };

            const nextTask = getNext(updatedTasks);
            const nextActiveId = nextTask ? nextTask.id : undefined;
            
            const allCompleted = updatedTasks.every(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT);
            let newCompletionDates = chunk.completionDates || [];
            if (allCompleted && !newCompletionDates.includes(todayStr)) {
              newCompletionDates = [...newCompletionDates, todayStr];
            } else if (!allCompleted && newCompletionDates.includes(todayStr)) {
              newCompletionDates = newCompletionDates.filter(d => d !== todayStr);
            }

            return {
              ...chunk,
              completionDates: newCompletionDates,
              activeTaskId: nextActiveId,
              tasks: updatedTasks.map(t => {
                if (nextTask && t.id === nextTask.id) {
                  return { 
                    ...t, 
                    status: TaskStatus.IN_PROGRESS, 
                    startTime: prev.nextRoutineAutoStart ? nowStr : undefined,
                    isPaused: !prev.nextRoutineAutoStart,
                    laterTimestamp: undefined 
                  };
                }
                return t;
              })
            };
          }

          return {
            ...chunk,
            activeTaskId: id,
            tasks: updatedTasks
          };
        }
        return chunk;
      });

      if (isBecomingCompleted) {
        setLastCompletedTaskName(foundTask.text);
        setTimeout(() => setLastCompletedTaskName(null), 2000);

        if (typeof confetti === 'function') {
          try {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981']
            });
          } catch (e) {
            console.warn('Confetti animation failed:', e);
          }
        }
      }

      const totalCompleted = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, prev) && t.completed).length, 0
      );
      const totalScheduledTasksCount = newChunks.reduce((acc, chunk) => 
        acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, prev)).length, 0
      );
      const completionPercentage = totalScheduledTasksCount > 0 
        ? Math.floor((totalCompleted / totalScheduledTasksCount) * 100) 
        : 0;

      const next = {
        ...prev,
        routineChunks: newChunks,
        dailyCompletionRate: {
          ...prev.dailyCompletionRate,
          [todayStr]: completionPercentage
        }
      };
      return syncHistory(next, todayStr);
    });
  };

  const skipTask = (id: string) => {
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      let targetChunkId: string | null = null;
      for (const chunk of prev.routineChunks) {
        if (chunk.tasks.some(t => t.id === id)) {
          targetChunkId = chunk.id;
          break;
        }
      }

      if (!targetChunkId) return prev;

      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const foundTask = chunk.tasks.find(t => t.id === id);
          const taskDuration = foundTask ? (foundTask.duration || foundTask.accumulatedDuration || 0) : 0;

          const updatedTasks = chunk.tasks.map(t => {
            if (t.id === id) {
              return {
                ...t,
                status: TaskStatus.SKIP,
                endTime: nowStr,
                duration: taskDuration > 0 ? taskDuration : undefined,
                startTime: undefined,
                isPaused: false
              };
            } else if (t.status === TaskStatus.IN_PROGRESS) {
              const updated = { ...t };
              updated.isPaused = !!updated.startTime || (updated.isPaused && (updated.accumulatedDuration || 0) > 0);
              updated.accumulatedDuration = calculateTaskDuration(updated, now);
              updated.startTime = undefined;
              updated.status = TaskStatus.NOT_STARTED;
              return updated;
            }
            return t;
          });

          const getNext = (ts: Task[]) => {
            const sched = ts.filter(t => 
              t.id !== id && 
              isTaskScheduledToday(t, chunk, effectiveDate, prev) && 
              !(t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP)
            );
            return sched.find(t => !t.startTime && !t.isPaused && (t.accumulatedDuration || 0) === 0 && !t.laterTimestamp)
                || sched.find(t => !!t.laterTimestamp)
                || sched.find(t => !!t.isPaused || (t.accumulatedDuration || 0) > 0 || !!t.startTime);
          };

          const nextTask = getNext(updatedTasks);
          const nextActiveId = nextTask ? nextTask.id : undefined;

          const allCompleted = updatedTasks.every(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT);
          let newCompletionDates = chunk.completionDates || [];
          if (allCompleted && !newCompletionDates.includes(todayStr)) {
            newCompletionDates = [...newCompletionDates, todayStr];
          }

          return {
            ...chunk,
            completionDates: newCompletionDates,
            activeTaskId: nextActiveId,
            tasks: updatedTasks.map(t => {
              if (nextTask && t.id === nextTask.id) {
                return { 
                  ...t, 
                  status: TaskStatus.IN_PROGRESS, 
                  startTime: prev.nextRoutineAutoStart ? nowStr : undefined,
                  isPaused: !prev.nextRoutineAutoStart,
                  laterTimestamp: undefined 
                };
              }
              return t;
            })
          };
        }
        return chunk;
      });

      const next = {
        ...prev,
        routineChunks: newChunks
      };
      return syncHistory(next, todayStr);
    });
  };

  const laterTask = (id: string) => {
    const now = new Date();

    setUserData(prev => {
      let targetChunkId: string | null = null;
      for (const chunk of prev.routineChunks) {
        if (chunk.tasks.some(t => t.id === id)) {
          targetChunkId = chunk.id;
          break;
        }
      }

      if (!targetChunkId) return prev;

      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const foundTask = chunk.tasks.find(t => t.id === id);
          const taskDuration = foundTask ? (foundTask.duration || foundTask.accumulatedDuration || 0) : 0;

          const updatedTasks = chunk.tasks.map(t => {
            if (t.id === id) {
              return {
                ...t,
                laterTimestamp: Date.now(),
                status: TaskStatus.NOT_STARTED,
                isPaused: taskDuration > 0,
                accumulatedDuration: taskDuration > 0 ? taskDuration : undefined,
                startTime: undefined
              };
            } else if (t.status === TaskStatus.IN_PROGRESS) {
              const updated = { ...t };
              updated.isPaused = !!updated.startTime || (updated.isPaused && (updated.accumulatedDuration || 0) > 0);
              updated.accumulatedDuration = calculateTaskDuration(updated, now);
              updated.startTime = undefined;
              updated.status = TaskStatus.NOT_STARTED;
              return updated;
            }
            return t;
          });

          const getNext = (ts: Task[]) => {
            const sched = ts.filter(t => 
              t.id !== id && 
              isTaskScheduledToday(t, chunk, effectiveDate, prev) && 
              !(t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP)
            );
            return sched.find(t => !t.startTime && !t.isPaused && (t.accumulatedDuration || 0) === 0 && !t.laterTimestamp)
                || sched.find(t => !!t.laterTimestamp)
                || sched.find(t => !!t.isPaused || (t.accumulatedDuration || 0) > 0 || !!t.startTime);
          };

          const nextTask = getNext(updatedTasks);
          const nextActiveId = nextTask ? nextTask.id : undefined;

          return {
            ...chunk,
            activeTaskId: nextActiveId,
            tasks: updatedTasks.map(t => {
              if (nextTask && t.id === nextTask.id) {
                const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                return { 
                  ...t, 
                  status: TaskStatus.IN_PROGRESS, 
                  startTime: prev.nextRoutineAutoStart ? nowStr : undefined,
                  isPaused: !prev.nextRoutineAutoStart,
                  laterTimestamp: undefined 
                };
              }
              return t;
            })
          };
        }
        return chunk;
      });

      const next = {
        ...prev,
        routineChunks: newChunks
      };
      return syncHistory(next, todayStr);
    });
  };

  const startTask = (taskId: string, resetTimer: boolean = true, _forceStart: boolean = false) => {
    soundService.unlock();
    voiceService.unlock();
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      let targetChunkId: string | null = null;
      for (const chunk of prev.routineChunks) {
        if (chunk.tasks.some(t => t.id === taskId)) {
          targetChunkId = chunk.id;
          break;
        }
      }

      if (!targetChunkId) return prev;

      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const newTasks = chunk.tasks.map(task => {
            if (task.id === taskId) {
              const speakTarget = task.text;
              const soundConfig = prev.soundSettings?.triggerRoutineStart;
              const soundEnabled = soundConfig ? soundConfig.enabled : true;
              const soundFile = soundConfig?.file || '/driken5482-applause-cheer-236786.mp3';

              soundService.refresh(soundFile);
              soundService.play(soundFile, soundEnabled);

              const startSpeakEnabled = prev.isVoiceEnabled && prev.naggingSettings?.startEnabled;
              const startSpeakMessage = prev.naggingSettings?.startMessage || 'task 시작합니다';
              if (startSpeakEnabled && startSpeakMessage) {
                speakAsync(startSpeakMessage, true, {
                  name: prev.userName || '나',
                  task: speakTarget,
                  n: task.targetDuration || 0,
                  r: 0,
                  m: 0
                });
              }

              return {
                ...task,
                startTime: nowStr,
                endTime: undefined,
                duration: undefined,
                status: TaskStatus.IN_PROGRESS,
                isPaused: false,
                completed: false,
                laterTimestamp: undefined,
                accumulatedDuration: resetTimer ? undefined : task.accumulatedDuration
              };
            } else if (task.status === TaskStatus.IN_PROGRESS || (task.startTime && !task.isPaused)) {
              const updated = { ...task };
              updated.isPaused = true;
              updated.accumulatedDuration = calculateTaskDuration(updated, now);
              updated.startTime = undefined;
              updated.status = TaskStatus.NOT_STARTED;
              return updated;
            }
            return task;
          });

          const allCompleted = newTasks.every(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT);
          let newCompletionDates = chunk.completionDates || [];
          if (allCompleted && !newCompletionDates.includes(todayStr)) {
            newCompletionDates = [...newCompletionDates, todayStr];
          } else if (!allCompleted && newCompletionDates.includes(todayStr)) {
            newCompletionDates = newCompletionDates.filter(d => d !== todayStr);
          }

          return {
            ...chunk,
            completionDates: newCompletionDates,
            activeTaskId: taskId,
            tasks: newTasks
          };
        }
        return chunk;
      });

      const next = {
        ...prev,
        forcedActiveTasks: {
          ...(prev.forcedActiveTasks || {}),
          [todayStr]: {
            ...(prev.forcedActiveTasks?.[todayStr] || {}),
            [taskId]: true
          }
        },
        routineChunks: newChunks
      };
      return syncHistory(next, todayStr);
    });
  };

  const togglePauseTask = (id: string, _forceStart: boolean = false) => {
    soundService.unlock();
    voiceService.unlock();
    const now = new Date();
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      let targetChunkId: string | null = null;
      for (const chunk of prev.routineChunks) {
        if (chunk.tasks.some(t => t.id === id)) {
          targetChunkId = chunk.id;
          break;
        }
      }

      if (!targetChunkId) return prev;

      const newChunks = prev.routineChunks.map(chunk => {
        if (chunk.id === targetChunkId) {
          const newTasks = chunk.tasks.map(task => {
            if (task.id === id) {
              const wasRunning = !!task.startTime && !task.isPaused;
              const accumulated = wasRunning 
                ? calculateTaskDuration(task, now) 
                : (task.accumulatedDuration || 0);

              return {
                ...task,
                isPaused: wasRunning,
                startTime: wasRunning ? undefined : nowStr,
                accumulatedDuration: accumulated,
                completed: false,
                status: TaskStatus.IN_PROGRESS
              };
            } else if (task.status === TaskStatus.IN_PROGRESS || (task.startTime && !task.isPaused)) {
              const updated = { ...task };
              updated.isPaused = true;
              updated.accumulatedDuration = calculateTaskDuration(updated, now);
              updated.startTime = undefined;
              updated.status = TaskStatus.NOT_STARTED;
              return updated;
            }
            return task;
          });

          const allCompleted = newTasks.every(t => t.completed || t.status === TaskStatus.SKIP || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT);
          let newCompletionDates = chunk.completionDates || [];
          if (allCompleted && !newCompletionDates.includes(todayStr)) {
            newCompletionDates = [...newCompletionDates, todayStr];
          } else if (!allCompleted && newCompletionDates.includes(todayStr)) {
            newCompletionDates = newCompletionDates.filter(d => d !== todayStr);
          }

          return {
            ...chunk,
            completionDates: newCompletionDates,
            activeTaskId: id,
            tasks: newTasks
          };
        }
        return chunk;
      });

      const next = {
        ...prev,
        forcedActiveTasks: {
          ...(prev.forcedActiveTasks || {}),
          [todayStr]: {
            ...(prev.forcedActiveTasks?.[todayStr] || {}),
            [id]: true
          }
        },
        routineChunks: newChunks
      };
      return syncHistory(next, todayStr);
    });
  };

  // --- Chunk CRUD ---
  const addChunk = (
    name: string, 
    purpose: string, 
    tasks: Task[], 
    scheduleType: 'days' = 'days', 
    scheduledDays: number[] = [0,1,2,3,4,5,6], 
    startTime?: string,
    isAlarmEnabled?: boolean,
    startType?: 'anytime' | 'situation' | 'time',
    situation?: string
  ) => {
    if (!name.trim()) return;
    const newChunk: RoutineChunk = {
      id: Date.now().toString(),
      name: name,
      purpose: purpose,
      completionDates: [],
      tasks: tasks,
      scheduleType,
      scheduledDays,
      startTime,
      isAlarmEnabled,
      startType,
      situation
    };
    setUserData(prev => ({
      ...prev,
      routineChunks: [...prev.routineChunks, newChunk]
    }));
    // [가산 엔진 트리거]: 루틴 그룹(청크) 새로 생성/추가 시 기회 횟수 가산 (+1점)
    addAvailableCheckCheckPoints(1, '루틴 그룹 추가');
    setGroupAddedMessage(`'${name}' 루틴 그룹이 추가되었습니다`);
  };

  const updateChunk = (
    id: string,
    name: string,
    purpose: string,
    scheduledDays: number[],
    resetTime: string
  ) => {
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => 
        chunk.id === id 
          ? { ...chunk, name, purpose, scheduledDays, resetTime } 
          : chunk
      )
    }));
  };

  const deleteChunk = (id: string) => {
    setUserData(prev => {
      const chunk = prev.routineChunks.find(c => c.id === id);
      if (chunk) {
        addAvailableCheckCheckPoints(1, '루틴 그룹 삭제');
        setDeletionMessage(`'${chunk.name}' 그룹이 삭제되었습니다`);
        setTimeout(() => setDeletionMessage(null), 3000);
      }
      return {
        ...prev,
        routineChunks: prev.routineChunks.filter(c => c.id !== id)
      };
    });
  };

  return {
    // states
    isDataLoaded,
    todayStr,
    effectiveDate,
    currentTime,
    isForeground,
    userData,
    activityLog,
    lastCompletedTaskName,
    activeAlarmChunk,
    deletionMessage,
    backupMessage,
    groupAddedMessage,
    resetPauseModal,
    isSettingsOpen,
    settingsSubView,
    globalActiveTask,
    checkCheckIconId,
    isCheckCheckAvailable,

    // state setters
    setUserData,
    setActivityLog,
    setIsSettingsOpen,
    setSettingsSubView,
    setActiveAlarmChunk,
    setResetPauseModal,
    setBackupMessage,
    setLastCompletedTaskName,
    setDeletionMessage,

    // actions
    addAvailableCheckCheckPoints,
    autoCompleteAccumulatedTask,
    toggleTask,
    skipTask,
    laterTask,
    startTask,
    togglePauseTask,
    addChunk,
    updateChunk,
    deleteChunk,
    syncHistory,
    handleCheckCheckClick,
  };
};
