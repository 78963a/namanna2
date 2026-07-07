import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import localForage from 'localforage';
import { MY_APP_VERSION } from '../../zzz';
import { 
  Sun,
  Moon,
  User,
  Trash2, 
  Clock,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Bell,
  BellOff,
  Timer,
  BrickWall,
  Check,
  Volume2,
  Download,
  Upload,
  ArrowUpDown,
  Globe,
  ArrowBigRightDash,
  FileText,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Internal Types & Constants
import { 
  TaskType, 
  UserData, 
  SettingsSubView,
  TaskStatus,
} from '../../types';
import { soundService } from '../../services/soundService';
import { getNaggingDefaultSettings } from './NaggingSettingsView';
import { notificationService } from '../../services/notificationService';
import { STORAGE_KEY } from '../../constants';
import { 
  isTaskScheduledToday, 
  formatDate, 
  getEffectiveDate,
  getEffectiveDateObject,
  formatDurationPrecise,
  getJosa,
  calculateTaskDuration,
  getCreationDate
} from '../../utils';

/**
 * 일반설정 화면의 각 설정 설명문(Desc)에 사용되는 글자 스타일을 통일하여 렌더링하는 헬퍼 함수입니다.
 * @param text 설명에 들어갈 텍스트 내용
 * @param extraClass 마진 등의 추가 클래스 (기본값: 빈 문자열)
 */
const renderSettingDesc = (text: string, extraClass: string = '') => {
  return (
    <p className={`text-sm font-normal text-slate-500 dark:text-slate-300 leading-tight whitespace-normal break-words ${extraClass}`}>
      {text}
    </p>
  );
};

/**
 * 설정 화면의 '큰 제목'(아이콘 옆에 표시되는 주요 설정 그룹명) 글자 스타일을 통일하여 렌더링하는 헬퍼 함수입니다.
 * @param text 제목 텍스트 내용
 * @param extraClass 추가 클래스 (기본값: 빈 문자열)
 */
const renderSettingBigTitle = (text: string, extraClass: string = '') => {
  return (
    <h3 className={`text-base font-black text-slate-800 dark:text-slate-100 whitespace-normal break-words ${extraClass}`}>
      {text}
    </h3>
  );
};

/**
 * 설정 화면의 '작은 제목'(큰 제목 이하의 세부 항목 타이틀) 글자 스타일을 통일하여 렌더링하는 헬퍼 함수입니다.
 * @param text 제목 텍스트 내용
 * @param extraClass 추가 클래스 (기본값: 빈 문자열)
 */
const renderSettingSmallTitle = (text: string, extraClass: string = '') => {
  return (
    <h4 className={`text-sm font-black text-slate-700 dark:text-slate-200 whitespace-normal break-words ${extraClass}`}>
      {text}
    </h4>
  );
};

export interface GeneralSettingsViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  currentTime: Date;
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
  setDeletionMessage: (msg: string | null) => void;
  setBackupMessage: (msg: string | null) => void;
  activityLog: Record<string, number[]>;
  setActivityLog: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
  setSettingsSubView: React.Dispatch<React.SetStateAction<SettingsSubView>>;
  setShowPermissionGuide: (val: boolean) => void;
  syncHistory: (data: UserData, today: string) => UserData;
}

export const GeneralSettingsView: React.FC<GeneralSettingsViewProps> = ({
  userData,
  setUserData,
  currentTime,
  setConfirmModal,
  setDeletionMessage,
  setBackupMessage,
  activityLog,
  setActivityLog,
  setSettingsSubView,
  setShowPermissionGuide,
  syncHistory,
}) => {
  const { t, i18n } = useTranslation();

  const [isResetTimeDropdownOpen, setIsResetTimeDropdownOpen] = useState(false);
  const [userNameEdit, setUserNameEdit] = useState<string>('');
  const [wakeUpTimeEdit, setWakeUpTimeEdit] = useState<string>('');

  useEffect(() => {
    if (userData?.userName) {
      setUserNameEdit(userData.userName);
    }
  }, [userData?.userName]);

  useEffect(() => {
    if (userData?.targetWakeUpTime) {
      setWakeUpTimeEdit(userData.targetWakeUpTime);
    }
  }, [userData?.targetWakeUpTime]);

  const todayStr = useMemo(() => {
    const [resetH] = userData.resetTime.split(':').map(Number);
    const effDate = getEffectiveDateObject(currentTime, resetH);
    return formatDate(effDate);
  }, [currentTime, userData.resetTime]);

  const updateUserName = (name: string) => {
    const trimmed = name.trim();
    const finalName = trimmed === '' ? t('csv.placeholderMe') : trimmed;
    setConfirmModal({
      isOpen: true,
      title: t('settings.changeUserNameTitle'),
      message: t('settings.changeUserNameConfirm', { name: finalName, josa: getJosa(finalName, '으로/로') }),
      onConfirm: () => {
        setUserData(prev => ({ ...prev, userName: finalName }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateWakeUpTime = (time: string) => {
    const hasCheckedInToday = userData.lastCheckInDate === todayStr;
    const message = hasCheckedInToday
      ? t('settings.changeWakeUpTimeConfirmToday', { time, josa: getJosa(time, '으로/로') })
      : t('settings.changeWakeUpTimeConfirmDefault', { time, josa: getJosa(time, '으로/로') });

    setConfirmModal({
      isOpen: true,
      title: t('settings.changeWakeUpTimeTitle'),
      message: message,
      confirmColor: 'indigo',
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          targetWakeUpTime: time,
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleWakeUpAlarm = async () => {
    if (!userData.isWakeUpAlarmEnabled) {
      const status = await notificationService.requestPermission();
      if (status !== 'granted') {
        setShowPermissionGuide(true);
        return;
      }
    }
    setUserData(prev => ({ ...prev, isWakeUpAlarmEnabled: !prev.isWakeUpAlarmEnabled }));
  };

  const updateResetTime = (time: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('settings.changeResetTimeTitle'),
      message: t('settings.changeResetTimeConfirm', { time, josa: getJosa(time, '으로/로') }),
      onConfirm: () => {
        const h = parseInt(time.split(':')[0]);
        setUserData(prev => ({ ...prev, resetTime: time, dailyResetHour: h }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const resetWakeUpHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: t('settings.deleteWakeUpRecords'),
      message: t('settings.deleteWakeUpConfirm'),
      confirmLabel: t('common.confirm'),
      validationValue: userData.userName || t('csv.placeholderMe'),
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          wakeUpTimeHistory: [],
          lastCheckInDate: null,
          dailyCheckIn: {},
          dailyTargetWakeUpTime: {},
          history: []
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletionMessage(t('settings.deleteWakeUpSuccess'));
      }
    });
  };

  const resetUsageHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: t('settings.deleteUsageRecords'),
      message: t('settings.deleteUsageConfirm'),
      confirmLabel: t('common.confirm'),
      validationValue: userData.userName || t('csv.placeholderMe'),
      onConfirm: async () => {
        setActivityLog({});
        try {
          await localForage.removeItem('routine_activity_log');
        } catch (e) {
          console.error('Failed to remove routine_activity_log from localForage', e);
        }
        localStorage.removeItem('routine_activity_log');
        setUserData(prev => ({
          ...prev,
          dailyActivityLog: {}
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletionMessage(t('settings.deleteUsageSuccess'));
      }
    });
  };

  const resetRoutineHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: t('settings.deleteRoutineRecords'),
      message: t('settings.deleteRoutineConfirm'),
      confirmLabel: t('common.confirm'),
      validationValue: userData.userName || t('csv.placeholderMe'),
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          taskHistory: [],
          routineGroupHistory: [],
          dailyCompletionRate: {},
          lastResetDate: null,
          dailyTaskStatus: {},
          forcedActiveTasks: {}
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletionMessage(t('settings.deleteRoutineSuccess'));
      }
    });
  };

  const resetAllRoutines = () => {
    setConfirmModal({
      isOpen: true,
      title: t('settings.deleteAllRoutines'),
      message: t('settings.deleteAllConfirm'),
      confirmLabel: t('common.confirm'),
      confirmColor: 'rose',
      validationValue: userData.userName || t('csv.placeholderMe'),
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          routineChunks: [],
          taskHistory: [],
          routineGroupHistory: [],
          dailyCompletionRate: {},
          lastResetDate: null,
          dailyTaskStatus: {},
          forcedActiveTasks: {},
          lastPerfectDayAnimationDate: undefined
        }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletionMessage(t('settings.deleteAllSuccess'));
      }
    });
  };

  const resetAllSettings = () => {
    setConfirmModal({
      isOpen: true,
      title: t('settings.resetSettingsTitle'),
      message: t('settings.resetSettingsConfirm'),
      confirmLabel: t('common.confirm'),
      confirmColor: 'rose',
      onConfirm: () => {
        const currentLang = i18n.language || 'ko';
        const defKoNagging = getNaggingDefaultSettings('ko');
        const defEnNagging = getNaggingDefaultSettings('en');
        const defJaNagging = getNaggingDefaultSettings('ja');
        const currentDefNagging = getNaggingDefaultSettings(currentLang);

        setUserData(prev => ({
          ...prev,
          userName: '나',
          targetWakeUpTime: '07:00',
          resetTime: '00:00',
          dailyResetHour: 0,
          isVoiceEnabled: true,
          isWakeUpAlarmEnabled: false,
          firstRoutineAutoStart: false,
          nextRoutineAutoStart: false,
          hideAnytimeTimer: false,
          autoNextAccumulatedRoutine: false,
          autoReorderInProgressGroups: true,
          autoReorderCompletedGroups: true,
          autoReorderInactiveGroups: true,
          nextRoutineGroupGuidanceEnabled: false,
          darkModeTheme: 'light',
          darkModeFollowSystem: false,
          soundSettings: {
            wakeUpCheckIn: { enabled: true, file: '/sounds/freesound_community-success-fanfare-trumpets-6185.mp3' },
            triggerRoutineStart: { enabled: true, file: '/sounds/driken5482-applause-cheer-236786.mp3' },
            individualRoutineComplete: { enabled: true, file: '/sounds/tithuh-level-up-523624.mp3' },
            routineGroupComplete: { enabled: true, file: '/sounds/dragon-studio-fireworks-02-419019.mp3' },
            todayEnd: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
            allGroupsComplete: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
            chickSound: { enabled: true, file: 'public/sounds/nikin-short-chick-sound-171389.mp3' }
          },
          naggingSettings: currentDefNagging,
          naggingSettingsByLang: {
            ko: defKoNagging,
            en: defEnNagging,
            ja: defJaNagging
          },
          completionTemplatesByLang: {
            ko: [
              "내가 #그룹 해냄.",
              "나는 #목적이야.",
              "내 이름은 #이름, #소요시간만에 #그룹을/를 완료한 #목적이죠."
            ],
            en: [
              "I did #group.",
              "I am #purpose.",
              "My name is #name, the #purpose who completed #group in #duration."
            ],
            ja: [
              "私が #グループ を成し遂げた。",
              "私は #目的 だ。",
              "私の名前は #名前、#所要時間 で #グループ を完了した #目的 です。"
            ]
          }
        }));

        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletionMessage(t('settings.resetSettingsSuccess'));
      }
    });
  };

  const handleExportData = async () => {
    const now = new Date();
    const resetHour = userData.dailyResetHour || 0;
    const currentTodayStr = getEffectiveDate(now, resetHour);

    setBackupMessage(t('settings.backupPreparing'));
    
    let snapshot: UserData = JSON.parse(JSON.stringify(userData));

    snapshot.routineChunks = snapshot.routineChunks.map(chunk => ({
      ...chunk,
      tasks: chunk.tasks.map(task => {
        if (task.startTime && !task.isPaused && !task.completed && task.status !== TaskStatus.SKIP) {
          const currentDuration = calculateTaskDuration(task, now);
          return {
            ...task,
            accumulatedDuration: currentDuration
          };
        }
        return task;
      })
    }));

    snapshot = syncHistory(snapshot, currentTodayStr);

    const exportPayload: Record<string, any> = {
      [STORAGE_KEY]: snapshot,
      'WakeUpTimeHistory': snapshot.wakeUpTimeHistory || [],
      'RoutineGroupHistory': snapshot.routineGroupHistory || [],
      'TaskHistory': snapshot.taskHistory || [],
      'routine_activity_log': activityLog,
      'routine_last_activity_sync': now.getTime().toString()
    };

    const finalData: Record<string, string> = {};
    Object.entries(exportPayload).forEach(([key, value]) => {
      finalData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    });

    const jsonString = JSON.stringify(finalData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const dateStr = formatDate(now).replace(/-/g, '');
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const fileName = `danharu_backup_${dateStr}_${timeStr}.json`;

    const file = new File([blob], fileName, { type: 'application/json' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      try {
        await navigator.share({
          files: [file],
          title: t('settings.backupShareTitle'),
          text: t('settings.backupShareDesc')
        });
        setBackupMessage(null);
        setDeletionMessage(t('settings.backupSuccess'));
        return;
      } catch (error) {
        setBackupMessage(null);
        if ((error as Error).name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setBackupMessage(null);
    setDeletionMessage(t('settings.backupSaved'));
  };

  const handleExportCSV = async () => {
    const now = new Date();
    const resetHour = userData.dailyResetHour || 0;
    const currentTodayStr = getEffectiveDate(now, resetHour);

    let snapshot: UserData = JSON.parse(JSON.stringify(userData));

    snapshot.routineChunks = snapshot.routineChunks.map(chunk => ({
      ...chunk,
      tasks: chunk.tasks.map(task => {
        if (task.startTime && !task.isPaused && !task.completed && task.status !== TaskStatus.SKIP) {
          const currentDuration = calculateTaskDuration(task, now);
          return {
            ...task,
            accumulatedDuration: currentDuration
          };
        }
        return task;
      })
    }));

    snapshot = syncHistory(snapshot, currentTodayStr);

    const datesSet = new Set<string>();
    Object.keys(snapshot.dailyCompletionRate || {}).forEach(d => { if (d) datesSet.add(d); });
    if (snapshot.dailyCheckIn) {
      Object.keys(snapshot.dailyCheckIn).forEach(d => { if (d) datesSet.add(d); });
    }
    (snapshot.taskHistory || []).forEach(h => { if (h && h.date) datesSet.add(h.date); });
    (snapshot.routineGroupHistory || []).forEach(h => { if (h && h.date) datesSet.add(h.date); });
    (snapshot.wakeUpTimeHistory || []).forEach(h => { if (h && h.date) datesSet.add(h.date); });
    datesSet.add(currentTodayStr);

    const activeDates = Array.from(datesSet).filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (activeDates.length === 0) {
      setDeletionMessage(t('settings.noRoutineRecords'));
      return;
    }
    
    activeDates.sort();
    const minDateStr = activeDates[0];
    const maxDateStr = activeDates[activeDates.length - 1];

    const allDatesSorted: string[] = [];
    const start = new Date(minDateStr);
    const end = new Date(maxDateStr);
    const current = new Date(start);
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      allDatesSorted.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    allDatesSorted.reverse();

    const headers = [
      t('csv.date'),
      t('csv.overallRate'),
      t('csv.groupName'),
      t('csv.groupStartTime'),
      t('csv.groupEndTime'),
      t('csv.groupDuration'),
      t('csv.groupCompleted'),
      t('csv.taskName'),
      t('csv.taskStartTime'),
      t('csv.taskEndTime'),
      t('csv.taskType'),
      t('csv.taskTargetDuration'),
      t('csv.taskActualDuration'),
      t('csv.taskCompleted')
    ];

    const csvRows: string[][] = [headers];

    allDatesSorted.forEach(dateStr => {
      const dayRate = snapshot.dailyCompletionRate?.[dateStr];
      const day_rate_display = (dayRate !== undefined && dayRate !== null) ? `${dayRate}%` : '';

      const aliveGroupsOnDate = (snapshot.routineChunks || []).filter(group => {
        const creationDate = getCreationDate(group.id, snapshot);
        return dateStr >= creationDate;
      });

      const histGroupIds = new Set<string>();
      (snapshot.routineGroupHistory || []).forEach(h => {
        if (h.date === dateStr) histGroupIds.add(h.groupId);
      });
      (snapshot.taskHistory || []).forEach(h => {
        if (h.date === dateStr) histGroupIds.add(h.groupId);
      });

      const allGroupKeys = Array.from(new Set([
        ...aliveGroupsOnDate.map(g => g.id),
        ...Array.from(histGroupIds)
      ])).filter(groupId => {
        const creationDate = getCreationDate(groupId, snapshot);
        return dateStr >= creationDate;
      });

      allGroupKeys.forEach(groupId => {
        const aliveGroup = (snapshot.routineChunks || []).find(g => g.id === groupId);
        const groupHistEntry = (snapshot.routineGroupHistory || []).find(
          h => h.date === dateStr && h.groupId === groupId
        );
        const taskHistEntries = (snapshot.taskHistory || []).filter(
          h => h.groupId === groupId && h.date === dateStr
        );

        const [yStr, mStr, dStr] = dateStr.split('-');
        const yParsed = parseInt(yStr, 10);
        const mParsed = parseInt(mStr, 10);
        const dParsed = parseInt(dStr, 10);
        const dateObj = new Date(yParsed, mParsed - 1, dParsed);
        const dayOfWeek = dateObj.getDay();

        const isNormallyInactive = aliveGroup
          ? (!aliveGroup.scheduledDays?.includes(dayOfWeek) && !aliveGroup.forcedActiveDates?.includes(dateStr))
          : false;

        const isSkipped = aliveGroup
          ? (aliveGroup.inactiveDates?.includes(dateStr) || snapshot.inactiveChunks?.[dateStr]?.includes(groupId))
          : (snapshot.inactiveChunks?.[dateStr]?.includes(groupId));

        const isRestDay = !isSkipped && (
          groupHistEntry
            ? (groupHistEntry.completionStatus === '비활성' || groupHistEntry.isActive === false)
            : isNormallyInactive
        );

        const activeTasks = taskHistEntries.filter(t => t.isActive);
        let allActiveTasksUnexecuted = false;
        if (activeTasks.length > 0) {
          allActiveTasksUnexecuted = activeTasks.every(t => 
            !t.status || t.status === '미실행' || t.status === '비활성'
          );
        } else if (aliveGroup) {
          const isNormallyActiveOnDate = (aliveGroup.scheduledDays?.includes(dayOfWeek) || aliveGroup.forcedActiveDates?.includes(dateStr)) && !aliveGroup.inactiveDates?.includes(dateStr);
          if (isNormallyActiveOnDate) {
            allActiveTasksUnexecuted = true;
          }
        }

        const isUnexecuted = !isRestDay && !isSkipped && (
          groupHistEntry?.completionStatus === '미실행' || 
          (groupHistEntry && !groupHistEntry.firstTaskStartTime && groupHistEntry.totalDuration === 0) ||
          (!groupHistEntry && allActiveTasksUnexecuted)
        );

        const isRecordMissing = !isRestDay && !isSkipped && !isUnexecuted && (
          dateStr < currentTodayStr && !groupHistEntry && taskHistEntries.length === 0
        );

        let specialState: '쉬는요일' | '건너뜀' | '미실행' | '기록누락' | null = null;
        if (isRestDay) {
          specialState = '쉬는요일';
        } else if (isSkipped) {
          specialState = '건너뜀';
        } else if (isUnexecuted) {
          specialState = '미실행';
        } else if (isRecordMissing) {
          specialState = '기록누락';
        }

        let groupStatus: '정상' | '비활성' | '쉬어감' = '정상';
        if (aliveGroup) {
          if (aliveGroup.inactiveDates?.includes(dateStr)) {
            groupStatus = '쉬어감';
          } else if (isNormallyInactive || groupHistEntry?.completionStatus === '비활성' || groupHistEntry?.isActive === false) {
            groupStatus = '비활성';
          }
        } else {
          if (groupHistEntry?.completionStatus === '비활성' || groupHistEntry?.isActive === false) {
            groupStatus = '비활성';
          }
        }

        const g_name = aliveGroup ? aliveGroup.name : t('csv.deletedGroup');
        
        let g_start = groupHistEntry?.firstTaskStartTime || '--:--';
        let g_end = groupHistEntry?.completedAt || '--:--';
        let g_dur = groupHistEntry?.totalDuration ? formatDurationPrecise(groupHistEntry.totalDuration) : '-';

        if (g_start !== '--:--' && g_start.split(':').length >= 3) {
          g_start = g_start.split(':').slice(0, 2).join(':');
        }
        if (g_end !== '--:--' && g_end.split(':').length >= 3) {
          g_end = g_end.split(':').slice(0, 2).join(':');
        }

        let g_completion_status = '0%';
        if (specialState === '기록누락') {
          g_completion_status = t('csv.noRecord');
          g_start = '--:--';
          g_end = '--:--';
          g_dur = '-';
        } else if (specialState === '쉬는요일') {
          g_completion_status = t('csv.restDay');
          g_start = '--:--';
          g_end = '--:--';
          g_dur = '-';
        } else if (specialState === '건너뜀' || groupStatus === '쉬어감') {
          g_completion_status = t('csv.skipped');
          g_start = '--:--';
          g_end = '--:--';
          g_dur = '-';
        } else if (specialState === '미실행') {
          g_completion_status = '0%';
          g_start = '--:--';
          g_end = '--:--';
          g_dur = '-';
        } else {
          const totalActiveOnDate = taskHistEntries.filter(t => t.isActive);
          const completedTasksCount = totalActiveOnDate.filter(
            t => t.status === '완벽' || t.status === '완료' || t.status === '스킵'
          ).length;

          if (totalActiveOnDate.length > 0) {
            if (completedTasksCount === totalActiveOnDate.length) {
              const hasSkip = totalActiveOnDate.some(t => t.status === '스킵');
              g_completion_status = hasSkip ? t('csv.completedPercent') : t('csv.perfectPercent');
            } else {
              const pct = Math.floor((completedTasksCount / totalActiveOnDate.length) * 100);
              g_completion_status = `${pct}%`;
            }
          } else {
            if (groupHistEntry?.completionStatus === '전체완료') {
              g_completion_status = t('csv.perfectPercent');
            } else {
              g_completion_status = '0%';
            }
          }
        }

        const aliveTasks = aliveGroup ? (aliveGroup.tasks || []) : [];
        const aliveTasksOnDate = aliveTasks.filter(task => {
          const tCreateDate = getCreationDate(task.id, snapshot);
          return dateStr >= tCreateDate;
        });

        const allTaskIds = Array.from(new Set([
          ...aliveTasksOnDate.map(t => t.id),
          ...taskHistEntries.map(t => t.taskId)
        ])).filter(taskId => {
          const tCreateDate = getCreationDate(taskId, snapshot);
          return dateStr >= tCreateDate;
        });

        if (allTaskIds.length === 0) {
          csvRows.push([
            dateStr,
            day_rate_display,
            g_name,
            g_start,
            g_end,
            g_dur,
            g_completion_status,
            '-',
            '--:--',
            '--:--',
            '-',
            '-',
            '-',
            g_completion_status === t('csv.noRecord') ? t('csv.noRecord') : (g_completion_status === t('csv.restDay') ? t('csv.restDay') : t('csv.unexecuted'))
          ]);
        } else {
          allTaskIds.forEach(taskId => {
            const aliveTask = aliveTasksOnDate.find(t => t.id === taskId);
            const taskHistEntry = taskHistEntries.find(t => t.taskId === taskId);

            const t_name = aliveTask ? aliveTask.text : t('csv.deletedRoutine');
            
            let isScheduled = true;
            if (aliveGroup && aliveTask) {
              isScheduled = isTaskScheduledToday(aliveTask, aliveGroup, dateObj, snapshot);
            }

            let t_status = t('csv.unexecuted');
            if (taskHistEntry) {
              if (taskHistEntry.status === '완벽') {
                t_status = t('csv.perfect');
              } else if (taskHistEntry.status === '완료') {
                t_status = t('csv.completed');
              } else if (taskHistEntry.status === '스킵') {
                t_status = t('csv.skip');
              } else if (taskHistEntry.status === '비활성') {
                t_status = t('csv.restDay');
              } else {
                t_status = t('csv.unexecuted');
              }
            } else {
              if (specialState === '기록누락') {
                t_status = t('csv.noRecord');
              } else if (specialState === '쉬는요일' || !isScheduled) {
                t_status = t('csv.restDay');
              } else if (specialState === '건너뜀') {
                t_status = t('csv.skip');
              } else {
                t_status = t('csv.unexecuted');
              }
            }

            let t_start = taskHistEntry?.startTime || '--:--';
            let t_end = taskHistEntry?.endTime || '--:--';
            let t_dur = taskHistEntry?.duration ? formatDurationPrecise(taskHistEntry.duration) : '-';

            if (t_start !== '--:--' && t_start.split(':').length >= 3) {
              t_start = t_start.split(':').slice(0, 2).join(':');
            }
            if (t_end !== '--:--' && t_end.split(':').length >= 3) {
              t_end = t_end.split(':').slice(0, 2).join(':');
            }

            if (t_status === t('csv.restDay')) {
              t_start = '--:--';
              t_end = '--:--';
              t_dur = '-';
            }

            const t_type = aliveTask ? (
              aliveTask.taskType === TaskType.TIME_INDEPENDENT ? t('taskType.TIME_INDEPENDENT') :
              aliveTask.taskType === TaskType.TIME_LIMITED ? t('taskType.TIME_LIMITED') : t('taskType.TIME_ACCUMULATED')
            ) : '-';

            const t_target = (aliveTask && aliveTask.targetDuration) ? t('home.minutes', { minutes: aliveTask.targetDuration }) : '-';

            csvRows.push([
              dateStr,
              day_rate_display,
              g_name,
              g_start,
              g_end,
              g_dur,
              g_completion_status,
              t_name,
              t_start,
              t_end,
              t_type,
              t_target,
              t_dur,
              t_status
            ]);
          });
        }
      });
    });

    const escapeCSV = (val: string): string => {
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvContent = "\uFEFF" + csvRows.map(row => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const dateStr = formatDate(now).replace(/-/g, '');
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const fileName = `danharu_routine_data_${dateStr}_${timeStr}.csv`;

    const file = new File([blob], fileName, { type: 'text/csv' });
    const ua = navigator.userAgent;
    const isWindows = /Windows/i.test(ua);
    const isMac = /Macintosh/i.test(ua);
    const isLinuxDesktop = /Linux/i.test(ua) && !/Android/i.test(ua);
    const isDesktopOS = isWindows || isMac || isLinuxDesktop;

    if (!isDesktopOS && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: t('settings.csvShareTitle'),
          text: t('settings.csvShareDesc')
        });
        setDeletionMessage(t('settings.csvExportComplete'));
      } catch (err) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDeletionMessage(t('settings.csvDownloadComplete'));
      }
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDeletionMessage(t('settings.csvDownloadComplete'));
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data[STORAGE_KEY]) {
          throw new Error(t('settings.invalidBackupFile'));
        }

        setConfirmModal({
          isOpen: true,
          title: t('settings.restoreTitle'),
          message: t('settings.restoreConfirm'),
          confirmLabel: t('settings.overwrite'),
          onConfirm: async () => {
            try {
              const promises = Object.entries(data).map(async ([key, value]) => {
                if (value !== null) {
                  let parsedValue: any = value;
                  try {
                    parsedValue = JSON.parse(value as string);
                  } catch (e) {
                     // It was a plain string or already parsed
                  }
                  await localForage.setItem(key, parsedValue);
                  localStorage.setItem(key, typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue));
                }
              });
              await Promise.all(promises);
              window.location.reload();
            } catch (err) {
              console.error('Failed to import backup data to localForage', err);
              setDeletionMessage(t('settings.restoreFailed'));
            }
          }
        });
      } catch (err) {
        setDeletionMessage(t('settings.fileReadError'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <motion.div
      key="general-settings"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* 사용자 이름 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.userNameLabel'))}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={userNameEdit}
            onChange={(e) => setUserNameEdit(e.target.value)}
            id="userNameInput"
            placeholder={t('csv.placeholderMe')}
            className="w-full min-w-0 flex-grow text-base font-black p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100"
          />
          <button 
            onClick={() => {
              if (userNameEdit !== (userData.userName || t('csv.placeholderMe'))) {
                updateUserName(userNameEdit);
              }
            }}
            disabled={userNameEdit === (userData.userName || t('csv.placeholderMe'))}
            className={`px-4 rounded-xl font-bold text-sm transition-colors shadow-md w-max whitespace-nowrap shrink-0 ${
              userNameEdit !== (userData.userName || t('csv.placeholderMe'))
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* 목표 기상 시간 및 알림 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.wakeUpGoalTime'))}
        </div>
        <div className="flex gap-1.5 sm:gap-2 items-center">
          <input 
            type="time" 
            value={wakeUpTimeEdit}
            onChange={(e) => setWakeUpTimeEdit(e.target.value)}
            id="wakeUpTimeInput"
            className="w-full min-w-0 flex-grow text-sm sm:text-base font-black p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100"
          />
          <button 
            onClick={() => {
              if (wakeUpTimeEdit !== userData.targetWakeUpTime) {
                updateWakeUpTime(wakeUpTimeEdit);
              }
            }}
            disabled={wakeUpTimeEdit === userData.targetWakeUpTime}
            className={`h-10 px-2.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-md shrink-0 ${
              wakeUpTimeEdit !== userData.targetWakeUpTime
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {t('settings.changeBtn')}
          </button>
          <button 
            onClick={() => {
              soundService.unlock();
              toggleWakeUpAlarm();
            }}
            className={`h-10 px-2.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 flex items-center gap-1 sm:gap-1.5 ${
              userData.isWakeUpAlarmEnabled 
                ? 'bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            {userData.isWakeUpAlarmEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {t('settings.alarmBtn')}
          </button>
        </div>
      </div>

      {/* 하루 기준 시작 시각(리셋 시각) 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.dayResetTime'))}
        </div>
        {renderSettingDesc(t('settings.dayResetTimeDesc'))}
        
        <div className="relative">
          <button 
            onClick={() => setIsResetTimeDropdownOpen(!isResetTimeDropdownOpen)}
            className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">
                {t('settings.amHour', { hour: parseInt(userData.resetTime.split(':')[0]) })}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isResetTimeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isResetTimeDropdownOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60]"
                  onClick={() => setIsResetTimeDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-[70] overflow-hidden"
                >
                  <div className="p-1.5 space-y-0.5">
                    {[0, 1, 2, 3, 4].map((hour) => {
                      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                      const isSelected = userData.resetTime === timeStr;
                      return (
                        <button
                          key={hour}
                          onClick={() => {
                            updateResetTime(timeStr);
                            setIsResetTimeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                            isSelected 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-black text-sm">{t('settings.amHour', { hour })}</span>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 타이머 자동 시작 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.autoTimerStart'))}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {renderSettingSmallTitle(t('settings.firstRoutineAutoStart'))}
              {renderSettingDesc(t('settings.firstRoutineAutoStartDesc'))}
            </div>
            <button 
              onClick={() => setUserData(prev => ({ ...prev, firstRoutineAutoStart: !prev.firstRoutineAutoStart }))}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.firstRoutineAutoStart ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.firstRoutineAutoStart ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {renderSettingSmallTitle(t('settings.nextRoutineAutoStart'))}
              {renderSettingDesc(t('settings.nextRoutineAutoStartDesc'))}
            </div>
            <button 
              onClick={() => setUserData(prev => ({ ...prev, nextRoutineAutoStart: !prev.nextRoutineAutoStart }))}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.nextRoutineAutoStart ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.nextRoutineAutoStart ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 시간무관루틴 타이머 숨김 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.hideAnytimeTimer'))}
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            {renderSettingDesc(t('settings.hideAnytimeTimerDesc'))}
          </div>
          <button 
            onClick={() => setUserData(prev => ({ ...prev, hideAnytimeTimer: !prev.hideAnytimeTimer }))}
            className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.hideAnytimeTimer ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.hideAnytimeTimer ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* 시간축적루틴 자동 진행 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <BrickWall className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.autoNextAccumulated'))}
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            {renderSettingDesc(t('settings.autoNextAccumulatedDesc'))}
          </div>
          <button 
            onClick={() => setUserData(prev => ({ ...prev, autoNextAccumulatedRoutine: !prev.autoNextAccumulatedRoutine }))}
            className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.autoNextAccumulatedRoutine ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.autoNextAccumulatedRoutine ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* 루틴 그룹 자동 정렬 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <ArrowUpDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.autoReorder'))}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {renderSettingSmallTitle(t('settings.autoReorderInProgress'))}
              {renderSettingDesc(t('settings.autoReorderInProgressDesc'))}
            </div>
            <button 
              onClick={() => setUserData(prev => ({ ...prev, autoReorderInProgressGroups: !prev.autoReorderInProgressGroups }))}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.autoReorderInProgressGroups ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.autoReorderInProgressGroups ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {renderSettingSmallTitle(t('settings.autoReorderCompleted'))}
              {renderSettingDesc(t('settings.autoReorderCompletedDesc'))}
            </div>
            <button 
              onClick={() => setUserData(prev => ({ ...prev, autoReorderCompletedGroups: !prev.autoReorderCompletedGroups }))}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.autoReorderCompletedGroups ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.autoReorderCompletedGroups ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {renderSettingSmallTitle(t('settings.autoReorderInactive'))}
              {renderSettingDesc(t('settings.autoReorderInactiveDesc'))}
            </div>
            <button 
              onClick={() => setUserData(prev => ({ ...prev, autoReorderInactiveGroups: !prev.autoReorderInactiveGroups }))}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.autoReorderInactiveGroups ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.autoReorderInactiveGroups ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 다음 루틴 그룹 안내 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <ArrowBigRightDash className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.nextRoutineGroupGuidance'))}
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            {renderSettingDesc(t('settings.nextRoutineGroupGuidanceDesc'))}
          </div>
          <button 
            onClick={() => setUserData(prev => ({ ...prev, nextRoutineGroupGuidanceEnabled: !prev.nextRoutineGroupGuidanceEnabled }))}
            className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${userData.nextRoutineGroupGuidanceEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userData.nextRoutineGroupGuidanceEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* 효과음 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.soundEffects'))}
        </div>
        {renderSettingDesc(t('settings.soundEffectsDesc'))}
        <button 
          onClick={() => setSettingsSubView({ type: 'sound' })}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px] group"
        >
          <span className="text-sm font-black text-slate-700 dark:text-slate-300">{t('settings.configureSoundEffects')}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>

      {/* 잔소리 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.naggingFeature'))}
        </div>
        {renderSettingDesc(t('settings.naggingFeatureDesc'))}
        <button 
          onClick={() => setSettingsSubView({ type: 'nagging' })}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px] group"
        >
          <span className="text-sm font-black text-slate-700 dark:text-slate-300">{t('settings.configureNagging')}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>

      {/* 루틴 그룹 완료 문구 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.completionPhrasesFeature'))}
        </div>
        {renderSettingDesc(t('settings.completionPhrasesFeatureDesc'))}
        <button 
          onClick={() => setSettingsSubView({ type: 'completionPhrases' })}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px] group"
        >
          <span className="text-sm font-black text-slate-700 dark:text-slate-300">{t('settings.configureCompletionPhrases')}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>

      {/* 다크 모드 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.darkModeSettings'))}
        </div>
        {renderSettingDesc(t('settings.darkModeSettingsDesc'))}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex-1 border border-slate-200/50 dark:border-slate-800/80">
            <button
              type="button"
              disabled={userData.darkModeFollowSystem}
              onClick={() => setUserData(prev => ({ ...prev, darkModeTheme: 'light' }))}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                userData.darkModeFollowSystem
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : userData.darkModeTheme === 'light'
                    ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              {t('settings.lightMode')}
            </button>
            <button
              type="button"
              disabled={userData.darkModeFollowSystem}
              onClick={() => setUserData(prev => ({ ...prev, darkModeTheme: 'dark' }))}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                userData.darkModeFollowSystem
                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : userData.darkModeTheme === 'dark'
                    ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              {t('settings.darkModeBtn')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setUserData(prev => ({ ...prev, darkModeFollowSystem: !prev.darkModeFollowSystem }))}
            className={`flex items-center justify-between px-3 py-2 border rounded-xl transition-all text-left flex-1 ${
              userData.darkModeFollowSystem
                ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-black'
                : 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-xs">{t('settings.followSystem')}</span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex-shrink-0 ml-2 ${
              userData.darkModeFollowSystem ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                userData.darkModeFollowSystem ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </button>
        </div>
      </div>

      {/* 데이터 백업 및 복원 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          {renderSettingBigTitle(t('settings.backupAndRestore'))}
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleExportCSV}
            className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px] group"
          >
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:border-blue-200 transition-colors flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-700 dark:text-slate-300">{t('settings.exportCSV')}</span>
              {renderSettingDesc(t('settings.exportCSVDesc'))}
            </div>
          </button>

          <button 
            onClick={handleExportData}
            className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px] group"
          >
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:border-indigo-200 transition-colors flex-shrink-0">
              <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-700 dark:text-slate-300">{t('settings.backupData')}</span>
              {renderSettingDesc(t('settings.backupDataDesc'))}
            </div>
          </button>

          <div className="relative group/restore">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportData}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <button 
              className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl group-hover/restore:bg-indigo-50 group-hover/restore:border-indigo-200 transition-all text-left group-active/restore:translate-y-[2px] group-active/restore:border-b-[2px] group-active/restore:pb-[18px] mb-[2px] group pointer-events-none"
            >
              <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover/restore:border-indigo-200 transition-colors flex-shrink-0">
                <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-700 dark:text-slate-300">{t('settings.restoreData')}</span>
                {renderSettingDesc(t('settings.restoreDataDesc'))}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 기록 삭제 및 초기화 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-50 dark:bg-rose-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          {renderSettingBigTitle(t('settings.deleteRecords'))}
        </div>

        <div className="space-y-3">
          <button 
            onClick={resetWakeUpHistory}
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px]"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.deleteWakeUpRecords')}</span>
            {renderSettingDesc(t('settings.deleteWakeUpRecordsDesc'))}
          </button>

          <button 
            onClick={resetUsageHistory}
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px]"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.deleteUsageRecords')}</span>
            {renderSettingDesc(t('settings.deleteUsageRecordsDesc'))}
          </button>

          <button 
            onClick={resetRoutineHistory}
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px]"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.deleteRoutineRecords')}</span>
            {renderSettingDesc(t('settings.deleteRoutineRecordsDesc'))}
          </button>

          <button 
            onClick={resetAllRoutines}
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px]"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.deleteAllRoutines')}</span>
            {renderSettingDesc(t('settings.deleteAllRoutinesDesc'))}
          </button>

          <button 
            onClick={resetAllSettings}
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px]"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.resetSettings')}</span>
            {renderSettingDesc(t('settings.resetSettingsDesc'))}
          </button>
        </div>
      </div>

      {/* 앱 정보 및 지원 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          {renderSettingBigTitle(t('settings.introAndSupport'))}
        </div>

        <div className="space-y-3">
          <div 
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl text-left"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.versionCheck')}</span>
            <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 leading-tight">{MY_APP_VERSION}</span>
          </div>

          <button 
            onClick={() => {}}
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px]"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.privacyPolicy')}</span>
            {renderSettingDesc(t('settings.privacyPolicyDesc'))}
          </button>

          <button 
            onClick={() => {}}
            className="w-full flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-950 border-x border-t border-slate-200 dark:border-slate-800 border-b-[4px] border-b-slate-200 dark:border-b-slate-950 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left active:translate-y-[2px] active:border-b-[2px] active:pb-[18px] mb-[2px]"
          >
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{t('settings.supportUrl')}</span>
            {renderSettingDesc(t('settings.supportUrlDesc'))}
          </button>
        </div>
      </div>

      {/* 다국어 언어 설정 */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950/40 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          {renderSettingBigTitle(t('settings.languageTitle'))}
        </div>
        {renderSettingDesc(t('settings.languageDesc'))}
        <div className="flex items-center gap-3">
          <button
            onClick={() => i18n.changeLanguage('ko')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all transform active:scale-95 cursor-pointer ${
              (i18n.resolvedLanguage?.startsWith('ko') || i18n.language?.startsWith('ko') || (!i18n.language?.startsWith('ja') && !i18n.language?.startsWith('en')))
                ? 'bg-indigo-600 border border-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            한국어 (KO)
          </button>

          <button
            onClick={() => i18n.changeLanguage('ja')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all transform active:scale-95 cursor-pointer ${
              (i18n.resolvedLanguage?.startsWith('ja') || i18n.language?.startsWith('ja'))
                ? 'bg-indigo-600 border border-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            日本語 (JA)
          </button>

          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all transform active:scale-95 cursor-pointer ${
              (i18n.resolvedLanguage?.startsWith('en') || i18n.language?.startsWith('en'))
                ? 'bg-indigo-600 border border-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            English (EN)
          </button>
        </div>
      </div>
    </motion.div>
  );
};
