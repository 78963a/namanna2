import { Dispatch, SetStateAction, FC } from 'react';
import { Home, Settings, PlusCircle, BarChart3, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { CheckCheckIcon } from '../CheckCheckIcon';
import { voiceService } from '../../services/voiceService';
import { soundService } from '../../services/soundService';
import { UserData, SettingsSubView } from '../../types';

export interface MenuBarProps {
  // 현재 활성화되어 있는 메뉴 탭 상태 ('home' | 'stats' | 'execution' | 'settings' | 'add')
  activeTab: 'home' | 'stats' | 'execution' | 'settings' | 'add';
  // 실행 중인 루틴의 ID (실행 중이 아니면 null)
  selectedChunkId: string | null;
  // 잔소리(음성) 가 일시 정지(음소거)되어 있는지 여부
  isVoiceMutedTemporarily: boolean;
  // 잔소리(음성) 음소거 상태를 설정하는 함수
  setIsVoiceMutedTemporarily: Dispatch<SetStateAction<boolean>>;
  // 성장 캐릭터의 고유 아이콘 ID
  checkCheckIconId: number;
  // 성장 버튼이 현재 클릭 가능한지 여부
  isCheckCheckAvailable: boolean;
  // 앱 내 전체 사용자 데이터 (포인트 수, 루틴 기록, 잔소리 정보 등 저장)
  userData: UserData;
  // 다른 메뉴 탭으로의 부드러운 화면 전환을 처리하는 공통 함수
  handleTabTransition: (targetTab: 'home' | 'stats' | 'execution' | 'settings' | 'add', extraAction?: () => void) => void;
  // 특정 루틴 세부 ID를 선택 또는 해제할 때 사용하는 함수
  setSelectedChunkId: (id: string | null) => void;
  // 설정 화면 내의 세부 뷰(메인설정, 잔소리설정, 음향설정, 상세수정 등)를 변경할 때 사용하는 함수
  setSettingsSubView: (view: SettingsSubView) => void;
  // 설정 패널의 오픈 여부 관리 함수
  setIsSettingsOpen: (isOpen: boolean) => void;
  // 통계 데이터를 리프레시하기 위해 고유 Key 값을 업데이트하는 함수
  setStatsKey: Dispatch<SetStateAction<number>>;
  // 성장형 캐릭터 버튼 클릭 시 호출되는 함수
  handleCheckCheckClick: () => void;
}

export const MenuBar: FC<MenuBarProps> = ({
  activeTab,
  selectedChunkId,
  isVoiceMutedTemporarily,
  setIsVoiceMutedTemporarily,
  checkCheckIconId,
  isCheckCheckAvailable,
  userData,
  handleTabTransition,
  setSelectedChunkId,
  setSettingsSubView,
  setIsSettingsOpen,
  setStatsKey,
  handleCheckCheckClick,
}) => {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-40 bg-[#F7FEE7]/80 dark:bg-slate-950/80 backdrop-blur-md pt-2.5 pb-0 w-full">
      <div className="max-w-2xl mx-auto px-4">
        <nav className="flex items-center gap-3">
          
          {/* 
            =========================================
            1. [홈 메뉴 버튼] 
            - 연결 파일: /src/components/views/HomeView.tsx
            =========================================
          */}
          <button 
            onClick={() => {
              handleTabTransition('home', () => {
                setSelectedChunkId(null);
              });
            }}
            className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] ${
              activeTab === 'home' && !selectedChunkId 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
            }`}
          >
            <Home className="w-5 h-5" />
          </button>

          {/* 
            =========================================
            2. [설정 메뉴 버튼] 
            - 연결 파일: /src/components/settings/SettingsView.tsx
            =========================================
          */}
          <button 
            onClick={() => {
              handleTabTransition('settings', () => {
                setSettingsSubView({ type: 'main' });
                setSelectedChunkId(null);
                setIsSettingsOpen(false);
              });
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 
            =========================================
            3. [루틴 그룹 추가(+) 버튼] 
            - 연결 파일: /src/components/common/RoutineGroupFormView.tsx
            =========================================
          */}
          <button 
            onClick={() => {
              handleTabTransition('add', () => {
                setSelectedChunkId(null);
                setIsSettingsOpen(false);
              });
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all ${
              activeTab === 'add'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* 
            =========================================
            4. [통계 분석 메뉴 버튼] 
            - 연결 파일: /src/components/views/StatsView.tsx
            =========================================
          */}
          <button 
            onClick={() => {
              handleTabTransition('stats', () => {
                setSelectedChunkId(null);
                setStatsKey(prev => prev + 1);
              });
            }}
            className={`transition-all w-10 h-10 flex items-center justify-center rounded-[10px] ${
              activeTab === 'stats' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' 
                : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-100 dark:border-slate-800 shadow-sm'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* 
            =========================================
            5. [음성안내 / 잔소리 일시 켜기/끄기 토글 버튼] 
            - 동작 원리: 클릭 시 TTS 인스턴스를 초기화하고 음소거 여부를 반전시킵니다.
            =========================================
          */}
          <button 
            onClick={() => {
              soundService.unlock();
              voiceService.unlock();
              if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              setIsVoiceMutedTemporarily(prev => !prev);
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-[10px] transition-all bg-white border shadow-sm hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 ${
              !isVoiceMutedTemporarily 
                ? 'border-blue-400 text-blue-500'
                : 'border-slate-100 text-slate-400'
            }`}
          >
            {!isVoiceMutedTemporarily ? <Volume2 className="w-5 h-5" strokeWidth={2.5} /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* 
            =========================================
            6. [체크체크 성장형 캐릭터 (Check-Check Box) 버튼] 
            - 연결 파일: /src/components/CheckCheckIcon.tsx 에서 캐릭터 그래픽 세부 로직을 담고 있습니다.
            =========================================
          */}
          <motion.button 
            onClick={handleCheckCheckClick}
            whileTap={isCheckCheckAvailable ? "tap" : undefined}
            variants={{
              tap: { scale: 0.94 }
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`transition-all w-16 h-10 flex items-center px-1.5 rounded-[10px] border shadow-sm relative overflow-hidden always-light ${
              isCheckCheckAvailable 
                ? 'bg-white border-indigo-200 cursor-pointer hover:border-indigo-400' 
                : 'bg-white border-slate-100 cursor-default'
            }`}
          >
            <motion.div 
              variants={{
                tap: { scaleX: 1.25, scaleY: 0.75 }
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="flex-shrink-0 flex items-center justify-center w-9 origin-bottom"
            >
              <CheckCheckIcon iconId={checkCheckIconId} size={32} />
            </motion.div>
            <div className="flex-grow flex flex-col items-center justify-center ml-0.5 relative">
              <span className="text-[10px] font-black text-slate-500 leading-none" title={t('character.pressCountTitle')}>
                {(userData.availableCheckCheckCount !== undefined ? userData.availableCheckCheckCount : 5)}
              </span>
              {isCheckCheckAvailable && (
                <div className="mt-1">
                  <span className="flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                  </span>
                </div>
              )}
            </div>
          </motion.button>
        </nav>
      </div>
    </div>
  );
};
