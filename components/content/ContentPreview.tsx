'use client';

import { useState } from 'react';
import type { GeneratedContent, ContentType } from '@/lib/types';
import { CONTENT_TYPE_LABELS, PLATFORM_COLORS, getContentCategory } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Spinner } from '@/components/ui/Spinner';
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
  const [editingDescription, setEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const setStep = useFlowStore((s) => s.setStep);
  const addMessage = useFlowStore((s) => s.addMessage);
  const setGeneratedContent = useFlowStore((s) => s.setGeneratedContent);
  const setLoading = useFlowStore((s) => s.setLoading);
  const isLoading = useFlowStore((s) => s.isLoading);
  const outline = useFlowStore((s) => s.outline);

  const category = getContentCategory(content.contentType);
  const typeColor = PLATFORM_COLORS[content.contentType] || '#666666';

  // 显示 Toast 提示
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateDescription = async () => {
    if (!editDescription.trim() || !outline || isRegenerating) return;

    setIsRegenerating(true);
    setLoading(true);

    try {
      addMessage({ role: 'user', content: `我修改了描述：${editDescription}` });

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, description: editDescription }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const updatedContent = {
        ...data.content,
        body: editBody,
        callToAction: editCTA,
      };

      setContent(updatedContent);
      setGeneratedContent(updatedContent);
      setEditingDescription(false);
      setEditDescription('');
      showToastMessage('内容已更新');

      addMessage({
        role: 'assistant',
        content: '已根据新的描述重新生成内容，请查看：',
        attachment: { type: 'content', data: updatedContent },
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `更新失败：${error instanceof Error ? error.message : '未知错误'}，请重试。`,
      });
    } finally {
      setIsRegenerating(false);
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (isLoading || isRegenerating) return;

    setLoading(true);
    addMessage({ role: 'user', content: '请按修改后的描述重新生成内容' });

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, description: editDescription }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const updatedContent = { ...data.content, body: editBody, callToAction: editCTA };
      setContent(updatedContent);
      setGeneratedContent(updatedContent);
      setEditingBody(false);
      setEditingCTA(false);
      setEditingDescription(false);
      setEditDescription('');
      showToastMessage('内容已重新生成');
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `重新生成失败：${error instanceof Error ? error.message : '未知错误'}，请重试。`,
      });
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (isLoading || isRegenerating) return;

    const finalContent = { ...content, body: editBody, callToAction: editCTA };
    setGeneratedContent(finalContent);
    setStep('content_ready');
    addMessage({ role: 'user', content: '内容确认，准备分发' });
    showToastMessage('内容已确认');

    // 进入分发选择阶段
    addMessage({
      role: 'assistant',
      content: '请选择要分发的社媒渠道：',
      attachment: { type: 'publish', data: { channels: [], tasks: [], allDone: false } },
    });
  };

  const handleSaveOutline = () => {
    setEditingBody(false);
    const updatedContent = { ...content, body: editBody, callToAction: editCTA };
    setContent(updatedContent);
    setGeneratedContent(updatedContent);
    showToastMessage('大纲已保存');
  };

  // 视频脚本预览
  const renderVideoPreview = () => {
    const videoDesc = content.videoDescription || content.body;
    return (
      <div className="space-y-4">
        {/* 视频脚本描述 */}
        <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
          {editingBody ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full h-64 text-sm border border-indigo-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              placeholder="编辑视频脚本描述..."
            />
          ) : (
            <div className="cursor-pointer" onClick={() => setEditingBody(true)}>
              <MarkdownRenderer content={videoDesc} />
              <p className="text-xs text-gray-400 mt-2">点击编辑视频脚本</p>
            </div>
          )}
        </div>

        {/* 视频信息卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">预计时长</p>
            <p className="text-sm text-blue-800">30-60 秒</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">镜头数量</p>
            <p className="text-sm text-green-800">3-5 个</p>
          </div>
        </div>
      </div>
    );
  };

  // 长文文章预览
  const renderLongFormPreview = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          {editingBody ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full h-80 text-sm border border-indigo-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-serif"
              placeholder="编辑文章内容..."
            />
          ) : (
            <div className="cursor-pointer" onClick={() => setEditingBody(true)}>
              <MarkdownRenderer content={editBody} />
              <p className="text-xs text-gray-400 mt-2">点击编辑文章内容</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>字数：{editBody.length}</span>
          <span>·</span>
          <span>建议长度：2000-5000字</span>
        </div>
      </div>
    );
  };

  // 图文预览
  const renderShortFormPreview = () => {
    return (
      <div className="space-y-4">
        {/* 正文内容 */}
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          {editingBody ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full h-48 text-sm border border-indigo-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              placeholder="编辑内容..."
            />
          ) : (
            <div className="cursor-pointer" onClick={() => setEditingBody(true)}>
              <MarkdownRenderer content={editBody} />
              <p className="text-xs text-gray-400 mt-1">点击编辑正文</p>
            </div>
          )}
        </div>

        {/* 配图 */}
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
      </div>
    );
  };

  return (
    <Card>
      {/* Toast 提示 */}
      {showToast && (
        <div
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300"
          style={{ opacity: showToast ? 1 : 0 }}
        >
          {toastMessage}
        </div>
      )}

      <div className="space-y-4">
        {/* 标题和类型 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
          <div className="flex items-center gap-2">
            <span
              className="inline-block px-2 py-1 text-xs font-medium text-white rounded-full"
              style={{ backgroundColor: typeColor }}
            >
              {CONTENT_TYPE_LABELS[content.contentType]}
            </span>
          </div>
        </div>

        {/* 根据内容类型显示不同的预览 */}
        {category === 'video' && renderVideoPreview()}
        {category === 'long_form' && renderLongFormPreview()}
        {category === 'short_form' && renderShortFormPreview()}

        {/* 标签 */}
        {content.hashtags && content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.hashtags.map((tag, i) => (
              <Badge key={i} variant="default">#{tag}</Badge>
            ))}
          </div>
        )}

        {/* 修改描述区域 */}
        <div className="bg-orange-50 rounded-lg px-4 py-3 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-orange-700">✨ 描述调整</span>
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">可选</span>
          </div>
          {editingDescription ? (
            <div className="space-y-2">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="请输入您希望调整的内容方向，例如：更强调续航能力、突出智能功能等"
                className="w-full h-24 text-sm border border-orange-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdateDescription} loading={isRegenerating}>
                  确认调整
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>
                  取消
                </Button>
              </div>
              <p className="text-xs text-orange-600">
                💡 提示：输入修改描述后，系统会根据新的描述重新生成内容
              </p>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer text-orange-700 hover:text-orange-800 transition-colors"
              onClick={() => setEditingDescription(true)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium">添加修改描述，调整内容方向</span>
              <span className="text-xs text-orange-500 ml-auto">点击编辑</span>
            </div>
          )}
        </div>

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
          <Button onClick={handleRegenerate} loading={isRegenerating || isLoading}>
            按修改后的描述重新生成
          </Button>
          <Button onClick={handleSaveOutline} variant="secondary">
            保存大纲
          </Button>
          <Button onClick={handleConfirm} variant="secondary" disabled={isRegenerating}>
            确认内容，选择分发渠道
          </Button>
        </div>
      </div>
    </Card>
  );
}
