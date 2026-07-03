import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, AlertCircle, Clock, BrickWall, Hourglass } from 'lucide-react';
import { NaggingSettings, UserData, TaskType } from '../../types';
import i18n from '../../i18n';

export function getNaggingDefaultSettings(lang: string): NaggingSettings {
  const options = { lng: lang || 'ko' };
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

interface NaggingSettingsViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  localNaggingSettings: NaggingSettings | null;
  setLocalNaggingSettings: React.Dispatch<React.SetStateAction<NaggingSettings | null>>;
  isNaggingDirty: boolean;
  setIsNaggingDirty: (dirty: boolean) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
  setNaggingSuccessMessage: (msg: string | null) => void;
  setSettingsSubView: (subView: { type: 'main' | 'sound' | 'nagging' | 'detail'; chunkId?: string }) => void;
  registerCloseHandler?: (handler: any) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

export const NaggingSettingsView: React.FC<NaggingSettingsViewProps> = ({
  userData,
  setUserData,
  localNaggingSettings,
  setLocalNaggingSettings,
  isNaggingDirty,
  setIsNaggingDirty,
  setConfirmModal,
  setNaggingSuccessMessage,
  setSettingsSubView,
  registerCloseHandler,
  setIsSettingsOpen,
}) => {
  const { t, i18n } = useTranslation();
  const defaultSettings = getNaggingDefaultSettings(i18n.language || 'ko');

 {/* 저장 없이 빠져나가려고 할 때 안내 모달 */}
  const handleCloseConfirm = React.useCallback((): boolean => {
    if (isNaggingDirty) {
      setConfirmModal({
        isOpen: true,
        title: t('nagging.cancelTitle'),
        message: t('nagging.cancelMessage'),
        confirmLabel: t('nagging.cancelConfirm'),
        cancelLabel: t('nagging.cancelCancel'),
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsNaggingDirty(false);
          if (setIsSettingsOpen) {
            setIsSettingsOpen(false);
          }
          setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
      });
      return true; // Intercepted, do not close immediately
    }
    return false; // No changes, safe to close
  }, [isNaggingDirty, setConfirmModal, setIsSettingsOpen, t]);

  React.useEffect(() => {
    if (registerCloseHandler) {
      registerCloseHandler(handleCloseConfirm);
      return () => {
        registerCloseHandler(null);
      };
    }
  }, [registerCloseHandler, handleCloseConfirm]);

  const settings = localNaggingSettings || {
    ...defaultSettings,
    ...(userData.naggingSettings || {})
  };

  const updateNagging = (key: keyof NaggingSettings, value: any) => {
    setLocalNaggingSettings(prev => ({
      ...(prev || settings),
      [key]: value
    }));
    setIsNaggingDirty(true);
  };

  const handleNaggingBack = () => {
    if (isNaggingDirty) {
      setConfirmModal({
        isOpen: true,
        title: t('nagging.cancelTitle'),
        message: t('nagging.cancelMessage'),
        confirmLabel: t('nagging.cancelConfirm'),
        cancelLabel: t('nagging.cancelCancel'),
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsNaggingDirty(false);
          setSettingsSubView({ type: 'main' });
          setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
      });
    } else {
      setSettingsSubView({ type: 'main' });
    }
  };

  const handleNaggingSave = () => {
    if (localNaggingSettings) {
      const currentLang = i18n.language || 'ko';
      setUserData(prev => {
        const naggingSettingsByLang = prev.naggingSettingsByLang || {};
        return {
          ...prev,
          naggingSettings: localNaggingSettings,
          naggingSettingsByLang: {
            ...naggingSettingsByLang,
            [currentLang]: localNaggingSettings
          }
        };
      });
      setIsNaggingDirty(false);
      setNaggingSuccessMessage(t('nagging.saveSuccess'));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-[20px] flex-shrink-0">
        <button 
          onClick={handleNaggingBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shadow-sm cursor-pointer"
          title={t('nagging.backTitle')}
        >
          <Volume2 className="w-5 h-5 text-indigo-600" />
        </button>
        <h2 className="text-lg font-black text-slate-800">{t('nagging.title')}</h2>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow pb-4">
        {/* 공통 변수 안내 */}
        <div className="p-4 bg-indigo-50 rounded-2xl space-y-3 border border-indigo-100">
          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-indigo-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-indigo-600" /> {t('nagging.varsTitle')}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-indigo-700">
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">name</span>: {t('nagging.varsName')}</div>
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">task</span>: {t('nagging.varsTask')}</div>
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">n</span>: {t('nagging.varsElapsed')}</div>
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">r</span>: {t('nagging.varsRemaining')}</div>
              <div className="bg-white/50 p-2 rounded-lg col-span-2"><span className="text-indigo-900">m</span>: {t('nagging.varsOvertime')}</div>
            </div>
          </div>

          {i18n.language?.startsWith('en') && (
            <div className="space-y-1 pt-2 border-t border-indigo-200/50">
              <h4 className="text-[11px] font-black text-amber-700 flex items-center gap-1.5">
                ⚠️ {t('nagging.varsWarningTitle')}
              </h4>
              <div className="text-[10px] font-bold text-amber-700/90 leading-relaxed bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 shadow-sm">
                {t('nagging.varsWarningDesc')}
              </div>
            </div>
          )}

          {(i18n.language?.startsWith('ko') || (!i18n.language?.startsWith('ja') && !i18n.language?.startsWith('en'))) && (
            <div className="space-y-1.5 pt-1 border-t border-indigo-200/50">
              <h3 className="text-sm font-black text-indigo-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-indigo-600" /> {t('nagging.josaCorrectionTitle')}
              </h3>
              <div className="text-[10px] font-bold text-indigo-600/80 leading-relaxed">
                {t('nagging.josaCorrectionDesc')}
                <p className="text-[10px] font-bold text-indigo-600/80 leading-relaxed">{t('nagging.josaSupported')}</p>
              </div>
            </div>
          )}
        </div>

        {/* 3-1. 루틴 시작시 알림 */}
        <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-base font-black text-slate-800">{t('nagging.startTitle')}</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">{t('nagging.startDesc')}</p>
            </div>
            <button 
              onClick={() => updateNagging('startEnabled', !settings.startEnabled)}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.startEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.startEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {settings.startEnabled && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex flex-col gap-1 pr-4">
                  <h3 className="text-base font-black text-slate-800">{t('nagging.restartTitle')}</h3>
                  <p className="text-[11px] font-bold text-slate-400 leading-tight">{t('nagging.restartDesc')}</p>
                </div>
                <button 
                  onClick={() => updateNagging('restartEnabled', !settings.restartEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.restartEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.restartEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.textSetting')}</label>
                <input 
                  type="text"
                  value={settings.startMessage}
                  onChange={(e) => updateNagging('startMessage', e.target.value)}
                  placeholder={t('nagging.textPlaceholder')}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3-1-2. 루틴 진행 중 알림 */}
        <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-base font-black text-slate-800">{t('nagging.ongoingTitle')}</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">{t('nagging.ongoingDesc')}</p>
            </div>
            <button 
              onClick={() => updateNagging('ongoingEnabled', !settings.ongoingEnabled)}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.ongoingEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.ongoingEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {settings.ongoingEnabled && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.targetTypes')}</label>
                <div className="flex gap-2">
                  {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                    const allTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
                    const isSelected = (settings.ongoingTargetTypes || allTypes).includes(type);
                    const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          const current = settings.ongoingTargetTypes || allTypes;
                          const next = isSelected 
                            ? current.filter(t => t !== type)
                            : [...current, type];
                          updateNagging('ongoingTargetTypes', next);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {type === TaskType.TIME_INDEPENDENT ? t('taskType.TIME_INDEPENDENT') : 
                         type === TaskType.TIME_LIMITED ? t('taskType.TIME_LIMITED') : t('taskType.TIME_ACCUMULATED')}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.intervalSetting')}</label>
                <div className="flex items-center gap-2">
                  <input 
                     type="number"
                    min="1"
                    max="60"
                    value={settings.ongoingInterval || ''}
                    onChange={(e) => updateNagging('ongoingInterval', e.target.value === '' ? '' : parseInt(e.target.value))}
                    onBlur={() => {
                      if (!settings.ongoingInterval || (typeof settings.ongoingInterval === 'number' && settings.ongoingInterval < 1)) {
                        updateNagging('ongoingInterval', 1);
                      }
                    }}
                    className="w-16 text-center text-sm font-black p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-black text-slate-400">{t('nagging.everyMinutes')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.textSetting')}</label>
                <input 
                  type="text"
                  value={settings.ongoingMessage}
                  onChange={(e) => updateNagging('ongoingMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3-2. 루틴 종료 전 알림 */}
        <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-base font-black text-slate-800">{t('nagging.beforeEndTitle')}</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">{t('nagging.beforeEndDesc')}</p>
            </div>
            <button 
              onClick={() => updateNagging('beforeEndEnabled', !settings.beforeEndEnabled)}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.beforeEndEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.beforeEndEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {settings.beforeEndEnabled && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.targetTypes')}</label>
                <div className="flex gap-2">
                  {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                    const allTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
                    const isSelected = (settings.beforeEndTargetTypes || allTypes).includes(type);
                    const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          const current = settings.beforeEndTargetTypes || allTypes;
                          const next = isSelected 
                            ? current.filter(t => t !== type)
                            : [...current, type];
                          updateNagging('beforeEndTargetTypes', next);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {type === TaskType.TIME_INDEPENDENT ? t('taskType.TIME_INDEPENDENT') : 
                         type === TaskType.TIME_LIMITED ? t('taskType.TIME_LIMITED') : t('taskType.TIME_ACCUMULATED')}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.beforeEndTiming')}</label>
                <select 
                  value={settings.beforeEndTime}
                  onChange={(e) => updateNagging('beforeEndTime', parseInt(e.target.value))}
                  className="w-32 text-sm font-black p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(m => (
                    <option key={m} value={m}>{m}{t('nagging.minutesBefore')}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.textSetting')}</label>
                <input 
                  type="text"
                  value={settings.beforeEndMessage}
                  onChange={(e) => updateNagging('beforeEndMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3-3. 루틴 종료 알림 */}
        <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-base font-black text-slate-800">{t('nagging.endTitle')}</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">{t('nagging.endDesc')}</p>
            </div>
            <button 
              onClick={() => updateNagging('endEnabled', !settings.endEnabled)}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.endEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.endEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {settings.endEnabled && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.targetTypes')}</label>
                <div className="flex gap-2">
                  {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                    const allTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
                    const isSelected = (settings.endTargetTypes || allTypes).includes(type);
                    const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          const current = settings.endTargetTypes || allTypes;
                          const next = isSelected 
                            ? current.filter(t => t !== type)
                            : [...current, type];
                          updateNagging('endTargetTypes', next);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {type === TaskType.TIME_INDEPENDENT ? t('taskType.TIME_INDEPENDENT') : 
                         type === TaskType.TIME_LIMITED ? t('taskType.TIME_LIMITED') : t('taskType.TIME_ACCUMULATED')}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.textSetting')}</label>
                <input 
                  type="text"
                  value={settings.endMessage}
                  onChange={(e) => updateNagging('endMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3-4. 루틴 종료 후 알림 */}
        <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-base font-black text-slate-800">{t('nagging.overtimeTitle')}</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">{t('nagging.overtimeDesc')}</p>
            </div>
            <button 
              onClick={() => updateNagging('overTimeEnabled', !settings.overTimeEnabled)}
              className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.overTimeEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.overTimeEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {settings.overTimeEnabled && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.targetTypes')}</label>
                <div className="flex gap-2">
                  {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                    const allTypes = [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED];
                    const isSelected = (settings.overTimeTargetTypes || allTypes).includes(type);
                    const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          const current = settings.overTimeTargetTypes || allTypes;
                          const next = isSelected 
                            ? current.filter(t => t !== type)
                            : [...current, type];
                          updateNagging('overTimeTargetTypes', next);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {type === TaskType.TIME_INDEPENDENT ? t('taskType.TIME_INDEPENDENT') : 
                         type === TaskType.TIME_LIMITED ? t('taskType.TIME_LIMITED') : t('taskType.TIME_ACCUMULATED')}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.intervalSetting')}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    value={settings.overTimeInterval || ''}
                    onChange={(e) => updateNagging('overTimeInterval', e.target.value === '' ? '' : parseInt(e.target.value))}
                    onBlur={() => {
                      if (!settings.overTimeInterval || (typeof settings.overTimeInterval === 'number' && settings.overTimeInterval < 1)) {
                        updateNagging('overTimeInterval', 1);
                      }
                    }}
                    className="w-16 text-center text-sm font-black p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-xs font-black text-slate-400">{t('nagging.everyMinutes')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">{t('nagging.textSetting')}</label>
                <input 
                  type="text"
                  value={settings.overTimeMessage}
                  onChange={(e) => updateNagging('overTimeMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4 bg-white flex-shrink-0">
        <button 
          onClick={handleNaggingBack}
          className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-[15px] hover:bg-slate-200 transition-all cursor-pointer text-sm"
        >
          {t('common.cancel')}
        </button>
        <button 
          onClick={handleNaggingSave}
          className="flex-[2] bg-indigo-600 text-white font-black py-3.5 rounded-[15px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer text-sm"
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
};
