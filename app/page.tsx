'use client';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { useFlowStore } from '@/lib/store/flowStore';
import { CONTENT_TYPE_LABELS, type FlowStep } from '@/lib/types';

const STEP_LABELS: Record<FlowStep, string> = {
  idle: '输入需求',
  intent_recognized: '选择方向',
  direction_chosen: '生成大纲',
  outline_confirmed: '生成内容',
  content_ready: '预览确认',
  publishing: '分发中',
  published: '已完成',
};

const STEPS_ORDER: FlowStep[] = [
  'idle',
  'intent_recognized',
  'direction_chosen',
  'outline_confirmed',
  'content_ready',
  'publishing',
  'published',
];

export default function Home() {
  const currentStep = useFlowStore((s) => s.currentStep);

  const currentStepIndex = STEPS_ORDER.indexOf(currentStep);

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">AI 营销工作台</h1>
        </div>

        {/* 流程进度条 */}
        <div className="hidden md:flex items-center gap-1">
          {STEPS_ORDER.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${isActive ? 'bg-indigo-100 text-indigo-700' : ''}
                  ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}
                `}>
                  {isCompleted && (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  )}
                  {STEP_LABELS[step]}
                </div>
                {index < STEPS_ORDER.length - 1 && (
                  <svg className="w-4 h-4 text-gray-300 mx-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          <ChatContainer />
        </div>
      </main>
    </div>
  );
}
