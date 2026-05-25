import React from 'react';
import { Volume2, AlertCircle, Clock, BrickWall, Hourglass } from 'lucide-react';
import { NaggingSettings, UserData, TaskType } from '../../types';

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
}) => {
  const defaultSettings: NaggingSettings = {
    startEnabled: false,
    restartEnabled: false,
    startMessage: 'task',
    ongoingEnabled: false,
    ongoingInterval: 1,
    ongoingMessage: 'task가 n분째 진행중입니다',
    ongoingTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    beforeEndEnabled: false,
    beforeEndTime: 1,
    beforeEndMessage: 'task 종료 r분 전입니다.',
    beforeEndTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    endEnabled: false,
    endMessage: 'task 시간이 지났습니다.',
    endTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED],
    overTimeEnabled: false,
    overTimeInterval: 1,
    overTimeMessage: 'name님, task가 m분 지났어요.',
    overTimeTargetTypes: [TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED]
  };

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
        title: '변경 취소 확인',
        message: '변경 사항이 저장되지 않았습니다. 취소하시겠습니까?',
        confirmLabel: '취소하고 나가기',
        cancelLabel: '계속 수정하기',
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
      setUserData(prev => ({
        ...prev,
        naggingSettings: localNaggingSettings
      }));
      setIsNaggingDirty(false);
      setNaggingSuccessMessage('잔소리 설정이 저장되었습니다');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-[20px] flex-shrink-0">
        <button 
          onClick={handleNaggingBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors shadow-sm cursor-pointer"
          title="일반설정으로 돌아가기"
        >
          <Volume2 className="w-5 h-5 text-indigo-600" />
        </button>
        <h2 className="text-lg font-black text-slate-800">잔소리 기능 설정</h2>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow pb-4">
        {/* 공통 변수 안내 */}
        <div className="p-4 bg-indigo-50 rounded-2xl space-y-3 border border-indigo-100">
          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-indigo-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-indigo-600" /> 사용 가능한 변수
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-indigo-700">
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">name</span>: 사용자 이름</div>
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">task</span>: 루틴 제목</div>
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">n</span>: 시작 후 경과 분</div>
              <div className="bg-white/50 p-2 rounded-lg"><span className="text-indigo-900">r</span>: 종료 전 남은 분</div>
              <div className="bg-white/50 p-2 rounded-lg col-span-2"><span className="text-indigo-900">m</span>: 목표 초과 분</div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-indigo-200/50">
            <h3 className="text-sm font-black text-indigo-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-indigo-600" /> 한글 조사 자동 교정
            </h3>
            <div className="text-[10px] font-bold text-indigo-600/80 leading-relaxed">
              <span className="text-indigo-900 underline decoration-indigo-300 underline-offset-2">name</span>이나 <span className="text-indigo-900 underline decoration-indigo-300 underline-offset-2">task</span> 뒤에 <span className="font-black text-indigo-800">'이/가'</span>와 같이 슬래시(/)로 구분된 조사를 사용하면 받침 유무에 따라 알맞게 교정됩니다. 
              예를들어 "task이/가 n분째 진행중입니다"를 입력하시면, "운동이 5분째 진행중입니다" 또는 "운동하기가 5분째 진행중입니다"와 같이 적절한 조사가 출력됩니다. 
              <p className="text-[10px] font-bold text-indigo-600/80 leading-relaxed">* 지원: 은/는, 이/가, 을/를, 으로/로, 이죠/죠, 이다/다</p>
            </div>
          </div>
        </div>

        {/* 3-1. 루틴 시작시 알림 */}
        <div className="p-[15px] bg-white rounded-[15px] space-y-[15px] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 pr-4">
              <h3 className="text-base font-black text-slate-800">루틴 시작시 알림</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">루틴을 시작할 때의 알림입니다.</p>
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
                  <h3 className="text-base font-black text-slate-800">루틴 재시작시 알림</h3>
                  <p className="text-[11px] font-bold text-slate-400 leading-tight">일시정지 또는 완료한 루틴을 재시작할 때에도 같은 알림을 보냅니다.</p>
                </div>
                <button 
                  onClick={() => updateNagging('restartEnabled', !settings.restartEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${settings.restartEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.restartEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">안내 문구 설정</label>
                <input 
                  type="text"
                  value={settings.startMessage}
                  onChange={(e) => updateNagging('startMessage', e.target.value)}
                  placeholder="예: task 시작합니다"
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
              <h3 className="text-base font-black text-slate-800">루틴 진행 중 알림</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">루틴이 진행되는 동안 정기적으로 알림을 보냅니다. 단, '루틴 종료 전 알림'과 겹치는 경우 '루틴 종료 전 알림'만 내보냅니다.</p>
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
                <label className="text-[11px] font-bold text-slate-500 ml-1">루틴 유형별 적용 여부</label>
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
                        {type === TaskType.TIME_INDEPENDENT ? '시간무관루틴' : 
                         type === TaskType.TIME_LIMITED ? '시간제한루틴' : '시간축적루틴'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">알림 간격 설정</label>
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
                  <span className="text-xs font-black text-slate-400">분 마다</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">안내 문구 설정</label>
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
              <h3 className="text-base font-black text-slate-800">루틴 종료 전 알림</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">루틴 시간이 종료되기 전의 알림입니다.</p>
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
                <label className="text-[11px] font-bold text-slate-500 ml-1">루틴 유형별 적용 여부</label>
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
                        {type === TaskType.TIME_INDEPENDENT ? '시간무관루틴' : 
                         type === TaskType.TIME_LIMITED ? '시간제한루틴' : '시간축적루틴'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">알림 시점 설정</label>
                <select 
                  value={settings.beforeEndTime}
                  onChange={(e) => updateNagging('beforeEndTime', parseInt(e.target.value))}
                  className="w-32 text-sm font-black p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(m => (
                    <option key={m} value={m}>{m}분 전</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">안내 문구 설정</label>
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
              <h3 className="text-base font-black text-slate-800">루틴 종료 알림</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">사용자가 설정한 시간이 종료되었을 때의 알림입니다.</p>
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
                <label className="text-[11px] font-bold text-slate-500 ml-1">루틴 유형별 적용 여부</label>
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
                        {type === TaskType.TIME_INDEPENDENT ? '시간무관루틴' : 
                         type === TaskType.TIME_LIMITED ? '시간제한루틴' : '시간축적루틴'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">안내 문구 설정</label>
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
              <h3 className="text-base font-black text-slate-800">루틴 종료 후 알림</h3>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">설정 시간이 경과한 후에도 지속적으로 안내합니다. </p>
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
                <label className="text-[11px] font-bold text-slate-500 ml-1">루틴 유형별 적용 여부</label>
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
                        {type === TaskType.TIME_INDEPENDENT ? '시간무관루틴' : 
                         type === TaskType.TIME_LIMITED ? '시간제한루틴' : '시간축적루틴'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">알림 간격 설정</label>
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
                  <span className="text-xs font-black text-slate-400">분 마다</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 ml-1">안내 문구 설정</label>
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
          취소
        </button>
        <button 
          onClick={handleNaggingSave}
          className="flex-[2] bg-indigo-600 text-white font-black py-3.5 rounded-[15px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer text-sm"
        >
          저장
        </button>
      </div>
    </div>
  );
};
