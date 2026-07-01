import React, { useEffect, useMemo, useRef } from 'react';
import { Task, UserData, TaskType, TaskStatus } from '../types';
import { calculateTaskDuration, isTaskScheduledToday } from '../utils';
import { voiceService } from '../services/voiceService';
import { soundService } from '../services/soundService';

interface UseNaggingEngineParams {
  globalActiveTask: { task: Task; chunkId: string } | null;
  currentTime: Date;
  userData: UserData;
  activeTab: string;
  effectiveDate: Date;
  autoCompleteAccumulatedTask: (id: string) => void;
  isAutoNextTransitioningRef: React.MutableRefObject<boolean>;
  lastProcessedStartTimeRef: React.MutableRefObject<{ taskId: string; startTime: string } | null>;
  isVoiceMutedTemporarily: boolean;
}

export function useNaggingEngine({
  globalActiveTask,
  currentTime,
  userData,
  activeTab,
  effectiveDate,
  autoCompleteAccumulatedTask,
  isAutoNextTransitioningRef,
  lastProcessedStartTimeRef,
  isVoiceMutedTemporarily,
}: UseNaggingEngineParams) {
  const naggingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTriggerRunningRef = useRef<boolean>(false);

  // 루틴 변경 시 음성 안내 즉시 중단 (Nagging voice stop on routine change)
  useEffect(() => {
    return () => {
      if (naggingTimeoutRef.current) {
        clearTimeout(naggingTimeoutRef.current);
        naggingTimeoutRef.current = null;
      }
      if (isAutoNextTransitioningRef.current) {
        return;
      }
      voiceService.stop();
    };
  }, [globalActiveTask?.task?.id]);

  const isCurrentlyTriggerRoutineActiveAndRunning = useMemo(() => {
    if (!globalActiveTask || !globalActiveTask.task) return false;
    if (activeTab !== 'execution') return false;
    const activeTask = globalActiveTask.task;
    const chunk = userData.routineChunks.find(c => c.tasks.some(t => t.id === activeTask.id));
    if (!chunk) return false;
    const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
    const isFirstScheduled = scheduledTasks[0]?.id === activeTask.id;
    return isFirstScheduled && !activeTask.isPaused && !activeTask.completed && activeTask.status !== TaskStatus.COMPLETED && activeTask.status !== TaskStatus.PERFECT && activeTask.status !== TaskStatus.SKIP;
  }, [globalActiveTask, activeTab, userData.routineChunks, effectiveDate, userData]);

  useEffect(() => {
    if (prevTriggerRunningRef.current && !isCurrentlyTriggerRoutineActiveAndRunning) {
      const triggerConfig = userData.soundSettings?.triggerRoutineStart;
      const triggerFile = triggerConfig?.file || '/driken5482-applause-cheer-236786.mp3';
      soundService.stopFile(triggerFile);
    }
    prevTriggerRunningRef.current = isCurrentlyTriggerRoutineActiveAndRunning;
  }, [isCurrentlyTriggerRoutineActiveAndRunning, userData.soundSettings?.triggerRoutineStart]);

  // --- [잔소리 기능 (Nagging Function) 로직] ---
  // 사용자가 설정한 문구와 시점에 맞춰 음성 안내를 실행합니다.
  useEffect(() => {
    if (!globalActiveTask || !globalActiveTask.task || globalActiveTask.task.isPaused || !globalActiveTask.task.startTime) return;

    const activeTask = globalActiveTask.task;
    const elapsed = calculateTaskDuration(activeTask, currentTime);
    const target = (activeTask.targetDuration || 0) * 60;

    // [시간 축적 루틴 자동 넘김] 엔진 작동 조건
    if (userData.autoNextAccumulatedRoutine && 
        activeTask.taskType === TaskType.TIME_ACCUMULATED && 
        target > 0 && 
        (activeTask.accumulatedDuration || 0) < target && 
        elapsed >= target) {
      autoCompleteAccumulatedTask(activeTask.id);
      return;
    }
    
    // 1. 트리거 루틴(첫 루틴) 시작 시 효과음 재생
    if (elapsed === 0) {
      // 미실행 루틴 그룹인지 확인
      const chunk = userData.routineChunks.find(c => c.tasks.some(t => t.id === activeTask.id));
      if (chunk) {
        const scheduledTasks = chunk.tasks.filter(t => isTaskScheduledToday(t, chunk, effectiveDate, userData));
        const isFirstScheduled = scheduledTasks[0]?.id === activeTask.id;
        // 한 번도 실행된 적 없는 그룹인지 확인 (모든 오늘 루틴이 미완료이며 누적시간이 0)
        const isGroupBrandNew = scheduledTasks.every(t => !t.completed && (!t.accumulatedDuration || t.accumulatedDuration === 0));
        
        if (isFirstScheduled && isGroupBrandNew) {
          const triggerConfig = userData.soundSettings?.triggerRoutineStart;
          const triggerEnabled = triggerConfig ? triggerConfig.enabled : true;
          const triggerFile = triggerConfig?.file || '/driken5482-applause-cheer-236786.mp3';
          soundService.refresh(triggerFile);
          soundService.play(triggerFile, triggerEnabled);
        }
      }
    }

     // 잔소리(음성 안내)는 스피커 아이콘이 켜져 있을 때만(isVoiceMutedTemporarily === false) 재생됩니다.
     if (isVoiceMutedTemporarily) return;
 
     if (!userData.naggingSettings) return;
 
     const settings = userData.naggingSettings;
     const remaining = target - elapsed;
     
     const variables = {
      name: userData.userName || '나',
      task: activeTask.text,
      n: Math.floor(elapsed / 60),
      r: Math.floor(remaining / 60),
      m: Math.floor((elapsed - target) / 60)
    };

    // 2. 루틴 시작 알림 (0초 또는 재개 시점)
    if (settings.startEnabled) {
      const isNewSession = activeTask.startTime && (
        !lastProcessedStartTimeRef.current || 
        lastProcessedStartTimeRef.current.taskId !== activeTask.id || 
        lastProcessedStartTimeRef.current.startTime !== activeTask.startTime
      );

      if (isNewSession) {
        const isFreshStart = !activeTask.accumulatedDuration || activeTask.accumulatedDuration === 0;
        const shouldAnnounce = isFreshStart || settings.restartEnabled;

        if (shouldAnnounce) {
          if (naggingTimeoutRef.current) {
            clearTimeout(naggingTimeoutRef.current);
          }
          // 효과음이 끝날 때까지 기다렸다가 재생 (최대 3초)
          const trySpeak = (retry = 0) => {
            if (soundService.isPlaying && retry < 15) {
              naggingTimeoutRef.current = setTimeout(() => {
                naggingTimeoutRef.current = null;
                trySpeak(retry + 1);
              }, 200);
            } else {
              voiceService.speakNagging(`start-${activeTask.id}-${activeTask.startTime}`, settings.startMessage || 'task 시작합니다', variables);
              naggingTimeoutRef.current = null;
            }
          };
          trySpeak();
        }

        lastProcessedStartTimeRef.current = {
          taskId: activeTask.id,
          startTime: activeTask.startTime
        };
      }
    }

    // 3. 루틴 진행 중 알림 (정기 알림)
    const allTaskTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
    const ongoingTargetTypes = settings.ongoingTargetTypes || allTaskTypes;
    const isOngoingTarget = activeTask.taskType && ongoingTargetTypes.includes(activeTask.taskType as TaskType);
    if (settings.ongoingEnabled && isOngoingTarget && elapsed > 0 && elapsed < target) {
      const intervalSeconds = settings.ongoingInterval * 60;
      const isBeforeEndTriggered = settings.beforeEndEnabled && remaining === settings.beforeEndTime * 60 && target > settings.beforeEndTime * 60;
      
      if (elapsed % intervalSeconds === 0 && !isBeforeEndTriggered) {
        voiceService.speakNagging(`ongoing-${activeTask.id}-${elapsed}`, settings.ongoingMessage, variables);
      }
    }

    // 4. 루틴 종료 전 알림
    const beforeEndTargetTypes = settings.beforeEndTargetTypes || allTaskTypes;
    const isBeforeEndTarget = activeTask.taskType && beforeEndTargetTypes.includes(activeTask.taskType as TaskType);
    if (settings.beforeEndEnabled && isBeforeEndTarget && remaining === settings.beforeEndTime * 60 && target > settings.beforeEndTime * 60 && remaining > 0) {
      voiceService.speakNagging(`beforeEnd-${activeTask.id}-${elapsed}`, settings.beforeEndMessage, {
        ...variables,
        r: settings.beforeEndTime 
      });
    }

    // 5. 루틴 종료 알림
    const endTargetTypes = settings.endTargetTypes || allTaskTypes;
    const isEndTarget = activeTask.taskType && endTargetTypes.includes(activeTask.taskType as TaskType);
    if (settings.endEnabled && isEndTarget && elapsed === target && target > 0) {
      voiceService.speakNagging(`end-${activeTask.id}`, settings.endMessage, variables);
    }

    // 6. 루틴 종료 후 알림 (초과 시간 정기 안내)
    const overTimeTargetTypes = settings.overTimeTargetTypes || allTaskTypes;
    const isTargetType = activeTask.taskType && overTimeTargetTypes.includes(activeTask.taskType as TaskType);
    if (settings.overTimeEnabled && isTargetType && elapsed > target && target > 0) {
      const overtimeSeconds = elapsed - target;
      const intervalSeconds = settings.overTimeInterval * 60;
      if (overtimeSeconds > 0 && overtimeSeconds % intervalSeconds === 0) {
        voiceService.speakNagging(`overtime-${activeTask.id}-${elapsed}`, settings.overTimeMessage, {
          ...variables,
          m: Math.floor(overtimeSeconds / 60)
        });
      }
    }
  }, [
    globalActiveTask?.task?.id, 
    globalActiveTask?.task?.isPaused, 
    globalActiveTask?.task?.startTime, 
    globalActiveTask?.task ? calculateTaskDuration(globalActiveTask.task, currentTime) : 0, 
    isVoiceMutedTemporarily,
    userData.naggingSettings
  ]);
}
