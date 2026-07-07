import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, AlertCircle, Clock, BrickWall, Hourglass } from 'lucide-react';
import { NaggingSettings, UserData, TaskType } from '../../types';
import i18n from '../../i18n';
import { KoreanJosaGuide } from './KoreanJosaGuide';

export function getNaggingDefaultSettings(lang: string): NaggingSettings {
  const normalized = (lang || 'ko').toLowerCase();
  const langKey = normalized.startsWith('ko') ? 'ko' : normalized.startsWith('ja') ? 'ja' : 'en';
  const options = { lng: langKey };

  return {
    startEnabled: true,
    restartEnabled: true,
    startMessage: i18n.t('nagging.defaultStartMessage', options),
    ongoingEnabled: true,
    ongoingInterval: 1,
    ongoingMessage: i18n.t('nagging.defaultOngoingMessage', options),
    ongoingTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    beforeEndEnabled: true,
    beforeEndTime: 1,
    beforeEndMessage: i18n.t('nagging.defaultBeforeEndMessage', options),
    beforeEndTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    endEnabled: true,
    endMessage: i18n.t('nagging.defaultEndMessage', options),
    endTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    overTimeEnabled: true,
    overTimeInterval: 5,
    overTimeMessage: i18n.t('nagging.defaultOverTimeMessage', options),
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
  const currentLang = (i18n.language || 'ko').toLowerCase();
  const langKey = currentLang.startsWith('ko') ? 'ko' : currentLang.startsWith('ja') ? 'ja' : 'en';

  const naggingVars = {
    ko: [
      { tag: '#이름', label: t('nagging.varsName') },
      { tag: '#루틴', label: t('nagging.varsTask') },
      { tag: '#지난시간', label: t('nagging.varsElapsed') },
      { tag: '#남은시간', label: t('nagging.varsRemaining') },
      { tag: '#초과시간', label: t('nagging.varsOvertime') },
    ],
    ja: [
      { tag: '#名前', label: t('nagging.varsName') },
      { tag: '#ルーチン', label: t('nagging.varsTask') },
      { tag: '#経過時間', label: t('nagging.varsElapsed') },
      { tag: '#残り時間', label: t('nagging.varsRemaining') },
      { tag: '#超過時間', label: t('nagging.varsOvertime') },
    ],
    en: [
      { tag: '#name', label: t('nagging.varsName') },
      { tag: '#routine', label: t('nagging.varsTask') },
      { tag: '#elapsed', label: t('nagging.varsElapsed') },
      { tag: '#remaining', label: t('nagging.varsRemaining') },
      { tag: '#overtime', label: t('nagging.varsOvertime') },
    ]
  };

  const renderNaggingButtons = (fieldKey: keyof NaggingSettings, type?: 'ongoing' | 'beforeEnd' | 'overtime') => {
    if (langKey === 'ko') {
      return (
        <>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#루틴이/가')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">루틴명이/가</button>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#루틴을/를')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">루틴명을/를</button>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#루틴은/는')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">루틴명은/는</button>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#이름이/가')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">이름이/가</button>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#이름을/를')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">이름을/를</button>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#이름은/는')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">이름은/는</button>
          {(type === 'ongoing' || type === 'beforeEnd' || type === 'overtime') && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#지난시간')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">지난시간(분)</button>
          )}
          {(type === 'ongoing' || type === 'beforeEnd') && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#남은시간')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">남은시간(분)</button>
          )}
          {type === 'overtime' && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#초과시간')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">초과시간(분)</button>
          )}
        </>
      );
    } else if (langKey === 'ja') {
      return (
        <>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#ルーチン')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">ルーチン</button>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#名前')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">名前</button>
          {(type === 'ongoing' || type === 'beforeEnd' || type === 'overtime') && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#経過時間')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">経過時間</button>
          )}
          {(type === 'ongoing' || type === 'beforeEnd') && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#残り時間')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">残り時間</button>
          )}
          {type === 'overtime' && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#超過時間')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">超過時間</button>
          )}
        </>
      );
    } else {
      return (
        <>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#routine')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">Routine</button>
          <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#name')} className="text-[10px] px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-100 transition-colors cursor-pointer">Name</button>
          {(type === 'ongoing' || type === 'beforeEnd' || type === 'overtime') && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#elapsed')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">Elapsed</button>
          )}
          {(type === 'ongoing' || type === 'beforeEnd') && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#remaining')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">Remaining</button>
          )}
          {type === 'overtime' && (
            <button type="button" onClick={() => insertNaggingVariable(fieldKey, '#overtime')} className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg border border-emerald-100 transition-colors cursor-pointer">Overtime</button>
          )}
        </>
      );
    }
  };

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
      setUserData(prev => {
        const naggingSettingsByLang = prev.naggingSettingsByLang || {};
        return {
          ...prev,
          naggingSettings: localNaggingSettings,
          naggingSettingsByLang: {
            ...naggingSettingsByLang,
            [langKey]: localNaggingSettings
          }
        };
      });
      setIsNaggingDirty(false);
      setNaggingSuccessMessage(t('nagging.saveSuccess'));
    }
  };

  const insertNaggingVariable = (fieldKey: keyof NaggingSettings, variableText: string) => {
    const currentSettings = localNaggingSettings || settings;
    const inputEl = document.getElementById(`nagging-input-${fieldKey}`) as HTMLInputElement | null;
    const currentValue = (currentSettings[fieldKey] as string) || '';
    let newValue = '';
    
    if (inputEl) {
      const start = inputEl.selectionStart ?? currentValue.length;
      const end = inputEl.selectionEnd ?? currentValue.length;
      newValue = currentValue.substring(0, start) + variableText + currentValue.substring(end);
      
      updateNagging(fieldKey, newValue);
      
      setTimeout(() => {
        inputEl.focus();
        const newCursorPos = start + variableText.length;
        inputEl.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      newValue = currentValue + variableText;
      updateNagging(fieldKey, newValue);
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
              {(() => {
                const guideVars = naggingVars[langKey] || [];
                return guideVars.map((v, i) => (
                  <div key={i} className={`bg-white/50 p-2 rounded-lg ${v.tag === '#초과시간' || v.tag === '#超過時間' || v.tag === '#overtime' ? 'col-span-2' : ''}`}>
                    <span className="text-indigo-900">{v.tag}</span>: {v.label}
                  </div>
                ));
              })()}
            </div>
          </div>



          {i18n.language?.startsWith('ko') && <KoreanJosaGuide />}
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
                  id="nagging-input-startMessage"
                  value={settings.startMessage}
                  onChange={(e) => updateNagging('startMessage', e.target.value)}
                  placeholder={t('nagging.textPlaceholder')}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {renderNaggingButtons('startMessage')}
                </div>
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
                  id="nagging-input-ongoingMessage"
                  value={settings.ongoingMessage}
                  onChange={(e) => updateNagging('ongoingMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {renderNaggingButtons('ongoingMessage', 'ongoing')}
                </div>
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
                  id="nagging-input-beforeEndMessage"
                  value={settings.beforeEndMessage}
                  onChange={(e) => updateNagging('beforeEndMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {renderNaggingButtons('beforeEndMessage', 'beforeEnd')}
                </div>
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
                  id="nagging-input-endMessage"
                  value={settings.endMessage}
                  onChange={(e) => updateNagging('endMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {renderNaggingButtons('endMessage')}
                </div>
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
                  id="nagging-input-overTimeMessage"
                  value={settings.overTimeMessage}
                  onChange={(e) => updateNagging('overTimeMessage', e.target.value)}
                  className="w-full text-sm font-black p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {renderNaggingButtons('overTimeMessage', 'overtime')}
                </div>
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
