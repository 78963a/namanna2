import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RoutineChunk, UserData } from '../../types';
import { getJosa, getEffectiveDate } from '../../utils';
import phrases from '../../phrases.json';
import { FONT_SETTINGS } from '../../App';

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
  todayStr?: string;
}

export const RoutineTitle: React.FC<RoutineTitleProps> = ({ 
  chunk, 
  status = '미실행',
  nameClassName: _nameClassName = "text-slate-900",
  selectedPhrase,
  userName,
  startTime,
  endTime,
  isExecutionTitle = false,
  userData,
  todayStr
}) => {
  const { i18n } = useTranslation();
  
  const langKey = useMemo(() => {
    const currentLang = (i18n.language || 'ko').split('-')[0];
    return ['ko', 'en', 'ja'].includes(currentLang) ? (currentLang as 'ko' | 'en' | 'ja') : 'ko';
  }, [i18n.language]);

  const processedMessage = useMemo(() => {
    const context = isExecutionTitle ? FONT_SETTINGS.execution_settings : FONT_SETTINGS.settings;
    
    const localizedMessages = phrases.routine_messages[langKey] || phrases.routine_messages.ko;

    const getStyledHtml = (key: string, value: string) => {
      const style = (context as any)[`${key}_style`];
      if (!style) return value;
      return `<span style="color: ${style.color || 'inherit'}; font-size: ${style.fontSize || 'inherit'}; font-weight: ${style.fontWeight || 'normal'};">${value}</span>`;
    };

    const replaceWithJosa = (msg: string, tag: 'title' | 'purpose' | 'userName' | 'triggerTask', value: string, html: string) => {
      if (!msg) return "";
      // 1. Handle standard particles attached to placeholders
      const regex = new RegExp(`\\{\\{${tag}\\}\\}(이/가|을/를|은/는|으로/로|이죠/죠|야/이야|이야/야|다/이다|이다/다|이|가|을|를|은|는|으로|로|이죠|죠|야|이야|다|이다)`, 'g');
      let result = msg.replace(regex, (_, p1) => {
        return html + getJosa(value, p1 as any);
      });

      if (!result) return "";
      // 2. Handle specific particle tags following the placeholder
      const particleRegex = new RegExp(`\\{\\{${tag}\\}\\}\\{\\{particle:(이/가|을/를|은/는|으로/로|이죠/죠|야/이야|이야/야|다/이다|이다/다|이|가|을|를|은|는|으로|로|이죠|죠|야|이야|다|이다)\\}\\}(\\s|$)`, 'g');
      result = result.replace(particleRegex, (_, p1, trailing) => {
        return html + getJosa(value, p1 as any) + trailing;
      });

      return result;
    };

    const defaultPurposeMap = {
      ko: '목표',
      en: 'Goal',
      ja: '目標'
    };
    const defaultTriggerTaskMap = {
      ko: '첫 번째 루틴',
      en: 'First routine',
      ja: '最初のルーティン'
    };
    const minutesTextMap = {
      ko: '분',
      en: 'm',
      ja: '分'
    };
    const secondsTextMap = {
      ko: '초',
      en: 's',
      ja: '秒'
    };
    const defaultUserNameMap = {
      ko: '나',
      en: 'Me',
      ja: '自分'
    };

    const titleHtml = getStyledHtml('title', chunk.name);
    const purposeHtml = getStyledHtml('purpose', chunk.purpose || defaultPurposeMap[langKey]);
    const triggerTaskName = chunk.tasks[0]?.text || defaultTriggerTaskMap[langKey];
    const triggerTaskHtml = getStyledHtml('triggerTask', triggerTaskName);

    const totalSeconds = chunk.tasks.reduce((acc, t) => acc + (t.duration || t.accumulatedDuration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const durationText = totalMinutes > 0 
      ? `${totalMinutes}${minutesTextMap[langKey]}` 
      : `${totalSeconds}${secondsTextMap[langKey]}`;
    const durationHtml = getStyledHtml('duration', durationText);

    const totalTargetMinutes = chunk.tasks.reduce((acc, t) => acc + (t.targetDuration || 0), 0);
    const totalTargetDurationText = `${totalTargetMinutes}${minutesTextMap[langKey]}`;
    const totalTargetDurationHtml = getStyledHtml('totalTargetDuration', totalTargetDurationText);

    let baseMessage = selectedPhrase;
    if (!baseMessage && isExecutionTitle) {
      baseMessage = localizedMessages.EXECUTION_TITLE;
    }

    if (!baseMessage && status === '비활성' && userData) {
      // Differentiate between "Inactive due to schedule" and "Inactive due to user action"
      const day = new Date().getDay();
      const isScheduledTodayNaturally = chunk.scheduledDays.includes(day);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const isExplicitlyInactive = chunk.inactiveDates?.includes(todayStr);

      if (!isScheduledTodayNaturally) {
        // Condition: Today is a disabled day in schedule
        const offDayMessages = localizedMessages.INACTIVE_OFF_DAY;
        const msgIdx = Math.abs(chunk.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % offDayMessages.length;
        baseMessage = offDayMessages[msgIdx];
      } else if (isExplicitlyInactive) {
        // Condition: Scheduled today, but user chose "Take a break today"
        const inactiveMessages = localizedMessages.INACTIVE;
        const msgIdx = Math.abs(chunk.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % inactiveMessages.length;
        baseMessage = inactiveMessages[msgIdx];
      }
    }

    const replaceHashtags = (msg: string) => {
      if (!msg) return "";
      const userNameHtml = getStyledHtml('userName', userName || defaultUserNameMap[langKey]);
      const startTimeHtml = getStyledHtml('startTime', startTime || '--:--');
      const endTimeHtml = getStyledHtml('endTime', endTime || '--:--');

      const hashtagMap: Record<string, string> = {
        '#이름': userNameHtml,
        '#name': userNameHtml,
        '#名前': userNameHtml,
        
        '#그룹': titleHtml,
        '#group': titleHtml,
        '#グループ': titleHtml,
        
        '#목적': purposeHtml,
        '#purpose': purposeHtml,
        '#目的': purposeHtml,
        
        '#소요시간': durationHtml,
        '#duration': durationHtml,
        '#所要時間': durationHtml,
        
        '#시작시간': startTimeHtml,
        '#starttime': startTimeHtml,
        '#開始時間': startTimeHtml,
        
        '#완료시간': endTimeHtml,
        '#endtime': endTimeHtml,
        '#完了時間': endTimeHtml,
      };

      const hashtagVarRegex = /(#(이름|그룹|목적|소요시간|시작시간|완료시간|name|group|purpose|duration|starttime|endtime|名前|グループ|目的|所要時間|開始時間|完了時間))(이\/가|을\/를|은\/는|으로\/로|이죠\/죠|야\/이야|이야\/야|다\/이다|이다\/다|이|가|을|를|은|는|으로|로|이죠|죠|야|이야|다|이다)?/g;
      
      return msg.replace(hashtagVarRegex, (fullMatch, hashtagVar, _varWord, particle) => {
        const cleanVar = hashtagVar;
        const valueHtml = hashtagMap[cleanVar];
        if (valueHtml === undefined) return fullMatch;
        
        if (particle) {
          let rawValue = '';
          if (['#이름', '#name', '#名前'].includes(cleanVar)) rawValue = userName || defaultUserNameMap[langKey];
          else if (['#그룹', '#group', '#グループ'].includes(cleanVar)) rawValue = chunk.name;
          else if (['#목적', '#purpose', '#目的'].includes(cleanVar)) rawValue = chunk.purpose || defaultPurposeMap[langKey];
          else if (['#소요시간', '#duration', '#所要時間'].includes(cleanVar)) rawValue = durationText;
          else if (['#시작시간', '#starttime', '#開始時間'].includes(cleanVar)) rawValue = startTime || '--:--';
          else if (['#완료시간', '#endtime', '#完了時間'].includes(cleanVar)) rawValue = endTime || '--:--';
          
          return valueHtml + getJosa(rawValue, particle as any);
        }
        return valueHtml;
      });
    };

    if (baseMessage) {
      let message = baseMessage;
      
      message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
      message = replaceWithJosa(message, 'purpose', chunk.purpose || defaultPurposeMap[langKey], purposeHtml);
      message = replaceWithJosa(message, 'userName', userName || defaultUserNameMap[langKey], getStyledHtml('userName', userName || defaultUserNameMap[langKey]));
      message = replaceWithJosa(message, 'triggerTask', triggerTaskName, triggerTaskHtml);

      message = message.replace(/\{\{title\}\}/g, titleHtml);
      message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
      message = message.replace(/\{\{triggerTask\}\}/g, triggerTaskHtml);
      
      message = message.replace(/\{\{duration\}\}/g, durationHtml);
      message = message.replace(/\{\{totalTargetDuration\}\}/g, totalTargetDurationHtml);
      message = message.replace(/\{\{userName\}\}/g, getStyledHtml('userName', userName || defaultUserNameMap[langKey]));
      message = message.replace(/\{\{startTime\}\}/g, getStyledHtml('startTime', startTime || '--:--'));
      message = message.replace(/\{\{endTime\}\}/g, getStyledHtml('endTime', endTime || '--:--'));
      
      message = replaceHashtags(message);
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
    const messages = localizedMessages[key as keyof typeof localizedMessages] as string[];
    if (!messages || messages.length === 0) return '';
    
    // and ensure the phrase stays the same for the entire logical day.
    const today = todayStr || (() => {
      const resetH = userData?.resetTime ? parseInt(userData.resetTime.split(':')[0]) : 0;
      return getEffectiveDate(new Date(), resetH);
    })();
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
    const dayNamesMap = {
      ko: ['월', '화', '수', '목', '금', '토', '일'],
      en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      ja: ['月', '火', '水', '木', '金', '土', '日']
    };
    const daysSuffixMap = {
      ko: '요일',
      en: '',
      ja: '曜日'
    };
    const dayNames = dayNamesMap[langKey];
    const daysSuffix = daysSuffixMap[langKey];

    const sortedDays = [...chunk.scheduledDays].sort((a, b) => {
      const orderA = a === 0 ? 6 : a - 1;
      const orderB = b === 0 ? 6 : b - 1;
      return orderA - orderB;
    });
    const daysText = sortedDays.map(d => {
      const idx = d === 0 ? 6 : d - 1;
      return dayNames[idx];
    }).join(', ') + daysSuffix;
    const daysHtml = getStyledHtml('days', daysText);

    // 2. 시작 상황/시간 정보 (start_info)
    const anytimeMap = {
      ko: '아무때나',
      en: 'Anytime',
      ja: 'いつでも'
    };
    let startInfoText = anytimeMap[langKey];
    if (chunk.startType === 'time' && chunk.startTime) {
      if (langKey === 'ko') {
        startInfoText = chunk.startTime.replace(/시/g, '');
      } else if (langKey === 'ja') {
        startInfoText = chunk.startTime.replace(/시/g, '時');
      } else {
        startInfoText = chunk.startTime.replace(/시/g, '');
      }
    } else if (chunk.startType === 'situation' && chunk.situation) {
      startInfoText = chunk.situation;
    }
    const startInfoHtml = getStyledHtml('start_info', startInfoText);

    // --- [메시지 치환 로직] ---
    message = replaceWithJosa(message, 'title', chunk.name, titleHtml);
    message = replaceWithJosa(message, 'purpose', chunk.purpose || defaultPurposeMap[langKey], purposeHtml);
    message = replaceWithJosa(message, 'userName', userName || defaultUserNameMap[langKey], getStyledHtml('userName', userName || defaultUserNameMap[langKey]));
    message = replaceWithJosa(message, 'triggerTask', triggerTaskName, triggerTaskHtml);

    // Handle remaining placeholders
    message = message.replace(/\{\{title\}\}/g, titleHtml);
    message = message.replace(/\{\{purpose\}\}/g, purposeHtml);
    message = message.replace(/\{\{triggerTask\}\}/g, triggerTaskHtml);
    message = message.replace(/\{\{days\}\}/g, daysHtml);
    message = message.replace(/\{\{start_info\}\}/g, startInfoHtml);
    message = message.replace(/\{\{duration\}\}/g, durationHtml);
    message = message.replace(/\{\{totalTargetDuration\}\}/g, totalTargetDurationHtml);
    message = message.replace(/\{\{userName\}\}/g, getStyledHtml('userName', userName || defaultUserNameMap[langKey]));
    message = message.replace(/\{\{startTime\}\}/g, getStyledHtml('startTime', startTime || '--:--'));
    message = message.replace(/\{\{endTime\}\}/g, getStyledHtml('endTime', endTime || '--:--'));

    message = replaceHashtags(message);
    return message;
  }, [chunk.id, chunk.name, chunk.purpose, chunk.scheduledDays, chunk.startType, chunk.startTime, chunk.situation, chunk.tasks, status, selectedPhrase, userName, startTime, endTime, isExecutionTitle, todayStr, userData?.resetTime, langKey]);

  const context = isExecutionTitle ? FONT_SETTINGS.execution_settings : FONT_SETTINGS.settings;
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
