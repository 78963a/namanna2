import React, { useState, useMemo } from 'react';
import { UserData } from '../types';
import { formatDate } from '../utils';
import { soundService } from '../services/soundService';
import { voiceService } from '../services/voiceService';
import phrases from '../phrases.json';
import confetti from 'canvas-confetti';

interface UseCheckInProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  currentTime: Date;
  todayStr: string;
  effectiveDate: Date;
  syncHistory: (data: UserData, today: string) => UserData;
}

export function useCheckIn({
  userData,
  setUserData,
  currentTime,
  todayStr,
  effectiveDate,
  syncHistory,
}: UseCheckInProps) {
  const [showCheckInCelebration, setShowCheckInCelebration] = useState(false);

  const canCheckIn = useMemo(() => {
    if (userData.lastCheckInDate === todayStr) return false;
    
    const [targetH, targetM] = userData.targetWakeUpTime.split(':').map(Number);
    const targetDate = new Date(effectiveDate);
    targetDate.setHours(targetH, targetM, 0, 0);
    
    const diffMinutes = (currentTime.getTime() - targetDate.getTime()) / (1000 * 60);
    const earlyLimit = phrases.wakeUpCheckInSettings?.earlyWindowMinutes || 30;
    const lateLimit = phrases.wakeUpCheckInSettings?.lateWindowMinutes || 10;
    
    return diffMinutes >= -earlyLimit && diffMinutes <= lateLimit;
  }, [userData.targetWakeUpTime, userData.lastCheckInDate, currentTime, todayStr, effectiveDate]);

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
      const currentAvailable = prev.availableCheckCheckCount !== undefined ? prev.availableCheckCheckCount : 5;
      
      const next = {
        ...prev,
        streak: newStreak,
        lastCheckInDate: todayStr,
        availableCheckCheckCount: currentAvailable + 8,
        lastCheckInBonusCount: 0,
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

    setShowCheckInCelebration(true);
    const checkInConfig = userData.soundSettings?.wakeUpCheckIn;
    const checkInEnabled = checkInConfig ? checkInConfig.enabled : true;
    const checkInFile = checkInConfig?.file || '/freesound_community-success-fanfare-trumpets-6185.mp3';
    soundService.refresh(checkInFile);
    soundService.play(checkInFile, checkInEnabled);
    setTimeout(() => setShowCheckInCelebration(false), 3000);

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
      const currentAvailable = prev.availableCheckCheckCount !== undefined ? prev.availableCheckCheckCount : 5;
      
      const next = {
        ...prev,
        lastCheckInDate: todayStr,
        availableCheckCheckCount: currentAvailable + 3,
        lastCheckInBonusCount: 0,
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

  return {
    canCheckIn,
    showCheckInCelebration,
    setShowCheckInCelebration,
    handleCheckIn,
    handleLateCheckIn,
  };
}
