import React, { useMemo } from 'react';
import { RoutineChunk } from '../../types';
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
}

export const RoutineTitle: React.FC<RoutineTitleProps> = ({ 
  chunk, 
  status = '미실행',
  nameClassName = "text-slate-900",
  selectedPhrase,
  userName,
  startTime,
  endTime,
  isExecutionTitle = false
}) => {
  const processedMessage = useMemo(() => {
    const context = isExecutionTitle ? (phrases.settings as any).execution_settings : phrases.settings;
    
    const getStyledHtml = (key: string, value: string) => {
      const style = (context as any)[`${key}_style`];
      if (!style) return value;
      return `<span style="color: ${style.color || 'inherit'}; font-size: ${style.fontSize || 'inherit'}; font-weight: ${style.fontWeight || 'normal'}; font-family: '${style.fontFamily || 'inherit'}', sans-serif;">${value}</span>`;
    };

    const replaceWithJosa = (msg: string, tag: 'title' | 'purpose' | 'userName', value: string, html: string) => {
      const regex = new RegExp(`\\{\\{${tag}\\}\\}(이/가|을/를|은/는|이/가)`, 'g');
      return msg.replace(regex, (_, p1) => {
        return html + getJosa(value, p1 as any);
      });
    };

    const titleHtml = getStyledHtml('title', chunk.name);
    const purposeHtml = getStyledHtml('purpose', chunk.purpose || '목표');

    let baseMessage = selectedPhrase;
    if (!baseMessage && isExecutionTitle) {
      baseMessage = phrases.routine_messages.EXECUTION_TITLE;
    }

    if (baseMessage) {
      let message = baseMessage;
      
      message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
      message = replaceWithJosa(message, 'purpose', chunk.purpose || '목표', purposeHtml);
      message = replaceWithJosa(message, 'userName', userName || '나', getStyledHtml('userName', userName || '나'));

      message = message.replace(/\{\{title\}\}/g, titleHtml);
      message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
      
      // Handle remaining potential placeholders
      const totalSeconds = chunk.tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const durationText = totalMinutes > 0 ? `${totalMinutes}분` : `${totalSeconds}초`;
      
      message = message.replace(/\{\{duration\}\}/g, getStyledHtml('duration', durationText));
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
    const messages = phrases.routine_messages[key as keyof typeof phrases.routine_messages];
    
    // Use a stable random based on chunk id and today's date to avoid flickering
    const today = new Date().toISOString().split('T')[0];
    const seed = chunk.id + today + key;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % messages.length;
    let message = messages[index];

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
    const totalSeconds = chunk.tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const durationText = totalMinutes > 0 ? `${totalMinutes}분` : `${totalSeconds}초`;
    const durationHtml = getStyledHtml('duration', durationText);

    // --- [메시지 치환 로직] ---

    message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
    message = replaceWithJosa(message, 'purpose', chunk.purpose || '목표', purposeHtml);
    message = replaceWithJosa(message, 'userName', userName || '나', getStyledHtml('userName', userName || '나'));

    // Handle remaining placeholders
    message = message.replace(/\{\{title\}\}/g, titleHtml);
    message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
    message = message.replace(/\{\{days\}\}/g, daysHtml);
    message = message.replace(/\{\{start_info\}\}/g, startInfoHtml);
    message = message.replace(/\{\{duration\}\}/g, durationHtml);
    message = message.replace(/\{\{userName\}\}/g, getStyledHtml('userName', userName || '나'));
    message = message.replace(/\{\{startTime\}\}/g, getStyledHtml('startTime', startTime || '--:--'));
    message = message.replace(/\{\{endTime\}\}/g, getStyledHtml('endTime', endTime || '--:--'));

    return message;
  }, [chunk.id, chunk.name, chunk.purpose, chunk.scheduledDays, chunk.startType, chunk.startTime, chunk.situation, chunk.tasks, status, selectedPhrase, userName, startTime, endTime, isExecutionTitle]);

  const context = isExecutionTitle ? (phrases.settings as any).execution_settings : phrases.settings;
  const baseStyle = (context as any).base_style;

  return (
    <span 
      className="inline leading-relaxed"
      style={{ 
        fontFamily: baseStyle?.fontFamily ? `'${baseStyle.fontFamily}', sans-serif` : 'inherit',
        color: baseStyle?.color || 'inherit',
        fontSize: baseStyle?.fontSize || 'inherit'
      }}
      dangerouslySetInnerHTML={{ __html: processedMessage }}
    />
  );
};
