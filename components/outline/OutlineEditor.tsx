'use client';

import { useState } from 'react';
import type { Outline, OutlineItem } from '@/lib/types';
import { CONTENT_TYPE_LABELS } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useFlowStore } from '@/lib/store/flowStore';

interface OutlineEditorProps {
  outline: Outline;
}

export function OutlineEditor({ outline: initialOutline }: OutlineEditorProps) {
  const [outline, setOutline] = useState<Outline>({
    ...initialOutline,
    items: initialOutline.items || [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const setOutlineStore = useFlowStore((s) => s.setOutline);
  const setStep = useFlowStore((s) => s.setStep);
  const addMessage = useFlowStore((s) => s.addMessage);
  const setGeneratedContent = useFlowStore((s) => s.setGeneratedContent);
  const setLoading = useFlowStore((s) => s.setLoading);
  const isLoading = useFlowStore((s) => s.isLoading);

  const handleEdit = (item: OutlineItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description);
  };

  const handleSave = (itemId: string) => {
    setOutline((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, title: editTitle, description: editDesc } : item
      ),
    }));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  // 修改大纲标题
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(outline.title);

  const handleTitleSave = () => {
    setOutline((prev) => ({ ...prev, title: titleText }));
    setEditingTitle(false);
  };

  const handleConfirm = async () => {
    if (isLoading) return;

    // 确保使用最新的大纲数据（包含所有修改）
    const finalOutline = { ...outline, title: titleText };
    setOutlineStore(finalOutline);
    setLoading(true);
    setStep('outline_confirmed');
    addMessage({ role: 'user', content: '大纲确认，开始生成内容' });

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline: finalOutline }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setGeneratedContent(data.content);
      setStep('content_ready');
      addMessage({
        role: 'assistant',
        content: '内容已生成，请预览确认：',
        attachment: { type: 'content', data: data.content },
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `内容生成失败：${error instanceof Error ? error.message : '未知错误'}，请重试。`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* 标题区域 - 可编辑 */}
        <div className="flex items-center justify-between gap-3">
          {editingTitle ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                className="flex-1 text-lg font-semibold border border-indigo-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button size="sm" onClick={handleTitleSave}>保存</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingTitle(false); setTitleText(outline.title); }}>取消</Button>
            </div>
          ) : (
            <h3
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {outline.title}
              <span className="ml-2 text-xs text-gray-400 font-normal">点击编辑</span>
            </h3>
          )}
          <Badge variant="info">{CONTENT_TYPE_LABELS[outline.contentType]}</Badge>
        </div>

        <div className="text-sm text-gray-500">
          目标受众：{outline.targetAudience} · 语调：{outline.tone}
        </div>

        {/* 大纲条目列表 - 可编辑 */}
        <div className="space-y-2">
          {outline.items
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <div key={item.id} className={`border rounded-lg p-3 transition-colors ${
                editingId === item.id ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200'
              }`}>
                {editingId === item.id ? (
                  /* 编辑模式 */
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{item.order}.</span>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 text-sm font-medium border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="条目标题"
                      />
                    </div>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows={3}
                      placeholder="条目描述"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(item.id)}>保存</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel}>取消</Button>
                    </div>
                  </div>
                ) : (
                  /* 展示模式 */
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">{item.order}.</span>
                        <span className="font-medium text-gray-800 text-sm">{item.title}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-xs text-gray-400 hover:text-indigo-600 transition-colors px-1 py-0.5 rounded hover:bg-indigo-50 flex-shrink-0"
                    >
                      编辑
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleConfirm} loading={isLoading}>
            确认大纲，生成内容
          </Button>
        </div>
      </div>
    </Card>
  );
}
