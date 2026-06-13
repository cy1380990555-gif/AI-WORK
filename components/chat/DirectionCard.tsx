'use client';

import type { Direction } from '@/lib/types';
import { CONTENT_TYPE_LABELS } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useFlowStore } from '@/lib/store/flowStore';

interface DirectionCardProps {
  directions: Direction[];
}

export function DirectionCard({ directions }: DirectionCardProps) {
  const selectDirection = useFlowStore((s) => s.selectDirection);
  const setStep = useFlowStore((s) => s.setStep);
  const addMessage = useFlowStore((s) => s.addMessage);
  const intentResult = useFlowStore((s) => s.intentResult);
  const setOutline = useFlowStore((s) => s.setOutline);
  const setLoading = useFlowStore((s) => s.setLoading);
  const isLoading = useFlowStore((s) => s.isLoading);

  const handleSelect = async (direction: Direction) => {
    if (isLoading) return;

    selectDirection(direction);
    addMessage({ role: 'user', content: `我选择方向：${direction.title}` });
    setLoading(true);
    setStep('direction_chosen');

    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intentResult, direction }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setOutline(data.outline);
      setStep('outline_confirmed');
      addMessage({
        role: 'assistant',
        content: `已基于「${direction.title}」方向生成内容大纲，请查看并确认：`,
        attachment: { type: 'outline', data: data.outline },
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `大纲生成失败：${error instanceof Error ? error.message : '未知错误'}，请重试。`,
      });
      setStep('intent_recognized');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-600 mb-2">选择一个营销方向：</p>
      {directions.map((direction) => (
        <Card key={direction.id} hoverable onClick={() => handleSelect(direction)}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{direction.title}</h3>
              <Badge variant="info">{CONTENT_TYPE_LABELS[direction.contentType]}</Badge>
            </div>
            <p className="text-sm text-gray-600">{direction.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>适合：{direction.suitableFor}</span>
              <span>·</span>
              <span>受众：{direction.targetAudience}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
