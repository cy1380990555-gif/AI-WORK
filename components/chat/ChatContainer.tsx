'use client';

import { useRef, useEffect } from 'react';
import { useFlowStore } from '@/lib/store/flowStore';
import { MessageItem } from './MessageItem';
import { InputBar } from './InputBar';
import { Spinner } from '@/components/ui/Spinner';

export function ChatContainer() {
  const messages = useFlowStore((s) => s.messages);
  const isLoading = useFlowStore((s) => s.isLoading);
  const currentStep = useFlowStore((s) => s.currentStep);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPlaceholder = () => {
    if (isLoading) return 'AI 正在思考...';
    switch (currentStep) {
      case 'idle': return '描述你的营销需求，例如：帮我推广一款新茶饮...';
      case 'intent_recognized': return '请从上方选择一个营销方向';
      case 'direction_chosen': return '正在生成大纲...';
      case 'outline_confirmed': return '正在生成内容...';
      case 'content_ready': return '预览内容后确认分发';
      case 'publishing': return '正在分发...';
      case 'published': return '分发完成！输入新需求开始新一轮';
      default: return '输入你的营销需求...';
    }
  };

  const inputDisabled = isLoading || 
    currentStep === 'intent_recognized' || 
    currentStep === 'direction_chosen' || 
    currentStep === 'outline_confirmed' ||
    currentStep === 'publishing';

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">AI 营销工作台</h2>
            <p className="text-gray-500 max-w-sm">描述你的营销需求，AI 将帮你完成从策划到分发的全流程</p>
            <p className="text-indigo-500 text-sm mt-2">试试输入"帮我推广EX7车型"</p>
          </div>
        )}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Spinner size="sm" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-gray-500">思考中...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入栏 */}
      <InputBar placeholder={getPlaceholder()} disabled={inputDisabled} />
    </div>
  );
}
