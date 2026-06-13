'use client';

import { useState } from 'react';
import type { GeneratedContent } from '@/lib/types';
import { CONTENT_TYPE_LABELS } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { useFlowStore } from '@/lib/store/flowStore';

interface ContentPreviewProps {
  content: GeneratedContent;
}

export function ContentPreview({ content: initialContent }: ContentPreviewProps) {
  const [content, setContent] = useState<GeneratedContent>(initialContent);
  const [editingBody, setEditingBody] = useState(false);
  const [editBody, setEditBody] = useState(initialContent.body);
  const [editingCTA, setEditingCTA] = useState(false);
  const [editCTA, setEditCTA] = useState(initialContent.callToAction);

  const setStep = useFlowStore((s) => s.setStep);
  const addMessage = useFlowStore((s) => s.addMessage);
  const setGeneratedContent = useFlowStore((s) => s.setGeneratedContent);
  const setLoading = useFlowStore((s) => s.setLoading);
  const isLoading = useFlowStore((s) => s.isLoading);

  const handleRegenerate = async () => {
    if (isLoading) return;

    setLoading(true);
    addMessage({ role: 'user', content: '请按修改后的描述重新生成内容' });

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline: content }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const updatedContent = { ...data.content, body: editBody, callToAction: editCTA };
      setContent(updatedContent);
      setGeneratedContent(updatedContent);
      setEditingBody(false);
      setEditingCTA(false);

      addMessage({ role: 'assistant', content: '已按你的修改重新生成内容，请确认：' });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `重新生成失败：${error instanceof Error ? error.message : '未知错误'}，请重试。`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (isLoading) return;

    const finalContent = { ...content, body: editBody, callToAction: editCTA };
    setGeneratedContent(finalContent);
    setStep('content_ready');
    addMessage({ role: 'user', content: '内容确认，准备分发' });

    // 进入分发选择阶段
    addMessage({
      role: 'assistant',
      content: '请选择要分发的社媒渠道：',
      attachment: { type: 'publish', data: { channels: [], tasks: [], allDone: false } },
    });
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
          <Badge variant="info">{CONTENT_TYPE_LABELS[content.contentType]}</Badge>
        </div>

        {/* 正文内容 - 可编辑 */}
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          {editingBody ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full h-48 text-sm border border-indigo-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          ) : (
            <div className="cursor-pointer" onClick={() => setEditingBody(true)}>
              <MarkdownRenderer content={editBody} />
              <p className="text-xs text-gray-400 mt-1">点击编辑正文</p>
            </div>
          )}
        </div>

        {/* 图片 */}
        {content.images && content.images.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">配图</p>
            <div className="grid grid-cols-3 gap-2">
              {content.images.map((img, i) => (
                <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={img}
                    alt={`配图 ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).alt = '图片加载失败';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 标签 */}
        {content.hashtags && content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.hashtags.map((tag, i) => (
              <Badge key={i} variant="default">#{tag}</Badge>
            ))}
          </div>
        )}

        {/* 行动号召 - 可编辑 */}
        <div className="bg-indigo-50 rounded-lg px-3 py-2">
          {editingCTA ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editCTA}
                onChange={(e) => setEditCTA(e.target.value)}
                className="flex-1 text-sm border border-indigo-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button size="sm" onClick={() => setEditingCTA(false)}>完成</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingCTA(false)}>取消</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingCTA(true)}>
              <span className="text-sm text-indigo-700 font-medium">行动号召：</span>
              <span className="text-sm text-indigo-600">{editCTA}</span>
              <span className="text-xs text-gray-400 ml-auto">点击编辑</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={handleRegenerate} loading={isLoading}>
            按修改后的描述重新生成
          </Button>
          <Button onClick={handleConfirm} variant="secondary">
            确认内容，选择分发渠道
          </Button>
        </div>
      </div>
    </Card>
  );
}
