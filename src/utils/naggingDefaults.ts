import { NaggingSettings, TaskType } from '../types';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import { ja } from '../locales/ja';

export function getNaggingDefaultSettings(lang: string): NaggingSettings {
  const normalizedLang = (lang || 'ko').toLowerCase();
  const baseLang = normalizedLang.startsWith('ja') ? 'ja' : normalizedLang.startsWith('en') ? 'en' : 'ko';
  const locale = baseLang === 'ja' ? ja : baseLang === 'en' ? en : ko;

  const naggingLocale = locale.nagging || ko.nagging;

  return {
    startEnabled: false,
    restartEnabled: false,
    startMessage: naggingLocale.defaultStartMessage || 'task 시작합니다',
    ongoingEnabled: false,
    ongoingInterval: 1,
    ongoingMessage: naggingLocale.defaultOngoingMessage || 'task가 n분째 진행중입니다',
    ongoingTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    beforeEndEnabled: false,
    beforeEndTime: 1,
    beforeEndMessage: naggingLocale.defaultBeforeEndMessage || 'task 종료 r분 전입니다.',
    beforeEndTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    endEnabled: false,
    endMessage: naggingLocale.defaultEndMessage || 'task 시간이 지났습니다.',
    endTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    overTimeEnabled: false,
    overTimeInterval: 1,
    overTimeMessage: naggingLocale.defaultOverTimeMessage || 'name님, task가 m분 지났어요.',
    overTimeTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED]
  };
}

export function healNaggingSettings(s: NaggingSettings, lang: string): NaggingSettings {
  if (!s) return s;
  const normalizedLang = (lang || 'ko').toLowerCase();
  const baseLang = normalizedLang.startsWith('ja') ? 'ja' : normalizedLang.startsWith('en') ? 'en' : 'ko';
  
  if (baseLang === 'ko') return s;

  const defaults = getNaggingDefaultSettings(baseLang);
  const koDefaults = getNaggingDefaultSettings('ko');

  const healed = { ...s };

  if (healed.startMessage === koDefaults.startMessage) healed.startMessage = defaults.startMessage;
  if (healed.ongoingMessage === koDefaults.ongoingMessage) healed.ongoingMessage = defaults.ongoingMessage;
  if (healed.beforeEndMessage === koDefaults.beforeEndMessage) healed.beforeEndMessage = defaults.beforeEndMessage;
  if (healed.endMessage === koDefaults.endMessage) healed.endMessage = defaults.endMessage;
  if (healed.overTimeMessage === koDefaults.overTimeMessage) healed.overTimeMessage = defaults.overTimeMessage;

  return healed;
}
