import React, { useMemo } from 'react';
import { RoutineChunk, UserData } from '../../types';
import { getJosa } from '../../utils';
import phrases from '../../phrases.json';

interface RoutineTitleProps {
  chunk: RoutineChunk;
  status?: string;
  nameClassName?: string;
  selectedPhrase?: string;
  userName?: string;
  startTime?: string | null;
  endTime?: string | null;
  isExecutionTitle?: boolean;
  userData?: UserData;
}

export const RoutineTitle: React.FC<RoutineTitleProps> = ({ 
  chunk, 
  status = '미실행',
  nameClassName = "text-slate-900",
  selectedPhrase,
  userName,
  startTime,
  endTime,
  isExecutionTitle = false,
  userData
}) => {
  const processedMessage = useMemo(() => {
    const context = isExecutionTitle ? (phrases.settings as any).execution_settings : phrases.settings;
    
    const getStyledHtml = (key: string, value: string) => {
      const style = (context as any)[`${key}_style`];
      if (!style) return value;
      return `<span style="color: ${style.color || 'inherit'}; font-size: ${style.fontSize || 'inherit'}; font-weight: ${style.fontWeight || 'normal'};">${value}</span>`;
    };

    const replaceWithJosa = (msg: string, tag: 'title' | 'purpose' | 'userName' | 'triggerTask', value: string, html: string) => {
      if (!msg) return "";
      // 1. Handle standard particles attached to placeholders
      const regex = new RegExp(`\\{\\{${tag}\\}\\}(이/가|을/를|은/는|으로/로|이죠/죠|이|가|을|를|은|는|으로|로|이죠|죠)`, 'g');
      let result = msg.replace(regex, (_, p1) => {
        return html + getJosa(value, p1 as any);
      });

      if (!result) return "";
      // 2. Handle specific particle tags following the placeholder
      const particleRegex = new RegExp(`\\{\\{${tag}\\}\\}\\{\\{particle:(이/가|을/를|은/는|으로/로|이죠/죠|이|가|을|를|은|는|으로|로|이죠|죠)\\}\\}(\\s|$)`, 'g');
      result = result.replace(particleRegex, (_, p1, trailing) => {
        return html + getJosa(value, p1 as any) + trailing;
      });

      return result;
    };

    const titleHtml = getStyledHtml('title', chunk.name);
    const purposeHtml = getStyledHtml('purpose', chunk.purpose || '목표');
    const triggerTaskName = chunk.tasks[0]?.text || '첫 번째 루틴';
    const triggerTaskHtml = getStyledHtml('triggerTask', triggerTaskName);

    let baseMessage = selectedPhrase;
    if (!baseMessage && isExecutionTitle) {
      baseMessage = phrases.routine_messages.EXECUTION_TITLE;
    }

    if (!baseMessage && status === '비활성' && userData) {
      // Differentiate between "Inactive due to schedule" and "Inactive due to user action"
      const day = new Date().getDay();
      const isScheduledTodayNaturally = chunk.scheduledDays.includes(day);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const isExplicitlyInactive = chunk.inactiveDates?.includes(todayStr);

      if (!isScheduledTodayNaturally) {
        // Condition: Today is a disabled day in schedule
        const offDayMessages = phrases.routine_messages.INACTIVE_OFF_DAY;
        const msgIdx = Math.abs(chunk.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % offDayMessages.length;
        baseMessage = offDayMessages[msgIdx];
      } else if (isExplicitlyInactive) {
        // Condition: Scheduled today, but user chose "Take a break today"
        const inactiveMessages = phrases.routine_messages.INACTIVE;
        const msgIdx = Math.abs(chunk.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % inactiveMessages.length;
        baseMessage = inactiveMessages[msgIdx];
      }
    }

    if (baseMessage) {
      let message = baseMessage;
      
      message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
      message = replaceWithJosa(message, 'purpose', chunk.purpose || '목표', purposeHtml);
      message = replaceWithJosa(message, 'userName', userName || '나', getStyledHtml('userName', userName || '나'));
      message = replaceWithJosa(message, 'triggerTask', triggerTaskName, triggerTaskHtml);

      message = message.replace(/\{\{title\}\}/g, titleHtml);
      message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
      message = message.replace(/\{\{triggerTask\}\}/g, triggerTaskHtml);
      
      // Handle remaining potential placeholders
      const totalSeconds = chunk.tasks.reduce((acc, t) => acc + (t.duration || t.accumulatedDuration || 0), 0);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const durationText = totalMinutes > 0 ? `${totalMinutes}분` : `${totalSeconds}초`;

      const totalTargetMinutes = chunk.tasks.reduce((acc, t) => acc + (t.targetDuration || 0), 0);
      const totalTargetDurationText = `${totalTargetMinutes}분`;
      
      message = message.replace(/\{\{duration\}\}/g, getStyledHtml('duration', durationText));
      message = message.replace(/\{\{totalTargetDuration\}\}/g, getStyledHtml('totalTargetDuration', totalTargetDurationText));
      message = message.replace(/\{\{userName\}\}/g, getStyledHtml('userName', userName || '나'));
      message = message.replace(/\{\{startTime\}\}/g, getStyledHtml('startTime', startTime || '--:--'));
      message = message.replace(/\{\{endTime\}\}/g, getStyledHtml('endTime', endTime || '--:--'));
      
      return message;
    }

    const statusMap: Record<string, string> = {
      '비활성': 'INACTIVE',
      '미실행': 'NOT_STARTED',
      '실행중': 'IN_PROGRESS',
      '미완료': 'IN_PROGRESS',
      '완료': 'COMPLETED',
      '전체완료': 'COMPLETED',
      '완벽': 'PERFECT'
    };

    const key = statusMap[status] || 'NOT_STARTED';
    const messages = phrases.routine_messages[key as keyof typeof phrases.routine_messages] as string[];
    if (!messages || messages.length === 0) return '';
    
    // Use a stable random based on chunk id and today's date to avoid flickering
    const today = new Date().toISOString().split('T')[0];
    const seed = chunk.id + today + key;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % messages.length;
    let message = messages[index] || '';
    if (!message) return '';

    // --- [사용자 정의 변수 추출] ---
    
    // 1. 요일 정보 (days)
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    const sortedDays = [...chunk.scheduledDays].sort((a, b) => {
      const orderA = a === 0 ? 6 : a - 1;
      const orderB = b === 0 ? 6 : b - 1;
      return orderA - orderB;
    });
    const daysText = sortedDays.map(d => {
      const idx = d === 0 ? 6 : d - 1;
      return dayNames[idx];
    }).join(', ') + '요일';
    const daysHtml = getStyledHtml('days', daysText);

    // 2. 시작 상황/시간 정보 (start_info)
    let startInfoText = '아무때나';
    if (chunk.startType === 'time' && chunk.startTime) {
      startInfoText = `${chunk.startTime}시`;
    } else if (chunk.startType === 'situation' && chunk.situation) {
      startInfoText = chunk.situation;
    }
    const startInfoHtml = getStyledHtml('start_info', startInfoText);

    // 3. 소요 시간 정보 (duration)
    const totalSeconds = chunk.tasks.reduce((acc, t) => acc + (t.duration || t.accumulatedDuration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const durationText = totalMinutes > 0 ? `${totalMinutes}분` : `${totalSeconds}초`;
    const durationHtml = getStyledHtml('duration', durationText);

    const totalTargetMinutes = chunk.tasks.reduce((acc, t) => acc + (t.targetDuration || 0), 0);
    const totalTargetDurationText = `${totalTargetMinutes}분`;
    const totalTargetDurationHtml = getStyledHtml('totalTargetDuration', totalTargetDurationText);

    // --- [메시지 치환 로직] ---
    message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
    message = replaceWithJosa(message, 'purpose', chunk.purpose || '목표', purposeHtml);
    message = replaceWithJosa(message, 'userName', userName || '나', getStyledHtml('userName', userName || '나'));
    message = replaceWithJosa(message, 'triggerTask', triggerTaskName, triggerTaskHtml);

    // Handle remaining placeholders
    message = message.replace(/\{\{title\}\}/g, titleHtml);
    message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
    message = message.replace(/\{\{triggerTask\}\}/g, triggerTaskHtml);
    message = message.replace(/\{\{days\}\}/g, daysHtml);
    message = message.replace(/\{\{start_info\}\}/g, startInfoHtml);
    message = message.replace(/\{\{duration\}\}/g, durationHtml);
    message = message.replace(/\{\{totalTargetDuration\}\}/g, totalTargetDurationHtml);
    message = message.replace(/\{\{userName\}\}/g, getStyledHtml('userName', userName || '나'));
    message = message.replace(/\{\{startTime\}\}/g, getStyledHtml('startTime', startTime || '--:--'));
    message = message.replace(/\{\{endTime\}\}/g, getStyledHtml('endTime', endTime || '--:--'));

    return message;
  }, [chunk.id, chunk.name, chunk.purpose, chunk.scheduledDays, chunk.startType, chunk.startTime, chunk.situation, chunk.tasks, status, selectedPhrase, userName, startTime, endTime, isExecutionTitle]);

  const context = isExecutionTitle ? (phrases.settings as any).execution_settings : phrases.settings;
  const baseStyle = (context as any).base_style;

  return (
    <span 
      className="leading-relaxed"
      style={{ 
        display: 'inline',
        color: baseStyle?.color || 'inherit',
        fontSize: baseStyle?.fontSize || 'inherit'
      }}
      dangerouslySetInnerHTML={{ __html: processedMessage }}
    />
  );
};
