import React from 'react';
import { AlertCircle } from 'lucide-react';

export const KoreanJosaGuide: React.FC = () => {
  return (
    <div className="space-y-1.5 pt-1 border-t border-indigo-200/50 dark:border-indigo-900/40">
      <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
        <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 한글 조사 자동 교정
      </h3>
      <div className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-300/80 leading-relaxed">
        {"{{title}}"}나 {"{{purpose}}"}, {"{{userName}}"} 뒤에 '이/가'와 같이 슬래시(/)로 구분된 조사를 사용하면 받침 유무에 따라 알맞게 교정됩니다. 예를 들어, "{"{{title}}"}을/를 해냈다"라고 입력하시면, "운동을 해냈다" 또는 "피아노치기를 해냈다"와 같이 자연스러운 조사가 출력됩니다.
        <p className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-300/80 leading-relaxed mt-1">
          * 지원: 은/는, 이/가, 을/를, 으로/로, 이죠/죠, 이다/다
        </p>
      </div>
    </div>
  );
};
