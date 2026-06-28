import i18n from '../i18n';
import { NaggingSettings, TaskType } from '../types';

export function getNaggingDefaultSettings(lang: string): NaggingSettings {
  const options = { lng: lang };
  return {
    startEnabled: false,
    restartEnabled: false,
    startMessage: i18n.t('nagging.defaultStartMessage', options) || 'task 시작합니다',
    ongoingEnabled: false,
    ongoingInterval: 1,
    ongoingMessage: i18n.t('nagging.defaultOngoingMessage', options) || 'task가 n분째 진행중입니다',
    ongoingTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    beforeEndEnabled: false,
    beforeEndTime: 1,
    beforeEndMessage: i18n.t('nagging.defaultBeforeEndMessage', options) || 'task 종료 r분 전입니다.',
    beforeEndTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    endEnabled: false,
    endMessage: i18n.t('nagging.defaultEndMessage', options) || 'task 시간이 지났습니다.',
    endTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    overTimeEnabled: false,
    overTimeInterval: 1,
    overTimeMessage: i18n.t('nagging.defaultOverTimeMessage', options) || 'name님, task가 m분 지났어요.',
    overTimeTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED]
  };
}
