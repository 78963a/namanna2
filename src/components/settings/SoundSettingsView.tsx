import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Volume2 } from 'lucide-react';
import { SoundEffectSettings, UserData } from '../../types';

interface SoundSettingsViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  localSoundSettings: SoundEffectSettings | null;
  setLocalSoundSettings: React.Dispatch<React.SetStateAction<SoundEffectSettings | null>>;
  isSoundSettingsDirty: boolean;
  setIsSoundSettingsDirty: (dirty: boolean) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
  setSoundSuccessMessage: (msg: string | null) => void;
  setSettingsSubView: (subView: { type: 'main' | 'sound' | 'nagging' | 'detail'; chunkId?: string }) => void;
  soundService: any;
}

export const SoundSettingsView: React.FC<SoundSettingsViewProps> = ({
  userData,
  setUserData,
  localSoundSettings,
  setLocalSoundSettings,
  isSoundSettingsDirty,
  setIsSoundSettingsDirty,
  setConfirmModal,
  setSoundSuccessMessage,
  setSettingsSubView,
  soundService,
}) => {
  const { t } = useTranslation();
  const defaultSettings: SoundEffectSettings = {
    wakeUpCheckIn: { enabled: true, file: '/sounds/freesound_community-success-fanfare-trumpets-6185.mp3' },
    triggerRoutineStart: { enabled: true, file: '/sounds/driken5482-applause-cheer-236786.mp3' },
    individualRoutineComplete: { enabled: true, file: '/sounds/tithuh-level-up-523624.mp3' },
    routineGroupComplete: { enabled: true, file: '/sounds/dragon-studio-fireworks-02-419019.mp3' },
    todayEnd: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
    allGroupsComplete: { enabled: true, file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
    chickSound: { enabled: true, file: 'public/sounds/nikin-short-chick-sound-171389.mp3' }
  };

  const settings = localSoundSettings || {
    ...defaultSettings,
    ...(userData.soundSettings || {})
  };

  const updateSound = (key: keyof SoundEffectSettings, field: 'enabled' | 'file', value: any) => {
    const item = settings[key] || { enabled: true, file: '' };
    const updatedItem = { ...item, [field]: value };
    setLocalSoundSettings(prev => ({
      ...(prev || settings),
      [key]: updatedItem
    }));
    setIsSoundSettingsDirty(true);
  };

  const handleSoundPlayTest = (filePath: string) => {
    soundService.stop();
    if (filePath) {
      soundService.refresh(filePath);
      soundService.play(filePath, true);
    }
  };

  const handleSoundBack = () => {
    if (isSoundSettingsDirty) {
      setConfirmModal({
        isOpen: true,
        title: t('sound.cancelTitle'),
        message: t('sound.cancelMessage'),
        confirmLabel: t('sound.cancelConfirm'),
        cancelLabel: t('sound.cancelCancel'),
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsSoundSettingsDirty(false);
          setSettingsSubView({ type: 'main' });
          setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
      });
    } else {
      setSettingsSubView({ type: 'main' });
    }
  };

  const handleSoundSave = () => {
    setUserData(prev => ({
      ...prev,
      soundSettings: settings
    }));
    setIsSoundSettingsDirty(false);
    setSoundSuccessMessage(t('sound.saveSuccess'));
  };

  const AVAILABLE_SOUNDS = [
    { name: t('sound.levelUp'), file: '/sounds/tithuh-level-up-523624.mp3' },
    { name: t('sound.trumpets'), file: '/sounds/freesound_community-success-fanfare-trumpets-6185.mp3' },
    { name: t('sound.levelWin'), file: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
    { name: t('sound.fireworks'), file: '/sounds/dragon-studio-fireworks-02-419019.mp3' },
    { name: t('sound.applause'), file: '/sounds/driken5482-applause-cheer-236786.mp3' },
    { name: t('sound.duck'), file: '/sounds/freesound_community-075176_duck-quack-40345.mp3' },
    { name: t('sound.dog'), file: '/sounds/dragon-studio-dog-bark-382732.mp3' },
    { name: t('sound.beep'), file: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }
  ];

  const soundItemsDetail: { key: keyof SoundEffectSettings; label: string; desc: string; defaultFile: string }[] = [
    { key: 'wakeUpCheckIn', label: t('sound.wakeUpCheckIn.label'), desc: t('sound.wakeUpCheckIn.desc'), defaultFile: '/sounds/freesound_community-success-fanfare-trumpets-6185.mp3' },
    { key: 'triggerRoutineStart', label: t('sound.triggerRoutineStart.label'), desc: t('sound.triggerRoutineStart.desc'), defaultFile: '/sounds/driken5482-applause-cheer-236786.mp3' },
    { key: 'individualRoutineComplete', label: t('sound.individualRoutineComplete.label'), desc: t('sound.individualRoutineComplete.desc'), defaultFile: '/sounds/tithuh-level-up-523624.mp3' },
    { key: 'routineGroupComplete', label: t('sound.routineGroupComplete.label'), desc: t('sound.routineGroupComplete.desc'), defaultFile: '/sounds/dragon-studio-fireworks-02-419019.mp3' },
    { key: 'todayEnd', label: t('sound.todayEnd.label'), desc: t('sound.todayEnd.desc'), defaultFile: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
    { key: 'allGroupsComplete', label: t('sound.allGroupsComplete.label'), desc: t('sound.allGroupsComplete.desc'), defaultFile: '/sounds/freesound_community-piglevelwin2mp3-14800.mp3' },
    { key: 'chickSound', label: t('sound.chickSound.label'), desc: t('sound.chickSound.desc'), defaultFile: 'public/sounds/nikin-short-chick-sound-171389.mp3' }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-[20px] flex-shrink-0">
        <button 
          onClick={handleSoundBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shadow-sm cursor-pointer"
          title={t('sound.backTitle')}
        >
          <Bell className="w-5 h-5 text-indigo-600" />
        </button>
        <h2 className="text-lg font-black text-slate-800">{t('sound.title')}</h2>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-2">
        {soundItemsDetail.map(({ key, label, desc, defaultFile }) => {
          const item = settings[key] || { enabled: true, file: defaultFile };
          const currentFile = item.file || defaultFile;

          return (
            <div key={key} className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm border border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 pr-4">
                  <h3 className="text-base font-black text-slate-800">{label}</h3>
                  <p className="text-[11px] font-bold text-slate-400 leading-tight">{desc}</p>
                </div>
                <button 
                  onClick={() => updateSound(key, 'enabled', !item.enabled)}
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${item.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {item.enabled && key !== 'chickSound' && (
                <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-500 ml-1">{t('sound.selectSound')}</label>
                    <div className="flex gap-2">
                      <select 
                        value={currentFile}
                        onChange={(e) => {
                          const newFile = e.target.value;
                          updateSound(key, 'file', newFile);
                          handleSoundPlayTest(newFile);
                        }}
                        className="flex-grow text-sm font-black p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer animate-in fade-in list-none select-none appearance-none"
                      >
                        {AVAILABLE_SOUNDS.map(sound => (
                          <option key={sound.file} value={sound.file}>
                            {sound.name}
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleSoundPlayTest(currentFile)}
                        className="bg-indigo-50 text-indigo-600 p-3 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                        title={t('sound.playTest')}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4 bg-white flex-shrink-0">
        <button 
          onClick={handleSoundBack}
          className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-[15px] hover:bg-slate-200 transition-all cursor-pointer text-sm"
        >
          {t('common.cancel')}
        </button>
        <button 
          onClick={handleSoundSave}
          className="flex-[2] bg-indigo-600 text-white font-black py-3.5 rounded-[15px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer text-sm"
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
};
