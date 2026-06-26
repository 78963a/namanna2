import React from 'react';
import { UserData } from '../types';
import phrases from '../phrases.json';
import { soundService } from '../services/soundService';

export interface UseCheckCheckBoxReturn {
  checkCheckIconId: string;
  isCheckCheckAvailable: boolean;
  handleCheckCheckClick: () => void;
  addAvailableCheckCheckPoints: (points?: number, actionName?: string) => void;
}

/**
 * 체크체크박스(캐릭터 성장 및 누르기 기회 기밀 엔진)의 모든 순수 기능과 로직을 분리한 커스텀 훅입니다.
 */
export function useCheckCheckBox(
  userData: UserData,
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  todayStr: string
): UseCheckCheckBoxReturn {
  
  // 1. 캐릭터가 다음 단계로 진화하기 위해 필요한 누름 횟수 간격에 따른 아이콘 결정 로직
  const checkCheckIconId = (() => {
    // 오늘의 캐릭터 클릭 횟수를 구합니다.
    const totalCount = (userData.dailyCheckCheckCounts?.[todayStr]) || 0;
    const stages = phrases.checkCheckSettings.evolutionStages;
    
    // 캐릭터가 다음 단계로 진화하기 위해 필요한 누름 횟수 간격입니다. (현재 20회로 설정됨, 변경 가능)
    const clicksPerEvolution = 20;
    
    // 누름 횟수를 간격으로 나누어 현재 진화 단계의 인덱스를 계산합니다.
    const stageIndex = Math.floor(totalCount / clicksPerEvolution);
    
    // 단계 배열 인덱스를 벗어나지 않도록 하고, 최종 진화 단계를 구합니다.
    const currentStage = stages[Math.min(stageIndex, stages.length - 1)] || stages[0];
    
    return currentStage.iconId;
  })();

  // 2. 캐릭터를 누를 수 있는 기회가 0보다 클 때만 한정하여 누르기가 작동합니다.
  const isCheckCheckAvailable = (userData.availableCheckCheckCount !== undefined ? userData.availableCheckCheckCount : 5) > 0;

  // 3. 캐릭터 클릭 핸들러 (사운드, 햅틱 피드백, 카운트 차감 및 획득 로직 내장)
  const handleCheckCheckClick = () => {
    soundService.unlock();
    
    // 캐릭터를 누를 수 있을 때(잔여 기회 횟수가 1 이상일 때)만 작동을 허용합니다.
    if (isCheckCheckAvailable) {
      // 모바일 기기 햅틱 진동 피드백 ('두둑'하는 느낌의 짧은 연속 진동)
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([20, 30, 20]);
      }

      // 효과음 재생 (병아리 소리가 활성화되어 있는 경우만 재생)
      const isChickSoundEnabled = userData.soundSettings?.chickSound?.enabled !== false;
      if (isChickSoundEnabled) {
        soundService.play('public/sounds/nikin-short-chick-sound-171389.mp3');
      }
      
      setUserData(prev => {
        const currentCheckCount = (prev.dailyCheckCheckCounts?.[todayStr]) || 0;
        const currentAvailable = prev.availableCheckCheckCount !== undefined ? prev.availableCheckCheckCount : 5;
        
        return {
          ...prev,
          // 실시간으로 누를 수 있는 기회 횟수를 1 차감합니다 (0 미만 방지).
          availableCheckCheckCount: Math.max(0, currentAvailable - 1),
          // 누적 성장용 데일리 카운트를 증가시킵니다.
          dailyCheckCheckCounts: {
            ...prev.dailyCheckCheckCounts,
            [todayStr]: currentCheckCount + 1
          },
          lastCheckCheckTime: Date.now()
        };
      });
    }
  };

  // 4. 특정 행동에 따라 기회를 추가해주는 연산 엔진
  const addAvailableCheckCheckPoints = (points: number = 1, actionName: string = "") => {
    setUserData(prev => {
      const currentAvailable = prev.availableCheckCheckCount !== undefined ? prev.availableCheckCheckCount : 5;
      console.log(`[체크체크 가산 엔진] 행동: "${actionName}", 가산포인트: +${points}, 기존 잔여: ${currentAvailable}, 새로운 잔여: ${currentAvailable + points}`);
      return {
        ...prev,
        availableCheckCheckCount: currentAvailable + points
      };
    });
  };

  return {
    checkCheckIconId,
    isCheckCheckAvailable,
    handleCheckCheckClick,
    addAvailableCheckCheckPoints
  };
}
