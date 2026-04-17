import React, { useMemo } from 'react';
import { RoutineChunk } from '../../types';
import { getJosa } from '../../utils';
import phrases from '../../phrases.json';

interface RoutineTitleProps {
  chunk: RoutineChunk;
  status?: string;
  nameClassName?: string;
  selectedPhrase?: string;
}

export const RoutineTitle: React.FC<RoutineTitleProps> = ({ 
  chunk, 
  status = '미실행',
  nameClassName = "text-slate-900",
  selectedPhrase
}) => {
  const processedMessage = useMemo(() => {
    if (selectedPhrase) {
      const titleStyle = phrases.settings.title_style;
      const purposeStyle = phrases.settings.purpose_style;

      const titleHtml = `<span style="color: ${titleStyle.color}; font-size: ${titleStyle.fontSize}; font-weight: ${titleStyle.fontWeight}; font-family: '${titleStyle.fontFamily || 'inherit'}', sans-serif;">${chunk.name}</span>`;
      const purposeHtml = `<span style="color: ${purposeStyle.color}; font-size: ${purposeStyle.fontSize}; font-weight: ${purposeStyle.fontWeight}; font-family: '${purposeStyle.fontFamily || 'inherit'}', sans-serif;">${chunk.purpose || '목표'}</span>`;

      let message = selectedPhrase;
      message = message.replace(/\{\{title\}\}/g, titleHtml);
      message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
      // Even though ExecutionView already replaced placeholders, we do it again just in case or for future proofing if we store templates
      // Actually handleFinalSave stores the already processed phrase (with names, but maybe not styles).
      // Wait, if handleFinalSave stores "나는 아침 루틴을 완료한 멋진 사람이다", then we don't need to replace anything.
      return message;
    }

    const statusMap: Record<string, string> = {
      '비활성': 'INACTIVE',
      '미실행': 'NOT_STARTED',
      '실행중': 'IN_PROGRESS',
      '완료': 'COMPLETED',
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

    const titleStyle = phrases.settings.title_style;
    const purposeStyle = phrases.settings.purpose_style;

    const titleHtml = `<span style="color: ${titleStyle.color}; font-size: ${titleStyle.fontSize}; font-weight: ${titleStyle.fontWeight}; font-family: '${titleStyle.fontFamily || 'inherit'}', sans-serif;">${chunk.name}</span>`;
    const purposeHtml = `<span style="color: ${purposeStyle.color}; font-size: ${purposeStyle.fontSize}; font-weight: ${purposeStyle.fontWeight}; font-family: '${purposeStyle.fontFamily || 'inherit'}', sans-serif;">${chunk.purpose || '목표'}</span>`;

    // --- [사용자 정의 변수 추출] ---
    
    // 1. 요일 정보 (days)
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const daysText = chunk.scheduledDays.map(d => dayNames[d]).join(', ') + '요일';
    const daysHtml = `<span style="color: #64748b; font-weight: bold;">${daysText}</span>`;

    // 2. 시작 상황/시간 정보 (start_info)
    let startInfoText = '아무때나';
    if (chunk.startType === 'time' && chunk.startTime) {
      startInfoText = `${chunk.startTime}시`;
    } else if (chunk.startType === 'situation' && chunk.situation) {
      startInfoText = chunk.situation;
    }
    const startInfoHtml = `<span style="color: #6366f1; font-weight: bold;">${startInfoText}</span>`;

    // 3. 소요 시간 정보 (duration)
    const totalSeconds = chunk.tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const durationText = totalMinutes > 0 ? `${totalMinutes}분` : `${totalSeconds}초`;
    const durationHtml = `<span style="color: #10b981; font-weight: bold;">${durationText}</span>`;

    // --- [메시지 치환 로직] ---

    // Handle particles: {{title}}이/가, {{purpose}}을/를 etc.
    const replaceWithJosa = (msg: string, tag: 'title' | 'purpose', value: string, html: string) => {
      const regex = new RegExp(`\\{\\{${tag}\\}\\}(이/가|을/를|은/는)`, 'g');
      return msg.replace(regex, (_, p1) => {
        return html + getJosa(value, p1 as any);
      });
    };

    message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
    message = replaceWithJosa(message, 'purpose', chunk.purpose || '목표', purposeHtml);

    // Handle remaining placeholders
    message = message.replace(/\{\{title\}\}/g, titleHtml);
    message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
    message = message.replace(/\{\{days\}\}/g, daysHtml);
    message = message.replace(/\{\{start_info\}\}/g, startInfoHtml);
    message = message.replace(/\{\{duration\}\}/g, durationHtml);

    return message;
  }, [chunk.id, chunk.name, chunk.purpose, status]);

  const baseStyle = (phrases.settings as any).base_style;

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
