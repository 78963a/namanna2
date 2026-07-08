import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { UserData } from '../../types';
import { KoreanJosaGuide } from './KoreanJosaGuide';

interface CompletionPhrasesSettingsViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
  setSettingsSubView: (subView: { type: 'main' | 'sound' | 'nagging' | 'detail' | 'completionPhrases'; chunkId?: string }) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
  setCompletionSuccessMessage: (msg: string | null) => void;
}

export const CompletionPhrasesSettingsView: React.FC<CompletionPhrasesSettingsViewProps> = ({
  userData,
  setUserData,
  setConfirmModal,
  setSettingsSubView,
  setCompletionSuccessMessage,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ko';
  const langKey = currentLang.startsWith('ko') ? 'ko' : currentLang.startsWith('ja') ? 'ja' : 'en';

  // Load language-specific templates. If not defined yet, load default templates.
  const [phrases, setPhrases] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    const savedTemplates = userData.completionTemplatesByLang?.[langKey];
    if (savedTemplates && savedTemplates.length > 0) {
      setPhrases([...savedTemplates]);
    } else {
      const defaultTemplatesFromI18n = t('completionPhrases.defaultTemplates', { returnObjects: true });
      const defaultTemplates: string[] = Array.isArray(defaultTemplatesFromI18n)
        ? defaultTemplatesFromI18n
        : [];
      setPhrases([...defaultTemplates]);
    }
    setIsDirty(false);
  }, [langKey]);

  // Alert/Prompt when leaving with unsaved changes
  const handleBackConfirm = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: t('nagging.cancelTitle'),
        message: t('nagging.cancelMessage'),
        confirmLabel: t('nagging.cancelConfirm'),
        cancelLabel: t('nagging.cancelCancel'),
        confirmColor: 'indigo',
        showCancel: true,
        onConfirm: () => {
          setIsDirty(false);
          setSettingsSubView({ type: 'main' });
          setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
        },
        onCancel: () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
      });
    } else {
      setSettingsSubView({ type: 'main' });
    }
  };

  const handleSave = () => {
    // Filter out empty phrases
    const filteredPhrases = phrases.map(p => p.trim()).filter(Boolean);
    if (filteredPhrases.length === 0) {
      // Must have at least one phrase
      setConfirmModal({
        isOpen: true,
        title: t('completionPhrases.saveErrorTitle'),
        message: t('completionPhrases.saveErrorMessage'),
        confirmLabel: t('common.confirm', '확인'),
        confirmColor: 'indigo',
        showCancel: false,
        onConfirm: () => setConfirmModal((prev: any) => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setUserData(prev => {
      const completionTemplatesByLang = prev.completionTemplatesByLang || {};
      return {
        ...prev,
        completionTemplatesByLang: {
          ...completionTemplatesByLang,
          [langKey]: filteredPhrases
        }
      };
    });

    setIsDirty(false);
    setCompletionSuccessMessage(t('completionPhrases.saveSuccess'));
  };

  const handlePhraseChange = (index: number, val: string) => {
    const updated = [...phrases];
    updated[index] = val;
    setPhrases(updated);
    setIsDirty(true);
  };

  const handleAddPhrase = () => {
    setPhrases([...phrases, '']);
    setIsDirty(true);
  };

  const handleRemovePhrase = (index: number) => {
    const updated = phrases.filter((_, idx) => idx !== index);
    setPhrases(updated);
    setIsDirty(true);
  };



  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-[20px] flex-shrink-0">
        <button 
          onClick={handleBackConfirm}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shadow-sm cursor-pointer"
          title={t('nagging.backTitle')}
        >
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
        </button>
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('completionPhrases.title')}</h2>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow pb-4">
        {/* Helper variables guide */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl space-y-3 border border-indigo-100 dark:border-indigo-900/60">
          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {t('completionPhrases.varsTitle')}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              {(() => {
                const guideVars = langKey === 'ko' ? [
                  { tag: '#이름', label: t('completionPhrases.varsName') },
                  { tag: '#그룹', label: t('completionPhrases.varsTitleLabel') },
                  { tag: '#목적', label: t('completionPhrases.varsPurposeLabel') },
                  { tag: '#소요시간', label: t('completionPhrases.varsDurationLabel') },
                  { tag: '#시작시간', label: t('completionPhrases.varsStartTimeLabel') },
                  { tag: '#완료시간', label: t('completionPhrases.varsEndTimeLabel') },
                ] : langKey === 'ja' ? [
                  { tag: '#名前', label: t('completionPhrases.varsName') },
                  { tag: '#グループ', label: t('completionPhrases.varsTitleLabel') },
                  { tag: '#目的', label: t('completionPhrases.varsPurposeLabel') },
                  { tag: '#所要時間', label: t('completionPhrases.varsDurationLabel') },
                  { tag: '#開始時間', label: t('completionPhrases.varsStartTimeLabel') },
                  { tag: '#完了時間', label: t('completionPhrases.varsEndTimeLabel') },
                ] : [
                  { tag: '#name', label: t('completionPhrases.varsName') },
                  { tag: '#group', label: t('completionPhrases.varsTitleLabel') },
                  { tag: '#purpose', label: t('completionPhrases.varsPurposeLabel') },
                  { tag: '#duration', label: t('completionPhrases.varsDurationLabel') },
                  { tag: '#starttime', label: t('completionPhrases.varsStartTimeLabel') },
                  { tag: '#endtime', label: t('completionPhrases.varsEndTimeLabel') },
                ];
                return guideVars.map((v, i) => (
                  <div key={i} className="bg-white/50 dark:bg-slate-900/40 p-2 rounded-lg">
                    <span className="text-indigo-900 dark:text-indigo-200">{v.tag}</span>: {v.label}
                  </div>
                ));
              })()}
            </div>
          </div>

          {langKey === 'ko' && <KoreanJosaGuide />}
        </div>

        {/* List of custom templates */}
        <div className="space-y-3">
          {phrases.map((phrase, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-[15px] bg-white dark:bg-slate-900 rounded-[15px] shadow-sm border border-slate-50 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-1"
            >
              <div className="flex-grow space-y-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                  {t('completionPhrases.templateLabel')} {index + 1}
                </span>
                <input 
                  type="text"
                  id={`phrase-input-${index}`}
                  value={phrase}
                  onChange={(e) => handlePhraseChange(index, e.target.value)}
                  placeholder={t('completionPhrases.inputPlaceholder')}
                  className="w-full text-sm font-black p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>
              <button 
                onClick={() => handleRemovePhrase(index)}
                className="p-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer self-end"
                title={t('completionPhrases.deleteBtn')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add phrase button */}
        <button 
          onClick={handleAddPhrase}
          className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('completionPhrases.addBtn')}</span>
        </button>
      </div>

      {/* Bottom Sticky Action Area */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex-shrink-0 flex items-center justify-end gap-3">
        <button 
          onClick={handleSave}
          className={`px-6 py-3 font-bold text-sm text-white rounded-xl shadow-sm transition-all active:scale-95 ${
            isDirty 
              ? 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-100 shadow-md cursor-pointer' 
              : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
          }`}
          disabled={!isDirty}
        >
          {t('completionPhrases.saveBtn')}
        </button>
      </div>
    </div>
  );
};
