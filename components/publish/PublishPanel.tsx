'use client';

import { useState } from 'react';
import type { PublishState, Channel, PublishTask } from '@/lib/types';
import { CHANNEL_CONFIG } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useFlowStore } from '@/lib/store/flowStore';

interface PublishPanelProps {
  publishState: PublishState;
}

export function PublishPanel({ publishState: initialPublishState }: PublishPanelProps) {
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const generatedContent = useFlowStore((s) => s.generatedContent);
  const setStep = useFlowStore((s) => s.setStep);
  const setPublishState = useFlowStore((s) => s.setPublishState);
  const addMessage = useFlowStore((s) => s.addMessage);
  const reset = useFlowStore((s) => s.reset);

  const channels = Object.values(CHANNEL_CONFIG).filter((c) => c.supported);

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handlePublish = async () => {
    if (selectedChannels.length === 0 || !generatedContent) return;

    setIsPublishing(true);
    setStep('publishing');

    // 初始化任务状态
    const initialTasks: PublishTask[] = selectedChannels.map((channel) => ({
      channel,
      status: 'publishing',
    }));
    setTasks(initialTasks);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generatedContent, channels: selectedChannels }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setTasks(data.tasks);
      setAllDone(data.allDone);
      setPublishState({ channels: selectedChannels, tasks: data.tasks, allDone: data.allDone });
      setStep('published');

      const successCount = data.summary.success;
      const failCount = data.summary.failed;
      addMessage({
        role: 'assistant',
        content: `分发完成！成功 ${successCount} 个渠道${failCount > 0 ? `，失败 ${failCount} 个` : ''}。`,
      });
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `分发失败：${error instanceof Error ? error.message : '未知错误'}`,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleNewRound = () => {
    reset();
  };

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">选择分发渠道</h3>

        {/* 渠道选择 */}
        <div className="grid grid-cols-2 gap-2">
          {channels.map((channel) => {
            const isSelected = selectedChannels.includes(channel.id);
            const task = tasks.find((t) => t.channel === channel.id);

            return (
              <div
                key={channel.id}
                onClick={() => !isPublishing && !allDone && toggleChannel(channel.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}
                  ${(isPublishing || allDone) ? 'pointer-events-none' : ''}
                `}
              >
                <span className="text-2xl">{channel.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{channel.name}</p>
                  <p className="text-xs text-gray-400">最多{channel.maxImages}张图 · {channel.maxTextLength}字</p>
                </div>
                {task && (
                  <div>
                    {task.status === 'publishing' && <Spinner size="sm" />}
                    {task.status === 'success' && <Badge variant="success">成功</Badge>}
                    {task.status === 'failed' && <Badge variant="error">失败</Badge>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 操作按钮 */}
        {!allDone ? (
          <Button
            onClick={handlePublish}
            disabled={selectedChannels.length === 0}
            loading={isPublishing}
          >
            分发到 {selectedChannels.length} 个渠道
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleNewRound}>
              开始新一轮
            </Button>
          </div>
        )}

        {/* 分发结果 */}
        {tasks.length > 0 && allDone && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">分发结果：</p>
            {tasks.map((task) => (
              <div key={task.channel} className="flex items-center justify-between text-sm">
                <span>{CHANNEL_CONFIG[task.channel].icon} {CHANNEL_CONFIG[task.channel].name}</span>
                {task.status === 'success' ? (
                  <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    查看链接
                  </a>
                ) : (
                  <span className="text-red-500">{task.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
