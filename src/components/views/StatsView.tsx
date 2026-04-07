import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  Target, 
  Zap 
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar 
} from 'recharts';
import { UserData } from '../../types';

interface StatsViewProps {
  userData: UserData;
  chartData: any[];
  relativeChartData: any[];
  absoluteChartData: any[];
  averageWakeUpTime: string;
  activeStatsTab: 'wake-up' | 'relative' | 'absolute';
  setActiveStatsTab: (tab: 'wake-up' | 'relative' | 'absolute') => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ 
  userData, 
  chartData, 
  relativeChartData, 
  absoluteChartData, 
  averageWakeUpTime, 
  activeStatsTab, 
  setActiveStatsTab 
}) => {
  const completionRates = Object.values(userData.dailyCompletionRate);
  const avgRate = completionRates.length > 0
    ? (completionRates as number[]).reduce((acc: number, val: number) => acc + val, 0) / completionRates.length
    : 0;

  const renderTabContent = () => {
    switch (activeStatsTab) {
      case 'wake-up':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Card */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
              <div className="bg-indigo-50 p-4 rounded-2xl">
                <Clock className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">평균 기상 시각</span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{averageWakeUpTime}</h2>
              </div>
              <p className="text-sm text-slate-400">
                총 {userData.history.length}회의 기상 기록을 바탕으로 계산되었습니다.
              </p>
            </section>

            {/* Graph Section */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                최근 7일 기상 추이
              </h3>
              
              <div className="h-64 w-full">
                {userData.history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        dy={10}
                      />
                      <YAxis 
                        hide 
                        domain={['dataMin - 30', 'dataMax + 30']}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
                                {payload[0].payload.displayTime}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="minutes" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorMinutes)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                    <BarChart3 className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-medium">아직 기록된 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </section>

            {/* History List */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                기상 기록 히스토리
              </h3>
              
              <div className="space-y-3">
                {userData.history.length > 0 ? (
                  userData.history.slice().reverse().map((record, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={record.date}
                      className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-400">{record.date.split('.').slice(2, 3)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{record.date}</p>
                          <p className="text-xs text-slate-400 font-medium">체크인 완료</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-600 tracking-tight">{record.time.slice(0, 5)}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center py-12 text-slate-400 text-sm font-medium">
                    기록이 없습니다. 내일부터 시작해보세요!
                  </p>
                )}
              </div>
            </section>
          </div>
        );
      case 'relative':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Card */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
              <div className="bg-violet-50 p-4 rounded-2xl">
                <Target className="w-8 h-8 text-violet-600" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">평균 달성률</span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {avgRate.toFixed(1)}%
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                루틴 완료율을 기반으로 계산된 성취도입니다.
              </p>
            </section>

            {/* Graph Section */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                최근 7일 루틴 완료율
              </h3>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={relativeChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#cbd5e1' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
                              {Math.round(payload[0].value)}%
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="percentage" 
                      fill="#8b5cf6" 
                      radius={[6, 6, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        );
      case 'absolute':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Card */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">누적 포인트</span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{userData.points || 0}P</h2>
              </div>
              <p className="text-sm text-slate-400">
                기상 및 루틴 수행을 통해 획득한 총 포인트입니다.
              </p>
            </section>

            {/* Graph Section */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                최근 7일 획득 포인트
              </h3>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={absoluteChartData}>
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      hide
                      domain={['dataMin', 'dataMax + 10']}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl">
                              {payload[0].value}P
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="stepAfter" 
                      dataKey="points" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPoints)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Binder Index Style Tabs */}
      <div className="flex items-end px-2">
        <button 
          onClick={() => setActiveStatsTab('wake-up')}
          className={`flex-1 py-3 px-1 text-[10px] font-black tracking-tighter rounded-t-2xl transition-all border-x border-t ${
            activeStatsTab === 'wake-up' 
              ? 'bg-white text-indigo-600 border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10 scale-105 origin-bottom' 
              : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'
          }`}
        >
          기상시각
        </button>
        <button 
          onClick={() => setActiveStatsTab('relative')}
          className={`flex-1 py-3 px-1 text-[10px] font-black tracking-tighter rounded-t-2xl transition-all border-x border-t ${
            activeStatsTab === 'relative' 
              ? 'bg-white text-violet-600 border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10 scale-105 origin-bottom' 
              : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'
          }`}
        >
          달성률
        </button>
        <button 
          onClick={() => setActiveStatsTab('absolute')}
          className={`flex-1 py-3 px-1 text-[10px] font-black tracking-tighter rounded-t-2xl transition-all border-x border-t ${
            activeStatsTab === 'absolute' 
              ? 'bg-white text-emerald-600 border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10 scale-105 origin-bottom' 
              : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'
          }`}
        >
          포인트
        </button>
      </div>

      <div className="bg-white rounded-b-3xl p-6 shadow-sm border-x border-b border-slate-100 min-h-[600px] -mt-[1px] z-0">
        {renderTabContent()}
      </div>
    </div>
  );
};
