/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import localForage from 'localforage';
import { 
  Sun,
  CheckCircle2, 
  Circle, 
  CircleDot,
  PauseCircle,
  Settings, 
  Trash2, 
  Clock,
  ChevronRight,
  BarChart3,
  Home,
  AlertCircle,
  BellOff,
  Play,
  Timer,
  X,
  RotateCcw,
  PlusCircle,
  Check,
  CheckCheck,
  CircleMinus,
  Volume2,
  VolumeX,
  Save,
  ArrowBigRightDash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';


// Internal Types & Constants
import { 
  TaskType, 
  Task, 
  RoutineChunk, 
  UserData, 
  SettingsSubView,
  TaskStatus,
  WakeUpTimeHistoryEntry,
  RoutineGroupHistoryEntry,
  TaskHistoryEntry,
  NaggingSettings,
  SoundEffectSettings
} from './types';
import phrases from './phrases.json';
import { SettingsView } from './components/settings/SettingsView';
import { 
  STORAGE_KEY 
} from './constants';
import { 
  isChunkScheduledToday, 
  isTaskScheduledToday, 
  isTaskTargetForStats,
  formatDate, 
  getEffectiveDate,
  getEffectiveDateObject,
  getDaysBetween,
  getJosa,
  calculateTaskDuration
} from './utils';
import { CheckCheckIcon } from './components/CheckCheckIcon';
import { useCheckCheckBox } from './hooks/useCheckCheckBox';
import { useRoutineManager } from './hooks/useRoutineManager';
import { useNaggingEngine } from './hooks/useNaggingEngine';
import { getNaggingDefaultSettings } from './utils/naggingDefaults';
import { voiceService } from './services/voiceService';
import { soundService } from './services/soundService';
import { notificationService } from './services/notificationService';

// --- Application ---
import { HeaderBox } from './components/layout/HeaderBox';
import { HomeView } from './components/views/HomeView';
import { StatsView } from './components/views/StatsView';
import { ExecutionView } from './components/common/ExecutionView';
import { RoutineGroupFormView } from './components/common/RoutineGroupFormView';
// import { AddRoutineGroupView } from './components/views/AddRoutineGroupView';
import { ConfirmModal } from './components/common/ConfirmModal';
import { PerfectDayAnimation } from './PerfectDayAnimation';
import { TodayEndAnimation } from './TodayEndAnimation';
// import { TaskInputSection } from './components/routine/TaskInputSection';
// import { SortableTaskItem } from './components/routine/SortableTaskItem';
// import { SortableChunkItem } from './components/routine/SortableChunkItem';
// import { SortableChecklistItem } from './components/routine/SortableChecklistItem';
// --- Components ---





// --- Application ---

// --- Main Application ---

// --- Sub-components ---






export const OldExecutionView = () => {
  return null;
};


// --- Helper Components ---

interface NextRoutineSuggestion {
  chunkId: string;
  chunkName: string;
  taskId: string;
  taskName: string;
}

// [디자인 수정 구역: 홈화면 및 실행화면 글꼴설정]
export const FONT_SETTINGS = {
  // 홈화면의 글꼴설정
  settings: {
    base_style: {
      color: "#000000",
      fontSize: "1rem",
      fontWeight: "100"
    },
    purpose_style: {
      color: "#F2C427",
      fontSize: "1.5rem",
      fontWeight: "bold"
    },
    title_style: {
      color: "#622AEF",
      fontSize: "2rem",
      fontWeight: "bold"
    },
    days_style: {
      color: "#000000",
      fontSize: "1.1rem"
    },
    start_info_style: {
      color: "#1c9c64",
      fontSize: "1.1rem"
    },
    duration_style: {
      color: " #544C73",
      fontSize: "1.1rem"
    },
    totalTargetDuration_style: {
      color: "#1c9c64",
      fontSize: "1.1rem"
    },
    userName_style: {
      color: "#736533",
      fontSize: "1.3rem",
      fontWeight: "bold"
    },
    startTime_style: {
      color: "#1c9c64",
      fontSize: "1.1rem"
    },
    endTime_style: {
      color: "#1c9c64",
      fontSize: "1.1rem"
    },
    triggerTask_style: {
      color: "#277EF2",
      fontSize: "1.1rem",
      fontWeight: "bold"
    }
  },
  // 실행화면의 글꼴설정
  execution_settings: {
    base_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    purpose_style: { "color": "#ffffff", "fontSize": "1.5rem", "fontWeight": "bold" },
    title_style: { "color": "#ffffff", "fontSize": "1.8rem", "fontWeight": "bold" },
    days_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    start_info_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    duration_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    totalTargetDuration_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    userName_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    startTime_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    endTime_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" },
    triggerTask_style: { "color": "#ffffff", "fontSize": "1rem", "fontWeight": "bold" }
  }
};

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
        msg = msg.replace(/name/g, name);
        msg = msg.replace(/task/g, task);
        msg = msg.replace(/n/g, n.toString());
        msg = msg.replace(/m/g, m.toString());
        msg = msg.replace(/r/g, r.toString());
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

export default function App() {
  const { t, i18n } = useTranslation();
  // --- State ---
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'execution' | 'settings' | 'add'>('home');
  const [statsKey, setStatsKey] = useState(0);
  const [showNextRoutineModal, setShowNextRoutineModal] = useState(false);
  const [selectedTaskForStats, setSelectedTaskForStats] = useState<string | null>(null);
  const [modalSuggestions] = useState<NextRoutineSuggestion[]>([]);
  const [isWaitingForNextRoutineModal, setIsWaitingForNextRoutineModal] = useState(false);
  const nextRoutineTimerRef = useRef<any>(null);

  // Clean up nextroutine timer on unmount
  useEffect(() => {
    return () => {
      if (nextRoutineTimerRef.current) {
        clearTimeout(nextRoutineTimerRef.current);
      }
    };
  }, []);

  // Clear nextroutine timer and waiting state if leaving the home tab
  useEffect(() => {
    if (activeTab !== 'home' && nextRoutineTimerRef.current) {
      clearTimeout(nextRoutineTimerRef.current);
      nextRoutineTimerRef.current = null;
      setIsWaitingForNextRoutineModal(false);
    }
  }, [activeTab]);

  useEffect(() => {
    (window as any).__showPermissionGuide = () => setShowPermissionGuide(true);
    return () => { delete (window as any).__showPermissionGuide; };
  }, []);

  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [permissionNotificationMessage, setPermissionNotificationMessage] = useState<string | null>(null);
  const [swUpdateRegistration, setSwUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showPerfectDay, setShowPerfectDay] = useState(false);
  const [showTodayEnd, setShowTodayEnd] = useState(false);
  const [perfectDayGroups, setPerfectDayGroups] = useState<{ name: string; status: string }[]>([]);

  const hasShownPerfectDayThisVisitRef = useRef(false);
  const isAutoNextTransitioningRef = useRef(false);
  const lastProcessedStartTimeRef = useRef<string | null>(null);

  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [showCheckInCelebration, setShowCheckInCelebration] = useState(false);
   const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    (typeof window !== 'undefined' && 'Notification' in window && window.Notification) ? window.Notification.permission : 'default'
  );
 
   // Preload sounds and check notification permission
   useEffect(() => {
     soundService.preload('/sounds/tithuh-level-up-523624.mp3');
     soundService.preload('/sounds/freesound_community-success-fanfare-trumpets-6185.mp3');
     soundService.preload('/sounds/freesound_community-piglevelwin2mp3-14800.mp3');
     soundService.preload('/sounds/dragon-studio-fireworks-02-419019.mp3');
     soundService.preload('/sounds/driken5482-applause-cheer-236786.mp3');
     soundService.preload('/sounds/freesound_community-075176_duck-quack-40345.mp3');
     soundService.preload('/sounds/dragon-studio-dog-bark-382732.mp3');
     soundService.preload('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      soundService.preload('public/sounds/nikin-short-chick-sound-171389.mp3');
     
     // Auto-request permission on mount if first time
     if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === 'default') {
       notificationService.requestPermission().then(setNotificationPermission);
       addAvailableCheckCheckPoints(1, '앱 켜기(마운트)');
     }
   }, []);
 
   // Update notification permission state if changed externally
   useEffect(() => {
     if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) return;
     const checkPermission = () => {
       if (window.Notification && window.Notification.permission !== notificationPermission) {
         setNotificationPermission(window.Notification.permission);
       }
     };
    window.addEventListener('focus', checkPermission);
    return () => window.removeEventListener('focus', checkPermission);
  }, [notificationPermission]);

  const {
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

    setUserData,
    setActivityLog,
    setIsSettingsOpen,
    setSettingsSubView,
    setActiveAlarmChunk,
    setResetPauseModal,
    setBackupMessage,
    setLastCompletedTaskName,
    setDeletionMessage,

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
  } = useRoutineManager({
    activeTab,
    selectedChunkId,
  });

  const onRestart = (taskId: string) => {
    startTask(taskId, true);
  };








  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    showCancel?: boolean;
    validationValue?: string;
    validationPlaceholder?: string;
    confirmColor?: 'rose' | 'indigo';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '확인',
    cancelLabel: '취소',
    showCancel: true,
    onConfirm: () => {}
  });

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const isModalOpen = 
      isSettingsOpen || 
      confirmModal.isOpen || 
      !!activeAlarmChunk || 
      showPerfectDay || 
      showTodayEnd ||
      !!selectedTaskForStats ||
      resetPauseModal.isOpen ||
      showPermissionGuide ||
      !!permissionNotificationMessage ||
      showNextRoutineModal;

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      // Use overscroll-behavior to prevent pull-to-refresh and background scroll on touch devices
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [
    isSettingsOpen, 
    confirmModal.isOpen, 
    activeAlarmChunk, 
    showPerfectDay, 
    showTodayEnd,
    selectedTaskForStats,
    resetPauseModal.isOpen,
    showPermissionGuide,
    permissionNotificationMessage,
    showNextRoutineModal
  ]);

  const [isAddRoutineDirty, setIsAddRoutineDirty] = useState(false);
  const [isEditRoutineDirty, setIsEditRoutineDirty] = useState(false);
  const [isNaggingDirty, setIsNaggingDirty] = useState(false);
  const [localNaggingSettings, setLocalNaggingSettings] = useState<NaggingSettings | null>(null);
  const [naggingSuccessMessage, setNaggingSuccessMessage] = useState<string | null>(null);

  const [isSoundSettingsDirty, setIsSoundSettingsDirty] = useState(false);
  const [localSoundSettings, setLocalSoundSettings] = useState<SoundEffectSettings | null>(null);
  const [soundSuccessMessage, setSoundSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (naggingSuccessMessage) {
      const timer = setTimeout(() => setNaggingSuccessMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [naggingSuccessMessage]);

  useEffect(() => {
    if (soundSuccessMessage) {
      const timer = setTimeout(() => setSoundSuccessMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [soundSuccessMessage]);

  useEffect(() => {
    if (settingsSubView.type === 'nagging') {
      const defaultSettings: NaggingSettings = {
        startEnabled: false,
        restartEnabled: false,
        startMessage: 'task',
        ongoingEnabled: false,
        ongoingInterval: 1,
        ongoingMessage: 'task가 n분째 진행중입니다',
        ongoingTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
        beforeEndEnabled: false,
        beforeEndTime: 1,
        beforeEndMessage: 'task 종료 r분 전입니다.',
        beforeEndTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
        endEnabled: false,
        endMessage: 'task 시간이 지났습니다.',
        endTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
        overTimeEnabled: false,
        overTimeInterval: 1,
        overTimeMessage: 'name님, task가 m분 지났어요.',
        overTimeTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED]
      };
      setLocalNaggingSettings({
        ...defaultSettings,
        ...(userData.naggingSettings || {})
      });
      setIsNaggingDirty(false);
    }
  }, [settingsSubView.type, userData.naggingSettings]);

  useEffect(() => {
    if (settingsSubView.type === 'sound') {
      const defaultSettings: SoundEffectSettings = {
        wakeUpCheckIn: { enabled: true, file: '/sounds/freesound_community-success-fanfare-trumpets-6185.mp3' },
        triggerRoutineStart: { enabled: true, file: '/sounds/driken5482-applause-cheer-236786.mp3' },
        individualRoutineComplete: { enabled: true, file: '/sounds/tithuh-level-up-523624.mp3' },
        routineGroupComplete: { enabled: true, file: '/sounds/dragon-studio-fireworks-02-419019.mp3' },
        allGroupsComplete: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' }
      };
      setLocalSoundSettings({
        ...defaultSettings,
        ...(userData.soundSettings || {})
      });
      setIsSoundSettingsDirty(false);
    }
  }, [settingsSubView.type, userData.soundSettings]);

  const handleSettingsClose = () => {
    if (settingsSubView.type === 'nagging' && isNaggingDirty) {
      setConfirmModal({
        isOpen: true,
        title: '변경 취소 확인',
        message: '변경 사항이 저장되지 않았습니다. 취소하시겠습니까?',
        confirmLabel: '취소하고 나가기',
        cancelLabel: '계속 수정하기',
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsNaggingDirty(false);
          setIsSettingsOpen(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (settingsSubView.type === 'sound' && isSoundSettingsDirty) {
      setConfirmModal({
        isOpen: true,
        title: '변경 취소 확인',
        message: '변경 사항이 저장되지 않았습니다. 취소하시겠습니까?',
        confirmLabel: '취소하고 나가기',
        cancelLabel: '계속 수정하기',
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsSoundSettingsDirty(false);
          setIsSettingsOpen(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (settingsSubView.type === 'detail' && isEditRoutineDirty) {
      setConfirmModal({
        isOpen: true,
        title: '변경 취소 확인',
        message: '변경 사항이 저장되지 않았습니다. 취소하시겠습니까?',
        confirmLabel: '취소하고 나가기',
        cancelLabel: '계속 수정하기',
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsEditRoutineDirty(false);
          setIsSettingsOpen(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setIsSettingsOpen(false);
  };

  const handleTabTransition = (targetTab: 'home' | 'stats' | 'execution' | 'settings' | 'add', extraAction?: () => void) => {
    voiceService.unlock();
    soundService.unlock();
    // [코멘트] 탭 전환 시 포커스 해제하여 아이폰 '흔들어서 실행취소'Prompt 방지 시도
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (activeTab === 'add' && targetTab !== 'add' && isAddRoutineDirty) {
      setConfirmModal({
        isOpen: true,
        title: '입력 취소 확인',
        message: '작성 중인 내용이 있습니다. 저장하지 않고 나가시겠습니까?',
        confirmLabel: '저장하지 않고 나가기',
        cancelLabel: '계속 작성하기',
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsAddRoutineDirty(false);
          setActiveTab(targetTab);
          if (extraAction) extraAction();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (activeTab === 'settings' && targetTab !== 'settings' && (isNaggingDirty || isEditRoutineDirty || isSoundSettingsDirty)) {
      setConfirmModal({
        isOpen: true,
        title: '변경 취소 확인',
        message: '변경 사항이 저장되지 않았습니다. 취소하시겠습니까?',
        confirmLabel: '취소하고 나가기',
        cancelLabel: '계속 수정하기',
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsNaggingDirty(false);
          setIsEditRoutineDirty(false);
          setIsSoundSettingsDirty(false);
          setActiveTab(targetTab);
          if (extraAction) extraAction();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setActiveTab(targetTab);
    if (extraAction) extraAction();
  };

  useEffect(() => {
    // [코멘트] 아이폰 '흔들어서 실행취소'Prompt를 방지하기 위해 전역 undo/redo 이벤트를 막음
    const handleUndoRedo = (e: any) => {
      const blockTypes = ['historyUndo', 'historyRedo', 'undo', 'redo'];
      if (e.type === 'beforeinput' && blockTypes.includes(e.inputType)) {
        e.preventDefault();
        e.stopPropagation();
      } else if (e.type === 'undo' || e.type === 'redo') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + Z 방지 (iOS 흔들어서 실행취소도 일부 차단 지원)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // window 및 document 모두에 대해 capture 단계에서 차단
    window.addEventListener('undo', handleUndoRedo, { capture: true });
    window.addEventListener('redo', handleUndoRedo, { capture: true });
    window.addEventListener('beforeinput', handleUndoRedo, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('undo', handleUndoRedo, { capture: true });
      window.removeEventListener('redo', handleUndoRedo, { capture: true });
      window.removeEventListener('beforeinput', handleUndoRedo, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // --- Effects ---
  useEffect(() => {
    const checkAlarmsOnStart = async () => {
      const anyAlarmEnabled = userData.isWakeUpAlarmEnabled || userData.routineChunks.some(c => c.isAlarmEnabled);
      if (anyAlarmEnabled && typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission !== 'granted') {
        setShowPermissionGuide(true);
      }
    };
    checkAlarmsOnStart();
  }, []);

  useEffect(() => {
    const handlePermissionChange = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === 'denied') {
        const anyWakeUpAlarmEnabled = userData.isWakeUpAlarmEnabled;
        const anyChunkAlarmEnabled = userData.routineChunks.some(c => c.isAlarmEnabled);
        
        if (anyWakeUpAlarmEnabled || anyChunkAlarmEnabled) {
          setUserData(prev => ({
            ...prev,
            isWakeUpAlarmEnabled: false,
            routineChunks: prev.routineChunks.map(c => ({ ...c, isAlarmEnabled: false }))
          }));
          setPermissionNotificationMessage('알림 권한이 거부되어 활성화된 모든 알람을 비활성화하였습니다. 알람을 받으시려면 기기 설정에서 알림 권한을 허용해주세요.');
        }
      }
    };

    window.addEventListener('focus', handlePermissionChange);
    return () => window.removeEventListener('focus', handlePermissionChange);
  }, [userData.isWakeUpAlarmEnabled, userData.routineChunks]);

  useEffect(() => {
    const applyDarkMode = () => {
      let isDarkActive = false;
      if (userData.darkModeFollowSystem) {
        isDarkActive = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDarkActive = userData.darkModeTheme === 'dark';
      }

      if (isDarkActive) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (userData.darkModeFollowSystem) {
        applyDarkMode();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [userData.darkModeTheme, userData.darkModeFollowSystem]);



  // [수정] 탭 변경이나 설정 하위 뷰 변경 시에만 최상단으로 스크롤 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab, settingsSubView.type]);

  // 완벽한 하루 및 오늘 하루 마감(오늘 끝) 애니메이션 체크
  useEffect(() => {
    if (activeTab === 'home') {
      const day = effectiveDate.getDay();
      
      // [1] 오늘이 실제 원래 수행요일인 루틴 그룹 목록들 구함 (오늘 수행요일이 아닌 그룹은 완료하지 않아도 무방)
      const normallyScheduledChunks = userData.routineChunks.filter(chunk => 
        chunk.scheduledDays.includes(day)
      );

      // [2] 오늘이 수행요일이든 아니든, 특정 루틴 그룹을 '오늘은 건너뛰기'(inactiveDates) 하면 완벽한 하루 대상에서 완전히 탈락합니다.
      const anySkipped = userData.routineChunks.some(chunk => 
        chunk.inactiveDates?.includes(todayStr)
      );

      // [3] 완벽한 하루가 발현되기 위한 최종 만족 조건 체크:
      // - 오늘 원래 수행하기로 약속된 루틴 그룹이 최소 1개 이상 존재해야 하며,
      // - 어떠한 루틴 그룹도 '오늘은 건너뛰기'를 하지 않은 깔끔한 활성 상태여야 하고,
      // - 오늘 수행요일로 예정된 모든 그룹들의 최종 상태가 '완벽' 또는 '완료'이어야 함.
      const isPerfect = 
        normallyScheduledChunks.length > 0 && 
        !anySkipped && 
        normallyScheduledChunks.every(chunk => {
          const status = getChunkStatus(chunk);
          return status === '완벽' || status === '완료';
        });

      // 하루에 한 번만 실행되도록 체크
      const isPerfectAlreadyShown = userData.lastPerfectDayAnimationDate === todayStr;
      const devTestModeForPerfectDay = false; // [임시 중단 용도] true = 무제한 테스트(홈화면 돌아올 때마다), false = 하루 한 번 실제 서비스 규칙 적용

      if (isPerfect && (devTestModeForPerfectDay ? !hasShownPerfectDayThisVisitRef.current : !isPerfectAlreadyShown) && !showPerfectDay) {
        const groups = normallyScheduledChunks.map(c => ({
          name: c.name,
          status: getChunkStatus(c)
        }));
        setPerfectDayGroups(groups);
        // [수정] 1.5초 여유를 둔 후에 애니메이션 작동
        const timer = setTimeout(() => {
          setShowPerfectDay(true);
          hasShownPerfectDayThisVisitRef.current = true;
          // 표시한 날짜를 기록
          setUserData(prev => ({
            ...prev,
            lastPerfectDayAnimationDate: todayStr
          }));
        }, 1500);
        return () => clearTimeout(timer);
      }

      // [4] 오늘 끝 애니메이션 체크
      // - 오늘 수행요일인 그룹이 최소한 1개 이상 있을 것 (normallyScheduledChunks.length > 0)
      // - '오늘 수행요일이 아닌 그룹'의 존부나 수행여부는 무관함
      // - 단 '오늘 수행요일이 아닌 그룹'을 활성화한 경우 이 그룹도 다른 그룹과 똑같이 완료하거나 다시 '오늘은 건너뛰기'를 눌러야 함
      // - 오늘 활성화된 모든 그룹(isChunkScheduledToday가 true인 그룹)을 '완료/완벽' 처리하고, 비활성 그룹들은 '건너뛰기' 상태일 때 발현함.
      // - '완벽한 하루' 조건이 참인 경우 완벽한 하루 애니메이션이 우선적으로 실행되므로 '오늘 끝'은 완벽한 하루가 아닐 때만 발현되도록 예외 처리함.
      const isScheduledTodayExist = normallyScheduledChunks.length > 0;
      
      const activeChunks = userData.routineChunks.filter(chunk => 
        isChunkScheduledToday(chunk, effectiveDate, userData)
      );
      
      const allActiveCompleted = activeChunks.every(chunk => {
        const status = getChunkStatus(chunk);
        return status === '완벽' || status === '완료';
      });

      const isTodayEnd = isScheduledTodayExist && allActiveCompleted && !isPerfect;

      // [하루에 한 번만 발현되기 위한 조건]
      // 단, 현재는 실시간 화면 테스트 편의를 위해 충족 시 홈화면으로 돌아올 때마다(devTestMode = true 일 때) 작동하게 특별 구성합니다.
      // 테스트 종료 시 devTestMode 용 변수를 false로 변경하면 완벽하게 하루에 딱 한 번만 발현됩니다!
      const isTodayEndAlreadyShown = userData.lastTodayEndAnimationDate === todayStr;
      const devTestModeForTodayEnd = false; // true = 무제한 테스트, false = 하루 한 번 실제 서비스 규칙 적용

      if (isTodayEnd && (devTestModeForTodayEnd || !isTodayEndAlreadyShown)) {
        const timer = setTimeout(() => {
          setShowTodayEnd(true);
          // 표시한 날짜를 기록 (하루 한 번 분기용 데이터 누적)
          setUserData(prev => ({
            ...prev,
            lastTodayEndAnimationDate: todayStr
          }));
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, todayStr, userData.lastPerfectDayAnimationDate, userData.lastTodayEndAnimationDate, userData.routineChunks, effectiveDate]);



  // Listen for Service Worker updates
  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const registration = (event as CustomEvent).detail;
      setSwUpdateRegistration(registration);
    };

    window.addEventListener('swUpdateAvailable', handleUpdate);
    return () => window.removeEventListener('swUpdateAvailable', handleUpdate);
  }, []);

  const handleUpdateApp = () => {
    if (swUpdateRegistration?.waiting) {
      swUpdateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: just reload if something went wrong but we know there's an update
      window.location.reload();
    }
  };



  // 잔소리 엔진 (Nagging Engine Hook)
  useNaggingEngine({
    globalActiveTask,
    currentTime,
    userData,
    activeTab,
    effectiveDate,
    autoCompleteAccumulatedTask,
    isAutoNextTransitioningRef,
    lastProcessedStartTimeRef,
  });

  const currentDayActivityLog = useMemo(() => {
    return activityLog[todayStr] || new Array(1440).fill(0);
  }, [activityLog, todayStr]);

  // --- Screen Wake Lock ---
  const wakeLockRef = useRef<any>(null);
  const wakeLockErrorShown = useRef<boolean>(false);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      if (wakeLockRef.current) return; // Already requested
      
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock acquired');
        
        // Re-acquire lock if it was released by visibility change (managed by browser)
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
          console.log('Wake Lock released by system');
        });
      } catch (err: any) {
        if (!wakeLockErrorShown.current) {
          if (err.name === 'NotAllowedError') {
            console.warn('Wake Lock is blocked by browser policy/permissions. This is common in some environments like iframes.');
          } else {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`);
          }
          wakeLockErrorShown.current = true;
        }
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock released');
      } catch (err: any) {
        console.error(`Wake Lock release error: ${err.name}, ${err.message}`);
      }
    }
  };

  // Monitor active task and manage wake lock
  useEffect(() => {
    const isAnyActive = userData.routineChunks.some(chunk => 
      chunk.tasks.some(task => task.status === TaskStatus.IN_PROGRESS && !task.isPaused && !task.completed)
    );

    if (isAnyActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => { releaseWakeLock(); };
  }, [userData.routineChunks]);

  // Handle visibility changes (re-acquire lock if returning from background while task is active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isAnyActive = userData.routineChunks.some(chunk => 
        chunk.tasks.some(task => task.status === TaskStatus.IN_PROGRESS && !task.isPaused && !task.completed)
      );
      
      if (document.visibilityState === 'visible' && isAnyActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userData.routineChunks]);


  const canCheckIn = useMemo(() => {
    if (userData.lastCheckInDate === todayStr) return false;
    
    const [targetH, targetM] = userData.targetWakeUpTime.split(':').map(Number);
    const targetDate = new Date(effectiveDate);
    targetDate.setHours(targetH, targetM, 0, 0);
    
    const diffMinutes = (currentTime.getTime() - targetDate.getTime()) / (1000 * 60);
    // [코멘트] phrases.json의 wakeUpCheckInSettings 설정을 따름
    const earlyLimit = phrases.wakeUpCheckInSettings?.earlyWindowMinutes || 30;
    const lateLimit = phrases.wakeUpCheckInSettings?.lateWindowMinutes || 10;
    
    return diffMinutes >= -earlyLimit && diffMinutes <= lateLimit;
  }, [userData.targetWakeUpTime, userData.lastCheckInDate, currentTime, todayStr, effectiveDate]);







  const handleChunkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setUserData((prev) => {
        const oldIndex = prev.routineChunks.findIndex((c) => c.id === active.id);
        const newIndex = prev.routineChunks.findIndex((c) => c.id === over.id);
        return {
          ...prev,
          routineChunks: arrayMove(prev.routineChunks, oldIndex, newIndex),
        };
      });
      // [가산 엔진 트리거]: 루틴 그룹 드래그앤드롭 재정렬 시 기회 횟수 가산 (+1점)
      addAvailableCheckCheckPoints(1, '루틴 그룹 재정렬');
    }
  };

  // --- Handlers ---
  const handleEnterExecution = (chunkId: string) => {
    // [코멘트] 실행화면 진입 시 포커스 해제하여 아이폰 '흔들어서 실행취소' 방지
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundService.unlock();
    voiceService.unlock();
    const chunk = userData.routineChunks.find(c => c.id === chunkId);
    if (!chunk) return;

    // Find best task to start
    const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
    const isFinished = (t: Task) => t.completed || t.status === TaskStatus.PERFECT || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.SKIP;
    
    // 0. Previously recorded active task
    let targetTask = chunk.activeTaskId ? scheduledTasks.find(t => t.id === chunk.activeTaskId && !isFinished(t)) : undefined;

    // 1. Currently active task (has startTime)
    if (!targetTask) {
      targetTask = scheduledTasks.find(t => t.startTime && !t.isPaused && !isFinished(t));
    }
    
    // If no active task, find the next one to start
    if (!targetTask) {
      // 2. Already IN_PROGRESS or Paused task
      targetTask = scheduledTasks.find(t => (t.status === TaskStatus.IN_PROGRESS || t.isPaused || (t.accumulatedDuration || 0) > 0) && !isFinished(t));
      
      if (!targetTask) {
        // 3. First unstarted task
        targetTask = scheduledTasks.find(t => !t.startTime && !isFinished(t));
      }
      
      if (!targetTask) {
        // 4. First later task
        targetTask = scheduledTasks.find(t => t.laterTimestamp && !isFinished(t));
      }
    }

    // Ensure the target task has IN_PROGRESS status and others don't (within this chunk)
    // Also record it as activeTaskId
    if (targetTask) {
      setUserData(prev => {
        const next = {
          ...prev,
          routineChunks: prev.routineChunks.map(c => {
            if (c.id === chunkId) {
              return {
                ...c,
                activeTaskId: targetTask!.id,
                tasks: c.tasks.map(task => {
                  if (task.id === targetTask!.id) return { ...task, status: TaskStatus.IN_PROGRESS };
                  if (task.status === TaskStatus.IN_PROGRESS) return { ...task, status: TaskStatus.NOT_STARTED };
                  return task;
                })
              };
            }
            return c;
          })
        };
        return syncHistory(next, todayStr);
      });
    }

    setSelectedChunkId(chunkId);
    setActiveTab('execution');

    // Handle auto-start if applicable
    const isAnyTaskEngaged = scheduledTasks.some(t => t.startTime || isFinished(t) || t.isPaused || (t.accumulatedDuration !== undefined && t.accumulatedDuration > 0));
    const isGroupUnstarted = !isAnyTaskEngaged;
    
    if (userData.firstRoutineAutoStart && isGroupUnstarted && targetTask && !targetTask.startTime && !targetTask.laterTimestamp && !targetTask.isPaused) {
      startTask(targetTask.id, true, true);
    }
  };

  const handleSelectNextSuggestedTask = (chunkId: string, taskId: string) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    soundService.unlock();
    voiceService.unlock();

    const chunk = userData.routineChunks.find(c => c.id === chunkId);
    if (!chunk) return;

    setUserData(prev => {
      const next = {
        ...prev,
        routineChunks: prev.routineChunks.map(c => {
          if (c.id === chunkId) {
            return {
              ...c,
              activeTaskId: taskId,
              tasks: c.tasks.map(task => {
                if (task.id === taskId) {
                  return { ...task, status: TaskStatus.IN_PROGRESS };
                }
                if (task.status === TaskStatus.IN_PROGRESS) {
                  return { ...task, status: TaskStatus.NOT_STARTED };
                }
                return task;
              })
            };
          }
          return c;
        })
      };
      return syncHistory(next, todayStr);
    });

    setSelectedChunkId(chunkId);
    setActiveTab('execution');
    setShowNextRoutineModal(false);

    const taskObj = chunk.tasks.find(t => t.id === taskId);
    const isTaskUnstarted = taskObj && !taskObj.startTime && !taskObj.isPaused;
    if (userData.firstRoutineAutoStart && isTaskUnstarted) {
      setTimeout(() => {
        startTask(taskId, true, true);
      }, 50);
    }
  };

  const handleCheckIn = () => {
    soundService.unlock();
    voiceService.unlock();
    if (!canCheckIn) return;

    let newStreak = userData.streak;
    const yesterday = new Date(effectiveDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    if (userData.lastCheckInDate === yesterdayStr) {
      newStreak += 1;
    } else if (userData.lastCheckInDate === null || userData.lastCheckInDate !== todayStr) {
      newStreak = 1;
    }

    const checkInTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;

    setUserData(prev => {
      // 기상 체크인 성공 시 캐릭터 누르기 기회 8회 가산!
      const currentAvailable = prev.availableCheckCheckCount !== undefined ? prev.availableCheckCheckCount : 5;
      
      const next = {
        ...prev,
        streak: newStreak,
        lastCheckInDate: todayStr,
        availableCheckCheckCount: currentAvailable + 8, // 8회 추가
        lastCheckInBonusCount: 0, // 오늘 체크인 가산 횟수 초기화 (체크인 시점 기준 29분 추적용)
        dailyCheckIn: {
          ...(prev.dailyCheckIn || {}),
          [todayStr]: checkInTimeStr
        },
        dailyTargetWakeUpTime: {
          ...(prev.dailyTargetWakeUpTime || {}),
          [todayStr]: prev.targetWakeUpTime
        },
        history: [...prev.history, { date: todayStr, time: checkInTimeStr }],
        routineChunks: prev.routineChunks
      };
      return syncHistory(next, todayStr);
    });

    // Show celebration
    setShowCheckInCelebration(true);
    const checkInConfig = userData.soundSettings?.wakeUpCheckIn;
    const checkInEnabled = checkInConfig ? checkInConfig.enabled : true;
    const checkInFile = checkInConfig?.file || '/freesound_community-success-fanfare-trumpets-6185.mp3';
    soundService.refresh(checkInFile);
    soundService.play(checkInFile, checkInEnabled);
    setTimeout(() => setShowCheckInCelebration(false), 3000);

    // Special confetti for check-in
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.3 },
          colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff'],
          shapes: ['star'],
          scalar: 1.2
        });
      } catch (e) {
        console.warn('Check-in confetti failed:', e);
      }
    }
  };

  const handleLateCheckIn = () => {
    soundService.unlock();
    voiceService.unlock();
    const checkInTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;
    setUserData(prev => {
      // 지각 체크인 성공 시 캐릭터 누르기 기회 3회 가산!
      const currentAvailable = prev.availableCheckCheckCount !== undefined ? prev.availableCheckCheckCount : 5;
      
      const next = {
        ...prev,
        lastCheckInDate: todayStr,
        availableCheckCheckCount: currentAvailable + 3, // 3회 추가
        lastCheckInBonusCount: 0, // 오늘 체크인 가산 횟수 초기화 (체크인 시점 기준 29분 추적용)
        dailyCheckIn: {
          ...(prev.dailyCheckIn || {}),
          [todayStr]: checkInTimeStr
        },
        dailyTargetWakeUpTime: {
          ...(prev.dailyTargetWakeUpTime || {}),
          [todayStr]: prev.targetWakeUpTime
        },
        history: [...prev.history, { date: todayStr, time: checkInTimeStr }],
        streak: 0,
        routineChunks: prev.routineChunks
      };
      return syncHistory(next, todayStr);
    });
  };







  const resetChunk = (chunkId: string) => {
    setConfirmModal({
      isOpen: true,
      title: '루틴 초기화',
      message: '모든 루틴의 실행여부와 타이머가 초기화됩니다.',
      onConfirm: () => {
        voiceService.stop();
        setUserData(prev => {
          const chunk = prev.routineChunks.find(c => c.id === chunkId);
          if (!chunk) return prev;

          // Calculate tasks completed TODAY
          let completedCount = 0;
          chunk.tasks.forEach(t => {
            if (t.completed) {
              completedCount += 1;
            }
          });

          const newChunks = prev.routineChunks.map(c => {
            if (c.id === chunkId) {
              return {
                ...c,
                activeTaskId: undefined,
                tasks: c.tasks.map(t => ({
                  ...t,
                  completed: false,
                  laterTimestamp: undefined,
                  startTime: undefined,
                  endTime: undefined,
                  isPaused: false,
                  accumulatedDuration: 0,
                  duration: undefined,
                  status: TaskStatus.NOT_STARTED,
                  checklist: t.checklist?.map(item => ({ ...item, completed: false }))
                }))
              };
            }
            return c;
          });

          // Clear review from history for this day
          const newGroupHistory = (prev.routineGroupHistory || []).map(h => 
            (h.groupId === chunkId && h.date === todayStr) 
              ? { ...h, closingNote: undefined, satisfaction: undefined, firstTaskStartTime: null, completedAt: null, selectedPhrase: undefined } 
              : h
          );

          // Recalculate completion percentage for today
          const totalCompleted = newChunks.reduce((acc, chunk) => 
            acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData) && (t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP)).length, 0
          );
          const totalScheduledTasksCount = newChunks.reduce((acc, chunk) => 
            acc + chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData)).length, 0
          );
          const completionPercentage = totalScheduledTasksCount > 0 
            ? Math.floor((totalCompleted / totalScheduledTasksCount) * 100) 
            : 0;

          // Clear task history for this group and day (set duration to null for unexecuted)
          const newTaskHistory = (prev.taskHistory || []).map(h => 
            (h.groupId === chunkId && h.date === todayStr) 
              ? { ...h, startTime: null, endTime: null, duration: null, status: '미실행' } 
              : h
          );
          
          const next = {
            ...prev,
            routineChunks: newChunks,
            routineGroupHistory: newGroupHistory,
            taskHistory: newTaskHistory,
            dailyCompletionRate: {
              ...prev.dailyCompletionRate,
              [todayStr]: completionPercentage
            }
          };
          return syncHistory(next, todayStr);
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };


  const handleAddChunkAndClean = (
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
    addChunk(name, purpose, tasks, scheduleType, scheduledDays, startTime, isAlarmEnabled, startType, situation);
    setIsAddRoutineDirty(false);
  };

  const handleDeleteChunkWithUI = (id: string, onSuccess?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title: '그룹 삭제',
      message: '이 그룹과 포함된 모든 루틴이 삭제됩니다. 계속하시겠습니까?',
      confirmLabel: '삭제',
      confirmColor: 'rose',
      onConfirm: () => {
        deleteChunk(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (onSuccess) onSuccess();
      }
    });
  };

  const toggleInactive = (chunkId: string) => {
    voiceService.unlock();
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => {
        if (chunk.id === chunkId) {
          const inactiveDates = chunk.inactiveDates || [];
          const forcedActiveDates = chunk.forcedActiveDates || [];
          const day = effectiveDate.getDay();
          const isScheduledNormally = chunk.scheduledDays.includes(day);

          if (isScheduledNormally) {
            // Normally active: toggle exclusion from inactiveDates
            if (inactiveDates.includes(todayStr)) {
              return { ...chunk, inactiveDates: inactiveDates.filter(d => d !== todayStr) };
            } else {
              return { ...chunk, inactiveDates: [...inactiveDates, todayStr], forcedActiveDates: forcedActiveDates.filter(d => d !== todayStr) };
            }
          } else {
            // Normally inactive: toggle inclusion in forcedActiveDates
            if (forcedActiveDates.includes(todayStr)) {
              return { ...chunk, forcedActiveDates: forcedActiveDates.filter(d => d !== todayStr) };
            } else {
              return { ...chunk, forcedActiveDates: [...forcedActiveDates, todayStr], inactiveDates: inactiveDates.filter(d => d !== todayStr) };
            }
          }
        }
        return chunk;
      })
    }));
  };

  const getChunkStatus = (chunk: RoutineChunk) => {
    if (chunk.inactiveDates?.includes(todayStr)) return '비활성';
    if (!isChunkScheduledToday(chunk, effectiveDate, userData)) return '비활성';
    const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
    if (scheduledTasks.length === 0) return '비활성';

    const allFinished = scheduledTasks.every(t => t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP);
    
    if (allFinished) {
      const hasPass = scheduledTasks.some(t => t.status === TaskStatus.SKIP);
      return hasPass ? '완료' : '완벽';
    }

    // Identify if any task is explicitly started/in-progress
    const anyStarted = scheduledTasks.some(t => 
      (t.startTime && !t.isPaused) || // Running
      (t.isPaused && (t.accumulatedDuration || 0) > 0) || // Paused (and has some time)
      (t.isPaused && !t.laterTimestamp && t.startTime === undefined && (t.accumulatedDuration || 0) >= 0 && scheduledTasks.indexOf(t) === 0 && chunk.tasks.some(task => task.id === t.id)) || // Special check for first task start
      (t.completed || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.PERFECT || t.status === TaskStatus.SKIP) || // Already have finished tasks
      calculateTaskDuration(t, currentTime) >= 1 // More than 1 second accumulated
    );

    // If accumulatedDuration is set, it means it was �� 트리거]: 루틴 그룹(청크) 정보 전체 업데이트 시 기회 횟수 가산 (+1점)
    if (anyStarted) return '실행중';
    return '미실행';
  };

  const getStatusBadge = (status: string) => {
    let color = 'bg-slate-100 text-slate-500';
    if (status === '비활성') {
      color = 'bg-slate-100 text-slate-400';
    } else if (status === '미실행') {
      color = 'bg-slate-100 text-slate-500';
    } else if (status === '완벽') {
      color = 'bg-emerald-100 text-emerald-600';
    } else if (status === '완료') {
      color = 'bg-indigo-100 text-indigo-600';
    } else if (status === '실행중') {
      color = 'bg-amber-100 text-amber-600';
    }
    return (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-[10px] ${color}`}>
        {status}
      </span>
    );
  };

  const updateFullChunk = (id: string, updatedData: Partial<RoutineChunk>) => {
    setUserData(prev => ({
      ...prev,
      routineChunks: prev.routineChunks.map(chunk => 
        chunk.id === id ? { ...chunk, ...updatedData } : chunk
      )
    }));
    // [가산 엔진 트리거]: 루틴 그룹(청크) 정보 전체 업데이트 시 기회 횟수 가산 (+1점)
    addAvailableCheckCheckPoints(1, '루틴 그룹 전체 저장');
    setIsEditRoutineDirty(false);
  };

  const updateChunkInfo = (id: string, newName: string, newPurpose: string) => {
    if (!newName.trim()) return;
    setConfirmModal({
      isOpen: true,
      title: '그룹 정보 변경',
      message: `그룹 정보를 변경하시겠습니까?`,
      onConfirm: () => {
        setUserData(prev => ({
          ...prev,
          routineChunks: prev.routineChunks.map(chunk => 
            chunk.id === id ? { ...chunk, name: newName, purpose: newPurpose } : chunk
          )
        }));
        // [가산 엔진 트리거]: 루틴 그룹 기본 정보 저장 시 기회 횟수 가산 (+1점)
        addAvailableCheckCheckPoints(1, '루틴 그룹 정보 변경');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };




  



  const challengeDays = useMemo(() => {
    const dates = Object.keys(userData.dailyCompletionRate || {}).filter(d => !!d);
    if (dates.length === 0) return 1;
    const earliestDate = dates.reduce((min, d) => d < min ? d : min, dates[0]);
    return getDaysBetween(earliestDate, todayStr);
  }, [userData.dailyCompletionRate, todayStr]);

  const successDays = useMemo(() => {
    const rates = Object.values(userData.dailyCompletionRate || {}) as number[];
    return rates.filter(rate => rate > 0).length;
  }, [userData.dailyCompletionRate]);

  const renderSettingsContent = (mode: 'main' | 'modal') => {
    return (
      <SettingsView
        userData={userData}
        setUserData={setUserData}
        currentTime={currentTime}
        settingsSubView={settingsSubView}
        setSettingsSubView={setSettingsSubView}
        handleSettingsClose={handleSettingsClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isNaggingDirty={isNaggingDirty}
        setIsNaggingDirty={setIsNaggingDirty}
        isEditRoutineDirty={isEditRoutineDirty}
        setIsEditRoutineDirty={setIsEditRoutineDirty}
        isSoundSettingsDirty={isSoundSettingsDirty}
        setIsSoundSettingsDirty={setIsSoundSettingsDirty}
        localNaggingSettings={localNaggingSettings}
        setLocalNaggingSettings={setLocalNaggingSettings}
        localSoundSettings={localSoundSettings}
        setLocalSoundSettings={setLocalSoundSettings}
        setConfirmModal={setConfirmModal}
        setDeletionMessage={setDeletionMessage}
        setBackupMessage={setBackupMessage}
        setNaggingSuccessMessage={setNaggingSuccessMessage}
        setSoundSuccessMessage={setSoundSuccessMessage}
        activityLog={activityLog}
        setActivityLog={setActivityLog}
        addChunk={handleAddChunkAndClean}
        updateFullChunk={updateFullChunk}
        updateChunkInfo={updateChunkInfo}
        deleteChunk={handleDeleteChunkWithUI}
        handleChunkDragEnd={handleChunkDragEnd}
        setIsSettingsOpen={setIsSettingsOpen}
        setShowPermissionGuide={setShowPermissionGuide}
        syncHistory={syncHistory}
        mode={mode}
      />
    );
  };

  const formattedDate = useMemo(() => {
    return effectiveDate.toLocaleDateString(
      i18n.language.startsWith('ja') ? 'ja-JP' : i18n.language.startsWith('en') ? 'en-US' : 'ko-KR', 
      { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
      }
    );
  }, [effectiveDate, i18n.language]);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-[#F7FEE7] dark:bg-slate-950 flex flex-col items-center justify-center font-sans p-6 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-black mt-2 text-indigo-900 dark:text-indigo-400">{t('common.loadingTitle')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            {t('common.loadingDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FEE7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20" spellCheck={false}>
      {/* Celebration Animation Overlay */}
      <AnimatePresence>
        {lastCompletedTaskName && (
          <motion.div
            key="celebration-overlay"
            initial={{ scale: 0.7, opacity: 0, filter: "blur(10px)" }}
            animate={{ 
              scale: [0.7, 1, 1.1, 8], 
              opacity: [0, 1, 1, 0],
              filter: ["blur(10px)", "blur(0px)", "blur(5px)", "blur(20px)"]
            }}
            transition={{ 
              duration: 2.5, 
              times: [0, 0.15, 0.75, 1],
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]"
          >
            <div className="relative">
              <motion.span 
                className="text-5xl md:text-8xl font-black text-indigo-600 drop-shadow-[0_0_40px_rgba(79,70,229,0.6)] text-center px-6 block"
                style={{ letterSpacing: '-0.05em' }}
              >
                {lastCompletedTaskName}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Celebration Overlay */}
      <AnimatePresence>
        {showCheckInCelebration && (
          <motion.div
            key="checkin-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999] bg-indigo-600/10 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [20, -10, 0]
              }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    scale: { duration: 2, repeat: Infinity },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute inset-0 bg-amber-400/30 blur-3xl rounded-full"
                />
                <Sun className="w-32 h-32 text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] relative z-10" />
              </div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-black text-amber-300 mt-8 drop-shadow-sm"
              >
              GOOD MORNING !
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold text-red-400 mt-2"
              >
                {t('common.checkInSuccess')}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 홈아이콘줄 (Sticky Header Box) */}
      <div className="sticky top-0 z-40 bg-[#F7FEE7]/80 dark:bg-slate-950/80 backdrop-blur-md pt-2.5 pb-0">
        <div className="max-w-2xl mx-auto px-4">
          <nav className="flex items-center gap-3">
            <button 
              onClick={() => {
                handleTabTransition('home', () => {
                  setSelectedChunkId(null);
                });
              }}
              className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] ${
                activeTab === 'home' && !selectedChunkId 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
              }`}
            >
              <Home className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                handleTabTransition('settings', () => {
                  setSettingsSubView({ type: 'main' });
                  setSelectedChunkId(null);
                  setIsSettingsOpen(false);
                });
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                handleTabTransition('add', () => {
                  setSelectedChunkId(null);
                  setIsSettingsOpen(false);
                });
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all ${
                activeTab === 'add'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                handleTabTransition('stats', () => {
                  setSelectedChunkId(null);
                  setStatsKey(prev => prev + 1);
                });
              }}
              className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] ${
                activeTab === 'stats' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* 음성안내아이콘 */}
            <button 
              onClick={() => {
                soundService.unlock();
                voiceService.unlock();
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
                setUserData(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }));
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all bg-white border shadow-sm hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 ${
                userData.isVoiceEnabled 
                  ? 'border-blue-400 text-blue-500 shadow-blue-50' 
                  : 'border-slate-100 text-slate-400'
              }`}
            >
              {userData.isVoiceEnabled ? <Volume2 className="w-5 h-5" strokeWidth={2.5} /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* 체크체크박스 (Check-Check Box): 클릭하여 성장시키는 아이콘 */}
            <motion.button 
              onClick={handleCheckCheckClick}
              whileTap={isCheckCheckAvailable ? "tap" : undefined}
              variants={{
                tap: { scale: 0.94 }
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`transition-all w-16 h-10 flex items-center px-1.5 rounded-[10px] border shadow-sm relative overflow-hidden always-light ${
                isCheckCheckAvailable 
                  ? 'bg-white border-indigo-200 cursor-pointer hover:border-indigo-400' 
                  : 'bg-white border-slate-100 cursor-default'
              }`}
            >
              <motion.div 
                variants={{
                  tap: { scaleX: 1.25, scaleY: 0.75 }
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="flex-shrink-0 flex items-center justify-center w-9 origin-bottom"
              >
                <CheckCheckIcon iconId={checkCheckIconId} size={32} />
              </motion.div>
              <div className="flex-grow flex flex-col items-center justify-center ml-0.5 relative">
                <span className="text-[10px] font-black text-slate-500 leading-none" title={t('character.pressCountTitle')}>
                  {(userData.availableCheckCheckCount !== undefined ? userData.availableCheckCheckCount : 5)}
                </span>
                {isCheckCheckAvailable && (
                  <div className="mt-1">
                    <span className="flex h-1.5 w-1.5">
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          </nav>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-[10px] pb-[100px] space-y-3">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-[10px]"
            >
              <HeaderBox 
                userData={userData}
                todayStr={todayStr}
                formattedDate={formattedDate}
                challengeDays={challengeDays}
                successDays={successDays}
                currentTime={currentTime}
                effectiveDate={effectiveDate}
                activityLog={currentDayActivityLog}
              />
              <HomeView 
                userData={userData}
                setUserData={setUserData}
                currentTime={currentTime}
                effectiveDate={effectiveDate}
                todayStr={todayStr}
                handleCheckIn={handleCheckIn}
                handleLateCheckIn={handleLateCheckIn}
                setSelectedChunkId={setSelectedChunkId}
                setActiveTab={setActiveTab}
                startTask={startTask}
                toggleInactive={toggleInactive}
                getChunkStatus={getChunkStatus}
                getStatusBadge={getStatusBadge}
                globalActiveTask={globalActiveTask}
                setConfirmModal={setConfirmModal}
                onEnterExecution={handleEnterExecution}
              />
            </motion.div>
          ) : activeTab === 'stats' ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <StatsView 
                key={statsKey}
                userData={userData} 
                currentTime={currentTime}
                effectiveDate={effectiveDate}
              />
            </motion.div>
          ) : activeTab === 'execution' ? (
            <motion.div
              key="execution"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <ExecutionView 
                userData={userData}
                setUserData={setUserData}
                selectedChunkId={selectedChunkId}
                setStatsKey={setStatsKey}
                setActiveTab={setActiveTab}
                currentTime={currentTime}
                effectiveDate={effectiveDate}
                todayStr={todayStr}
                toggleTask={toggleTask}
                togglePauseTask={togglePauseTask}
                laterTask={laterTask}
                skipTask={skipTask}
                startTask={startTask}
                onRestart={onRestart}
                resetChunk={resetChunk}
                setSettingsSubView={setSettingsSubView}
                setIsSettingsOpen={setIsSettingsOpen}
                setSelectedChunkId={setSelectedChunkId}
                handleCheckCheckClick={handleCheckCheckClick}
                isCheckCheckAvailable={isCheckCheckAvailable}
                setConfirmModal={setConfirmModal}
                setSelectedTaskForStats={setSelectedTaskForStats}
              />
            </motion.div>
          ) : activeTab === 'add' ? (
            <motion.div
              key="add"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
            <RoutineGroupFormView 
                addChunk={handleAddChunkAndClean}
                setActiveTab={setActiveTab}
                setSettingsSubView={setSettingsSubView}
                setIsSettingsOpen={setIsSettingsOpen}
                userData={userData}
                activeTab={activeTab}
                mode="add"
                onDirtyChange={(isDirty) => setIsAddRoutineDirty(isDirty)}
              />
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-0">
                {renderSettingsContent('main')}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Floating Active Task Popup */}
      {globalActiveTask && activeTab !== 'execution' && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => {
            voiceService.unlock();
            soundService.unlock();
            handleTabTransition('execution', () => {
              setSelectedChunkId(globalActiveTask.chunkId);
            });
          }}
          className="fixed bottom-8 left-4 right-4 bg-indigo-600 text-white p-4 rounded-[10px] shadow-2xl z-[60] flex items-center justify-between cursor-pointer border border-white/20 backdrop-blur-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              >
                <Timer className="w-6 h-6" />
              </motion.div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                {userData.routineChunks.find(c => c.id === globalActiveTask.chunkId)?.name}
              </span>
              <span className="text-sm font-black truncate max-w-[150px]">{globalActiveTask.task.text}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xl font-black tabular-nums">
              {(() => {
                const total = calculateTaskDuration(globalActiveTask.task, currentTime);
                const h = Math.floor(total / 3600);
                const m = Math.floor((total % 3600) / 60);
                const s = total % 60;
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              })()}
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </motion.div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSettingsClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1200] touch-none"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={`fixed bottom-0 left-0 right-0 bg-slate-50 rounded-t-[20px] p-6 z-[1201] shadow-2xl max-w-2xl mx-auto overflow-hidden flex flex-col ${
                settingsSubView.type === 'groupStats' ? 'h-[85vh]' : ''
              }`}
              style={{ maxHeight: '90vh' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 flex-shrink-0" />
              {settingsSubView.type === 'groupStats' && (
                <button
                  onClick={handleSettingsClose}
                  className="absolute top-4 right-4 p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-[1202]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {renderSettingsContent('modal')}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        showCancel={confirmModal.showCancel}
        validationValue={confirmModal.validationValue}
        validationPlaceholder={confirmModal.validationPlaceholder || (confirmModal.validationValue ? `${confirmModal.validationValue} 입력` : undefined)}
        confirmColor={confirmModal.confirmColor}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => {
          if (confirmModal.onCancel) {
            confirmModal.onCancel();
          } else {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
      />
      {/* Alarm Modal */}
      <AnimatePresence>
        {activeAlarmChunk && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] touch-none"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-6 z-[101] pointer-events-none"
            >
              <div className="bg-white w-full max-w-sm rounded-[10px] p-8 shadow-2xl pointer-events-auto text-center space-y-6 border border-indigo-100">
                <div className="relative mx-auto w-24 h-24">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="w-full h-full bg-indigo-50 rounded-full flex items-center justify-center"
                  >
                    <Clock className="w-12 h-12 text-indigo-600" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-indigo-400 rounded-full -z-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">{t('alarm.ringingTitle')}</h3>
                  <p className="text-slate-500 font-bold">
                    <span className="text-indigo-600">[{activeAlarmChunk.name}]</span> {t('alarm.ringingBodySuffix')}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      voiceService.unlock();
                      soundService.unlock();
                      
                      // 3-1, 3-2. 알람 대상 그룹에서 시작할 수 있는 최적의 태스크를 식별 (이미 진행 이력이 있다면 그것을 이어 시작하도록)
                      const targetTask = activeAlarmChunk.tasks.find(t => 
                        !t.completed && 
                        t.status !== TaskStatus.SKIP && 
                        t.status !== TaskStatus.COMPLETED && 
                        t.status !== TaskStatus.PERFECT &&
                        (t.startTime || t.isPaused || t.status === TaskStatus.IN_PROGRESS || (t.accumulatedDuration || 0) > 0)
                      ) || activeAlarmChunk.tasks.find(t => 
                        !t.completed && 
                        t.status !== TaskStatus.SKIP && 
                        t.status !== TaskStatus.COMPLETED && 
                        t.status !== TaskStatus.PERFECT
                      );

                      if (targetTask) {
                        // togglePauseTask를 forceStart = true 로 호출하여 해당 태스크를 시작함.
                        // 이 분기는 다른 그룹의 돌아가고 있던 타이머를 자동으로 일시정지시키고 시간을 보존하게 함.
                        togglePauseTask(targetTask.id, true);
                      }

                      setSelectedChunkId(activeAlarmChunk.id);
                      setActiveTab('execution');
                      setActiveAlarmChunk(null);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-[10px] font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" /> {t('alarm.startRoutine')}
                  </button>
                  <button 
                    onClick={() => setActiveAlarmChunk(null)}
                    className="w-full py-4 bg-slate-100 text-slate-500 rounded-[10px] font-black hover:bg-slate-200 transition-all"
                  >
                    {t('alarm.doLater')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PerfectDayAnimation 
        isOpen={showPerfectDay}
        onClose={() => setShowPerfectDay(false)}
        completedGroups={perfectDayGroups}
        isSoundEnabled={true}
        soundSettings={userData.soundSettings}
      />

      <TodayEndAnimation
        isOpen={showTodayEnd}
        onClose={() => setShowTodayEnd(false)}
        isSoundEnabled={true}
        soundSettings={userData.soundSettings}
      />

      {/* 다음 루틴 그   {/* Bottom Sheet Container */}
      <AnimatePresence>
        {showNextRoutineModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm touch-none"
              onClick={() => setShowNextRoutineModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[25px] overflow-hidden shadow-2xl z-10 p-6 text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
                <ArrowBigRightDash className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">{t('alarm.nextRoutineTitle')}</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                {t('alarm.nextRoutineDesc')}
              </p>

              <div className="w-full space-y-2.5 mb-5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
                {modalSuggestions.map((sug, idx) => {
                  const chunk = userData.routineChunks.find(c => c.id === sug.chunkId);
                  const task = chunk?.tasks.find(t => t.id === sug.taskId);
                  const isTrigger = chunk && chunk.tasks.length > 0 && chunk.tasks[0].id === sug.taskId;

                  // Render appropriate check performance/status circle
                  let iconElement;
                  if (task) {
                    if (task.status === TaskStatus.PERFECT) {
                      iconElement = (
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                          <Circle className="absolute inset-0 w-full h-full text-indigo-600" />
                          <CheckCheck className="absolute w-[60%] h-[60%] text-indigo-600" strokeWidth={3} />
                        </div>
                      );
                    } else if (task.completed || task.status === TaskStatus.COMPLETED) {
                      iconElement = (
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                          <Circle className="absolute inset-0 w-full h-full text-indigo-600" />
                          <Check className="w-3 h-3 text-indigo-600" strokeWidth={3} />
                        </div>
                      );
                    } else if (task.status === TaskStatus.SKIP) {
                      iconElement = <CircleMinus className="w-5 h-5 text-[#CC9900] shrink-0" />;
                    } else if (task.isPaused) {
                      iconElement = <PauseCircle className="w-5 h-5 text-amber-500 shrink-0" />;
                    } else if (task.startTime) {
                      iconElement = <CircleDot className="w-5 h-5 text-indigo-500 animate-pulse shrink-0" />;
                    } else {
                      // Normal not started
                      iconElement = <Circle className="w-5 h-5 text-slate-300 shrink-0" />;
                    }
                  } else {
                    iconElement = <Circle className="w-5 h-5 text-slate-300 shrink-0" />;
                  }

                  const taskIndex = chunk ? chunk.tasks.findIndex(t => t.id === sug.taskId) : -1;
                  const sequenceNumber = taskIndex !== -1 ? taskIndex + 1 : '';

                  return (
                    <button
                      key={`${sug.chunkId}-${sug.taskId}-${idx}`}
                      onClick={() => handleSelectNextSuggestedTask(sug.chunkId, sug.taskId)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-2xl text-left transition-all active:scale-[0.98] group flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 text-left overflow-hidden">
                        <div className="flex-shrink-0">
                          {iconElement}
                        </div>
                        <div className="flex flex-col gap-0.5 text-left overflow-hidden">
                          <span className="text-[10px] font-black tracking-wider text-indigo-500 uppercase truncate">
                            {sug.chunkName}
                          </span>
                          <span className="text-sm font-black text-slate-700 group-hover:text-indigo-800 transition-colors truncate">
                            {sequenceNumber}. {isTrigger && "⚡"}{sug.taskName}
                          </span>
                        </div>
                      </div>
                      <ArrowBigRightDash className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1 shrink-0" />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowNextRoutineModal(false)}
                className="w-full p-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl text-center text-sm font-black text-slate-500 transition-all active:scale-[0.98]"
              >
                {t('alarm.notNow')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 알림 권한 안내 모달 */}
      <AnimatePresence>
        {showPermissionGuide && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm touch-none"
              onClick={() => setShowPermissionGuide(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[25px] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-2">
                  <BellOff className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">{t('alarm.permissionRequiredTitle')}</h3>
                <div className="text-sm font-bold text-slate-500 leading-relaxed text-left bg-slate-50 p-4 rounded-2xl">
                  {t('alarm.permissionRequiredDesc')}<br/><br/>
                </div>
                <button 
                  onClick={() => setShowPermissionGuide(false)}
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-[15px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {t('alarm.permissionConfirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 알림 권한 거부 시 자동 비활성 안내 모달 */}
      <AnimatePresence>
        {permissionNotificationMessage && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm touch-none"
              onClick={() => setPermissionNotificationMessage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[25px] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-2">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">{t('alarm.disableNoticeTitle')}</h3>
                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                  {permissionNotificationMessage}
                </p>
                <button 
                  onClick={() => setPermissionNotificationMessage(null)}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-[15px] hover:bg-slate-800 transition-all shadow-lg"
                >
                  {t('alarm.ok')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deletion Message Toast */}
      <AnimatePresence>
        {backupMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 flex justify-center z-[10000] pointer-events-none"
          >
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-[20px] shadow-2xl flex flex-col items-center gap-1 border border-white/20 text-center backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 text-white animate-pulse" />
                <span className="text-sm font-black tracking-tight leading-tight">
                  {backupMessage}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        {(deletionMessage || naggingSuccessMessage || soundSuccessMessage) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 flex justify-center z-[9999] pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
              {deletionMessage ? (
                <Trash2 className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-sm font-black tracking-tight">{deletionMessage || naggingSuccessMessage || soundSuccessMessage}</span>
            </div>
          </motion.div>
        )}
        {groupAddedMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] pointer-events-none"
          >
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-[20px] shadow-2xl flex flex-col items-center gap-2 border border-white/10 min-w-[200px] border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-1">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-sm font-black tracking-tight text-center">
                {groupAddedMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 앱 업데이트 알림 */}
      <AnimatePresence>
        {swUpdateRegistration && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-[1001]"
          >
            <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-[20px] shadow-2xl border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <div>
                  <p className="text-sm font-black">{t('update.newVersion')}</p>
                  <p className="text-[10px] text-slate-400">{t('update.newVersionDesc')}</p>
                </div>
              </div>
              <button
                onClick={handleUpdateApp}
                className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-[12px] text-xs font-black transition-all active:scale-95 whitespace-nowrap"
              >
                {t('update.refreshNow')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하루 리셋 안내 모달 */}
      <AnimatePresence>
        {resetPauseModal.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm touch-none"
              onClick={() => setResetPauseModal({ isOpen: false, taskTitle: null })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[25px] overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-2">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">{t('reset.newDayTitle')}</h3>
                <div className="text-sm font-bold text-slate-500 leading-relaxed text-center bg-slate-50 p-4 rounded-2xl">
                  {t('reset.newDayDesc', { time: userData.resetTime, taskTitle: resetPauseModal.taskTitle })}
                </div>
                <button 
                  onClick={() => setResetPauseModal({ isOpen: false, taskTitle: null })}
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-[15px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {t('reset.ok')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 개별 루틴 상세 통계 하단 팝업 (Bottom Sheet) */}
      <AnimatePresence>
        {selectedTaskForStats && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskForStats(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] touch-none"
            />
            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-slate-50 rounded-t-[20px] p-6 shadow-2xl z-[1001] max-w-2xl mx-auto overflow-hidden flex flex-col"
            >
              {/* Drag Handle & Close Button */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 flex-shrink-0" />
              <button
                onClick={() => setSelectedTaskForStats(null)}
                className="absolute top-5 right-6 w-8 h-8 rounded-full bg-slate-250/80 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer z-50"
              >
                <X className="w-4 h-4" />
              </button>

              {/* StatsView Wrapper Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 overscroll-contain">
                <StatsView
                  userData={userData}
                  currentTime={currentTime}
                  initialSelectedTaskId={selectedTaskForStats}
                  isSingleTaskStatsOnly={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2초간 화면 상호작용 및 메뉴 클릭 방지 오버레이 */}
      {isWaitingForNextRoutineModal && (
        <div className="fixed inset-0 z-[100000] bg-transparent cursor-wait pointer-events-auto" />
      )}
    </div>
  );
}
