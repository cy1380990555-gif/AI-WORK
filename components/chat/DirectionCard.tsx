'use client';

import { useState } from 'react';
import type { Direction, ContentType } from '@/lib/types';
import { CONTENT_TYPE_LABELS, PLATFORM_COLORS, getContentCategory } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFlowStore } from '@/lib/store/flowStore';

interface DirectionCardProps {
  directions: Direction[];
  selectedType?: ContentType;
}

export function DirectionCard({ directions, selectedType }: DirectionCardProps) {
  const selectDirection = useFlowStore((s) => s.selectDirection);
  const setStep = useFlowStore((s) => s.setStep);
  const addMessage = useFlowStore((s) => s.addMessage);
  const intentResult = useFlowStore((s) => s.intentResult);
  const setOutline = useFlowStore((s) => s.setOutline);
  const setLoading = useFlowStore((s) => s.setLoading);
  const isLoading = useFlowStore((s) => s.isLoading);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = async (direction: Direction) => {
    if (isLoading) return;

    setSelectedId(direction.id);
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

  // 获取内容类型颜色
  const getTypeColor = (contentType: ContentType): string => {
    return PLATFORM_COLORS[contentType] || '#666666';
  };

  // 获取分类标签
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'short_form': return '短内容';
      case 'long_form': return '长内容';
      case 'video': return '视频';
      default: return '内容';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">选择一个营销方向：</p>
        {selectedType && (
          <Badge variant="info" style={{ backgroundColor: getTypeColor(selectedType), color: 'white' }}>
            当前类型：{CONTENT_TYPE_LABELS[selectedType]}
          </Badge>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {directions.map((direction) => {
          const isSelected = selectedId === direction.id;
          const typeColor = getTypeColor(direction.contentType);
          const category = getContentCategory(direction.contentType);

          return (
            <Card
              key={direction.id}
              hoverable
              onClick={() => handleSelect(direction)}
              className={`relative transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-offset-2 border-transparent'
                  : 'hover:shadow-md'
              }`}
              style={isSelected ? { ringColor: typeColor } : {}}
            >
              {/* 选中状态指示器 */}
              {isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: typeColor }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="space-y-2">
                {/* 类型标签和标题 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{direction.title}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {/* 内容类型标签 - 使用平台品牌色 */}
                    <span
                      className="inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: typeColor }}
                    >
                      {CONTENT_TYPE_LABELS[direction.contentType]}
                    </span>
                    {/* 分类标签 */}
                    <Badge variant="default" size="sm">
                      {getCategoryLabel(category)}
                    </Badge>
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-sm text-gray-600 line-clamp-3">{direction.description}</p>

                {/* 适用信息 */}
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span>适合：{direction.suitableFor}</span>
                </div>

                {/* 目标受众 */}
                <div className="text-xs text-gray-500">
                  受众：{direction.targetAudience}
                </div>

                {/* 选中按钮 */}
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'secondary'}
                  className={`w-full ${isSelected ? '' : 'hover:border-current'}`}
                  style={isSelected ? { backgroundColor: typeColor, borderColor: typeColor } : {}}
                >
                  {isSelected ? '已选择' : '选择此方向'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
