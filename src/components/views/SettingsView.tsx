import React from 'react';
import { 
  Settings, 
  ChevronLeft, 
  Clock, 
  Hourglass, 
  BrickWall,
  Plus, 
  Trash2, 
  Edit2
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { UserData, TaskType, TaskStatus } from '../../types';
import { SortableChunkItem } from '../routine/SortableChunkItem';
import { SortableTaskItem } from '../routine/SortableTaskItem';

interface SettingsViewProps {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  settingsSubView: any;
  setSettingsSubView: (view: any) => void;
  setIsSettingsOpen: (open: boolean) => void;
  updateWakeUpTime: (time: string) => void;
  updateResetTime: (time: string) => void;
  updateChunkInfo: (id: string, newName: string, newPurpose: string) => void;
  deleteChunk: (id: string, onSuccess?: () => void) => void;
  handleChunkDragEnd: (event: DragEndEvent) => void;
  editingChunkId: string | null;
  setEditingChunkId: (id: string | null) => void;
  editingChunkName: string;
  setEditingChunkName: (name: string) => void;
  editingChunkPurpose: string;
  setEditingChunkPurpose: (purpose: string) => void;
  chunkTimeInputs: any;
  setChunkTimeInputs: (inputs: any) => void;
  chunkScheduleInputs: any;
  setChunkScheduleInputs: (inputs: any) => void;
  applyChunkTimes: (chunkId: string, s: string, d: number, e: string, alarm?: boolean) => void;
  updateChunkSchedule: (chunkId: string, type: 'days' | 'weekly' | 'monthly' | 'yearly', days: number[], freq: number) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editingTaskText: string;
  setEditingTaskText: (text: string) => void;
  editingTaskDuration: number;
  setEditingTaskDuration: (duration: number) => void;
  editingTaskType: TaskType;
  setEditingTaskType: (type: TaskType) => void;
  editingTaskScheduledDays: number[];
  setEditingTaskScheduledDays: (days: number[]) => void;
  updateTask: (taskId: string, newText: string, newDuration: number, newTaskType?: TaskType, newScheduledDays?: number[]) => void;
  deleteTask: (id: string) => void;
  handleTaskDragEnd: (event: DragEndEvent, chunkId: string) => void;
  addTask: (chunkId: string, scheduledDays?: number[]) => void;
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  newTaskDuration: number;
  setNewTaskDuration: (duration: number) => void;
  newTaskType: TaskType;
  setNewTaskType: (type: TaskType) => void;
  mode?: 'main' | 'modal';
  setActiveChunkId: (id: string | null) => void;
  timeToMinutes: (time: string) => number;
  minutesToTime: (minutes: number) => string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userData,
  settingsSubView,
  setSettingsSubView,
  setIsSettingsOpen,
  updateWakeUpTime,
  updateResetTime,
  updateChunkInfo,
  deleteChunk,
  handleChunkDragEnd,
  editingChunkId,
  setEditingChunkId,
  editingChunkName,
  setEditingChunkName,
  editingChunkPurpose,
  setEditingChunkPurpose,
  chunkTimeInputs,
  setChunkTimeInputs,
  chunkScheduleInputs,
  setChunkScheduleInputs,
  applyChunkTimes,
  updateChunkSchedule,
  editingTaskId,
  setEditingTaskId,
  editingTaskText,
  setEditingTaskText,
  editingTaskDuration,
  setEditingTaskDuration,
  editingTaskType,
  setEditingTaskType,
  editingTaskScheduledDays,
  setEditingTaskScheduledDays,
  updateTask,
  deleteTask,
  handleTaskDragEnd,
  addTask,
  newTaskText,
  setNewTaskText,
  newTaskDuration,
  setNewTaskDuration,
  newTaskType,
  setNewTaskType,
  mode = 'main',
  setActiveChunkId,
  timeToMinutes,
  minutesToTime
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const renderMainSettings = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <div className="w-10 h-10 bg-indigo-50 rounded-[10px] flex items-center justify-center">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">전체설정화면</h2>
      </div>
      <div className="space-y-[15px] overflow-y-auto pr-2 custom-scrollbar flex-grow">
        <div className="p-[15px] bg-slate-50 rounded-[10px] border border-slate-100 space-y-[15px] shadow-sm">
          <div className="flex flex-col gap-1 mb-1">
            <h3 className="text-base font-black text-slate-800 whitespace-nowrap ml-1">기상 목표 시간</h3>
          </div>
          <div className="flex gap-2">
            <input 
              type="time" 
              defaultValue={userData.targetWakeUpTime}
              id="wakeUpTimeInput"
              className="flex-grow text-lg font-black p-3 bg-white border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
            <button 
              onClick={() => {
                const input = document.getElementById('wakeUpTimeInput') as HTMLInputElement;
                if (input) updateWakeUpTime(input.value);
              }}
              className="bg-indigo-600 text-white px-5 rounded-[10px] font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
            >
              변경
            </button>
          </div>
        </div>

        <div className="p-[15px] bg-slate-50 rounded-[10px] border border-slate-100 space-y-[15px] shadow-sm">
          <div className="flex flex-col gap-1 mb-1">
            <h3 className="text-base font-black text-slate-800 whitespace-nowrap ml-1">하루 리셋 시간</h3>
            <p className="text-[10px] font-bold text-slate-400 leading-tight ml-1">이 시간이 되면 모든 루틴의 완료 상태가 초기화됩니다.</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="time" 
              defaultValue={userData.resetTime}
              id="resetTimeInput"
              className="flex-grow text-lg font-black p-3 bg-white border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
            <button 
              onClick={() => {
                const input = document.getElementById('resetTimeInput') as HTMLInputElement;
                if (input) updateResetTime(input.value);
              }}
              className="bg-indigo-600 text-white px-5 rounded-[10px] font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md"
            >
              변경
            </button>
          </div>
        </div>

        <div className="p-[15px] bg-slate-50 rounded-[10px] border border-slate-100 space-y-[15px] shadow-sm">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-base font-black text-slate-900">루틴 그룹 관리</h3>
          </div>
          
          <div className="space-y-1">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleChunkDragEnd}
            >
              <SortableContext 
                items={userData.routineChunks.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {userData.routineChunks.map((chunk) => (
                  <SortableChunkItem 
                    key={chunk.id}
                    chunk={chunk}
                    onEnterDetail={(id) => setSettingsSubView({ type: 'detail', chunkId: id })}
                    onUpdateInfo={updateChunkInfo}
                    onDelete={deleteChunk}
                    editingChunkId={editingChunkId}
                    setEditingChunkId={setEditingChunkId}
                    editingChunkName={editingChunkName}
                    setEditingChunkName={setEditingChunkName}
                    editingChunkPurpose={editingChunkPurpose}
                    setEditingChunkPurpose={setEditingChunkPurpose}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
      
      {mode === 'modal' && (
        <button 
          onClick={() => setIsSettingsOpen(false)}
          className="w-full mt-6 bg-slate-900 text-white font-bold py-4 rounded-[10px] hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          저장하고 닫기
        </button>
      )}
    </div>
  );

  const renderDetailSettings = () => {
    const chunk = userData.routineChunks.find(c => c.id === settingsSubView.chunkId);
    if (!chunk) return null;
    const times = chunkTimeInputs[chunk.id] || { 
      s: chunk.startTime || '', 
      d: chunk.duration || 0, 
      e: chunk.endTime || '', 
      alarm: chunk.isAlarmEnabled || false,
      startType: chunk.startType || 'anytime',
      startSituation: chunk.startSituation || ''
    };
    const schedule = chunkScheduleInputs[chunk.id] || { 
      type: chunk.scheduleType || 'days', 
      days: chunk.scheduledDays || [0, 1, 2, 3, 4, 5, 6], 
      freq: chunk.frequency || 1 
    };

    const isDirty = times.s !== (chunk.startTime || '') || 
                    times.d !== (chunk.duration || 0) || 
                    times.e !== (chunk.endTime || '') ||
                    times.alarm !== chunk.isAlarmEnabled ||
                    times.startType !== (chunk.startType || 'anytime') ||
                    times.startSituation !== (chunk.startSituation || '') ||
                    schedule.type !== (chunk.scheduleType || 'days') ||
                    JSON.stringify(schedule.days) !== JSON.stringify(chunk.scheduledDays || [0, 1, 2, 3, 4, 5, 6]) ||
                    schedule.freq !== (chunk.frequency || 1);

    const renderActionButtons = () => (
      <div className="flex gap-3">
        <button 
          onClick={() => {
            if (isDirty) {
              applyChunkTimes(chunk.id, times.s, times.d, times.e, times.alarm, times.startType, times.startSituation);
              updateChunkSchedule(chunk.id, schedule.type, schedule.days, schedule.freq);
            }
            if (mode === 'modal') {
              setIsSettingsOpen(false);
            } else {
              setSettingsSubView({ type: 'main' });
            }
          }}
          className="flex-1 py-3 bg-sky-500 text-white rounded-[10px] font-bold text-sm hover:bg-sky-600 transition-colors"
        >
          저장하고 돌아가기
        </button>
        <button 
          onClick={() => {
            if (mode === 'modal') {
              setIsSettingsOpen(false);
            } else {
              setSettingsSubView({ type: 'main' });
            }
          }}
          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-[10px] font-bold text-sm hover:bg-slate-200 transition-colors"
        >
          취소하고 돌아가기
        </button>
      </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-3 mb-6 flex-shrink-0">
            {mode === 'main' && (
              <button 
                onClick={() => setSettingsSubView({ type: 'main' })}
                className="p-2 hover:bg-slate-100 rounded-[10px] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <div className="w-10 h-10 bg-indigo-50 rounded-[10px] flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            {editingChunkId === chunk.id ? (
              <div className="flex flex-col gap-3 flex-grow">
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={editingChunkName}
                    onChange={(e) => setEditingChunkName(e.target.value)}
                    placeholder="그룹 이름"
                    className="flex-grow bg-white border border-slate-200 rounded-[10px] px-3 py-1.5 text-lg font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      updateChunkInfo(chunk.id, editingChunkName, editingChunkPurpose);
                      setEditingChunkId(null);
                    }}
                    className="px-3 py-1.5 bg-sky-500 text-white rounded-[10px] font-bold text-xs hover:bg-sky-600 transition-colors"
                  >
                    저장
                  </button>
                </div>
                <input 
                  type="text"
                  value={editingChunkPurpose}
                  onChange={(e) => setEditingChunkPurpose(e.target.value)}
                  placeholder="그룹 목적 (예: 아침시간을 낭비하지 않는 사람)"
                  className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateChunkInfo(chunk.id, editingChunkName, editingChunkPurpose);
                      setEditingChunkId(null);
                    }
                    if (e.key === 'Escape') setEditingChunkId(null);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setEditingChunkId(chunk.id);
                    setEditingChunkName(chunk.name);
                    setEditingChunkPurpose(chunk.purpose || '');
                  }}
                  className="flex flex-col text-left group/header"
                >
                  <h2 className="text-xl font-black text-slate-900 group-hover/header:text-indigo-600 transition-colors">{chunk.name}</h2>
                  <p className="text-xs font-bold text-slate-400 group-hover/header:text-indigo-400 transition-colors">{chunk.purpose}</p>
                </button>
                <div className="flex items-center gap-1">
                  <div className="relative group/tooltip">
                    <button 
                      onClick={() => {
                        setEditingChunkId(chunk.id);
                        setEditingChunkName(chunk.name);
                        setEditingChunkPurpose(chunk.purpose || '');
                      }}
                      className="p-2 text-slate-300 hover:text-sky-500 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      정보 수정
                    </div>
                  </div>
                  <div className="relative group/tooltip">
                    <button 
                      onClick={() => {
                        deleteChunk(chunk.id, () => {
                          if (mode === 'modal') {
                            setIsSettingsOpen(false);
                            setSettingsSubView({ type: 'main' });
                          } else {
                            setSettingsSubView({ type: 'main' });
                          }
                        });
                      }}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      삭제
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-grow pb-4">
            <div className="space-y-4">
  
              {/* Start Situation Settings */}
              <div className="p-5 bg-slate-50 rounded-[10px] border border-slate-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">시작상황 설정</label>
                </div>
                
                <div className="flex gap-2 p-1 bg-white rounded-[10px] border border-slate-200 shadow-sm">
                  {[
                    { id: 'anytime', label: '아무때나' },
                    { id: 'situation', label: '상황' },
                    { id: 'time', label: '시각' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setChunkTimeInputs((prev: any) => ({ ...prev, [chunk.id]: { ...prev[chunk.id], startType: opt.id } }))}
                      className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black transition-all ${times.startType === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {times.startType === 'situation' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">상황 입력</label>
                    <input 
                      type="text"
                      value={times.startSituation}
                      onChange={(e) => setChunkTimeInputs((prev: any) => ({ ...prev, [chunk.id]: { ...prev[chunk.id], startSituation: e.target.value } }))}
                      placeholder="예: 외출했다 돌아왔을 때"
                      className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>
                )}

                {times.startType === 'time' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5 flex-grow mr-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">시작 시각</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="time"
                            value={times.s}
                            onChange={(e) => {
                              const newS = e.target.value;
                              let newE = times.e;
                              if (newS && times.d > 0) {
                                newE = minutesToTime(timeToMinutes(newS) + times.d);
                              }
                              setChunkTimeInputs((prev: any) => ({ ...prev, [chunk.id]: { ...prev[chunk.id], s: newS, e: newE } }));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-[10px] pl-12 pr-5 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 bg-white px-3 py-2 rounded-[10px] border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase">알람</span>
                        <button 
                          onClick={() => setChunkTimeInputs((prev: any) => ({ ...prev, [chunk.id]: { ...prev[chunk.id], alarm: !times.alarm } }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${times.alarm ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${times.alarm ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">소요 시간(분)</label>
                    <input 
                      type="number"
                      value={times.d || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newD = val === '' ? 0 : parseInt(val);
                        let newE = times.e;
                        if (times.s && newD > 0) {
                          newE = minutesToTime(timeToMinutes(times.s) + newD);
                        }
                        setChunkTimeInputs((prev: any) => ({ ...prev, [chunk.id]: { ...prev[chunk.id], d: newD, e: newE } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">완료 시각</label>
                    <input 
                      type="time"
                      value={times.e}
                      onChange={(e) => {
                        const newE = e.target.value;
                        setChunkTimeInputs((prev: any) => ({ ...prev, [chunk.id]: { ...prev[chunk.id], e: newE } }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>
                </div>
              </div>
  
              {/* Schedule Settings */}
              <div className="p-5 bg-slate-50 rounded-[10px] border border-slate-100 space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">실행 주기</label>
                    <div className="flex bg-white rounded-[10px] p-1 border border-slate-200 shadow-sm">
                      {(['days', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setChunkScheduleInputs((prev: any) => ({ ...prev, [chunk.id]: { ...schedule, type: t } }))}
                          className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold transition-all ${
                            schedule.type === t 
                              ? 'bg-indigo-500 text-white shadow-sm' 
                              : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {t === 'days' ? '요일' : t === 'weekly' ? '주간' : t === 'monthly' ? '월간' : '연간'}
                        </button>
                      ))}
                    </div>
                  </div>
  
                  {schedule.type === 'days' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between gap-1">
                        {[
                          { label: '월', value: 1 },
                          { label: '화', value: 2 },
                          { label: '수', value: 3 },
                          { label: '목', value: 4 },
                          { label: '금', value: 5 },
                          { label: '토', value: 6, color: 'bg-emerald-600' },
                          { label: '일', value: 0, color: 'bg-rose-600' }
                        ].map((dayObj) => {
                          const i = dayObj.value;
                          const isSelected = schedule.days.includes(i);
                          const selectedColor = dayObj.color || 'bg-indigo-500';
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                const newDays = schedule.days.includes(i)
                                  ? schedule.days.filter((d: number) => d !== i)
                                  : [...schedule.days, i].sort();
                                setChunkScheduleInputs((prev: any) => ({ ...prev, [chunk.id]: { ...schedule, days: newDays } }));
                              }}
                              className={`flex-1 py-2 rounded-[10px] text-xs font-bold transition-all ${
                                isSelected
                                  ? `${selectedColor} text-white shadow-md shadow-indigo-200`
                                  : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {dayObj.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white p-3 rounded-[10px] border border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-slate-600">
                          {schedule.type === 'weekly' ? '주' : schedule.type === 'monthly' ? '월' : '연'} {schedule.freq}회 실행
                        </span>
                        <input 
                          type="range"
                          min="1"
                          max={schedule.type === 'weekly' ? 7 : schedule.type === 'monthly' ? 31 : 12}
                          value={schedule.freq}
                          onChange={(e) => setChunkScheduleInputs((prev: any) => ({ ...prev, [chunk.id]: { ...schedule, freq: parseInt(e.target.value) } }))}
                          className="w-32 accent-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
  
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <h3 className="text-base font-black text-slate-900">루틴 목록</h3>
              </div>
              
              <div className="space-y-2">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleTaskDragEnd(e, chunk.id)}
                >
                  <SortableContext 
                    items={chunk.tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {chunk.tasks.map((task, index) => (
                      <SortableTaskItem 
                        key={task.id}
                        task={task}
                        index={index}
                        editingTaskId={editingTaskId}
                        setEditingTaskId={setEditingTaskId}
                        editingTaskText={editingTaskText}
                        setEditingTaskText={setEditingTaskText}
                        editingTaskDuration={editingTaskDuration}
                        setEditingTaskDuration={setEditingTaskDuration}
                        editingTaskType={editingTaskType}
                        setEditingTaskType={setEditingTaskType}
                        editingTaskScheduledDays={editingTaskScheduledDays}
                        setEditingTaskScheduledDays={setEditingTaskScheduledDays}
                        updateTask={updateTask}
                        deleteTask={deleteTask}
                        chunkScheduledDays={schedule.days}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
  
              <div className="p-5 bg-slate-50 rounded-[10px] border border-slate-100 space-y-4 shadow-sm">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">새 루틴 추가</p>
                  <input 
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="루틴 이름 입력..."
                    className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">루틴 유형</span>
                    <div className="flex items-center gap-1">
                      {[TaskType.TIME_INDEPENDENT, TaskType.TIME_LIMITED, TaskType.TIME_ACCUMULATED].map(type => {
                        const colorClass = type === TaskType.TIME_INDEPENDENT ? 'bg-sky-500' : type === TaskType.TIME_ACCUMULATED ? 'bg-pink-500' : 'bg-indigo-600';
                        const Icon = type === TaskType.TIME_INDEPENDENT ? Clock : type === TaskType.TIME_ACCUMULATED ? BrickWall : Hourglass;
                        return (
                          <button 
                            key={type}
                            onClick={() => setNewTaskType(type)}
                            className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-black transition-all flex items-center justify-center gap-1 ${newTaskType === type ? `${colorClass} text-white shadow-md` : 'bg-white text-slate-400 border border-slate-100'}`}
                          >
                            <Icon className="w-3 h-3" />
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
 
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">소요 시간(분)</span>
                      <input 
                        type="number"
                        value={newTaskDuration || ''}
                        onChange={(e) => setNewTaskDuration(e.target.value === '' ? 0 : parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-[10px] px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveChunkId(chunk.id);
                    addTask(chunk.id);
                  }}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-[10px] font-black text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  루틴 추가하기
                </button>
              </div>
            </div>
          </div>
  
          <div className="mt-4 flex-shrink-0">
            {renderActionButtons()}
          </div>
        </div>
    );
  };

  return settingsSubView.type === 'main' ? renderMainSettings() : renderDetailSettings();
};
