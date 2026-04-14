import React, { useMemo } from 'react';
import { RoutineChunk } from '../../types';
import { getJosa } from '../../utils';
import phrases from '../../../phrases.json';

interface RoutineTitleProps {
  chunk: RoutineChunk;
  status?: string;
  nameClassName?: string;
}

export const RoutineTitle: React.FC<RoutineTitleProps> = ({ 
  chunk, 
  status = '미실행',
  nameClassName = "text-slate-900"
}) => {
  const processedMessage = useMemo(() => {
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

    // Handle particles: {{title}}이/가, {{purpose}}을/를 etc.
    const replaceWithJosa = (msg: string, tag: 'title' | 'purpose', value: string, html: string) => {
      const regex = new RegExp(`\\{\\{${tag}\\}\\}(이/가|을/를|은/는)`, 'g');
      return msg.replace(regex, (_, p1) => {
        return html + getJosa(value, p1 as any);
      });
    };

    message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
    message = replaceWithJosa(message, 'purpose', chunk.purpose || '목표', purposeHtml);

    // Handle remaining placeholders without particles
    message = message.replace(/\{\{title\}\}/g, titleHtml);
    message = message.replace(/\{\{purpose\}\}/g, purposeHtml);

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
