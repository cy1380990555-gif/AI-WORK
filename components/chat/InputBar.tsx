'use client';

import { useState, useRef, useEffect } from 'react';
import { useFlowStore } from '@/lib/store/flowStore';
import { Button } from '@/components/ui/Button';

interface InputBarProps {
  placeholder?: string;
  disabled?: boolean;
}

export function InputBar({ placeholder = '输入你的营销需求...', disabled = false }: InputBarProps) {
  const [input, setInput] = useState('帮我推广EX7电动摩托车');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addMessage = useFlowStore((s) => s.addMessage);
  const setStep = useFlowStore((s) => s.setStep);
  const setIntentResult = useFlowStore((s) => s.setIntentResult);
  const setLoading = useFlowStore((s) => s.setLoading);
  const isLoading = useFlowStore((s) => s.isLoading);
  const currentStep = useFlowStore((s) => s.currentStep);
  const reset = useFlowStore((s) => s.reset);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || isLoading) return;

    // 如果已完成分发，重置开始新一轮
    if (currentStep === 'published') {
      reset();
    }

    setInput('');
    addMessage({ role: 'user', content: trimmed });
    setLoading(true);
    setStep('idle');

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: trimmed }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setIntentResult(data.intent);
      setStep('intent_recognized');
      addMessage({
        role: 'assistant',
        content: `我理解了你的需求：${data.intent.summary}。以下是几个营销方向供你选择：`,
        attachment: { type: 'directions', data: data.directions },
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `意图识别失败：${error instanceof Error ? error.message : '未知错误'}，请重试。`,
      });
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || isLoading || !input.trim()}
          loading={isLoading}
          size="md"
        >
          发送
        </Button>
      </div>
    </div>
  );
}
