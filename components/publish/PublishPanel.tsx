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
  const [enableTracking, setEnableTracking] = useState(true); // 是否启用数据跟踪
  const [autoRefresh, setAutoRefresh] = useState(true); // 是否自动刷新数据

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

    // 初始化任务状态，添加数据跟踪配置
    const initialTasks: PublishTask[] = selectedChannels.map((channel) => ({
      channel,
      status: 'publishing',
      trackingEnabled: enableTracking,
      trackingId: `trk_${channel}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    }));
    setTasks(initialTasks);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generatedContent, channels: selectedChannels, enableTracking }),
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
        content: `分发完成！成功 ${successCount} 个渠道${failCount > 0 ? `，失败 ${failCount} 个` : ''}。${enableTracking ? '已启用数据跟踪监测' : ''}。`,
      });

      // 如果启用自动刷新，开始模拟数据更新
      if (enableTracking && autoRefresh) {
        startTrackingSimulation(data.tasks);
      }
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `分发失败：${error instanceof Error ? error.message : '未知错误'}`,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 模拟数据跟踪更新
  const startTrackingSimulation = (initialTasks: PublishTask[]) => {
    addMessage({
      role: 'assistant',
      content: '📊 数据跟踪已启动，正在收集各渠道实时数据...',
    });

    // 每隔一段时间模拟数据更新
    let updateCount = 0;
    const maxUpdates = 5;
    const interval = setInterval(() => {
      updateCount++;
      
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.status !== 'success' || !task.trackingEnabled) return task;

          // 模拟数据增长
          const metrics = task.metrics || {};
          return {
            ...task,
            metrics: {
              impressions: (metrics.impressions || 0) + Math.floor(Math.random() * 1000) + 500,
              clicks: (metrics.clicks || 0) + Math.floor(Math.random() * 50) + 10,
              likes: (metrics.likes || 0) + Math.floor(Math.random() * 20) + 5,
              shares: (metrics.shares || 0) + Math.floor(Math.random() * 10) + 1,
              comments: (metrics.comments || 0) + Math.floor(Math.random() * 5) + 1,
              conversionRate: Number(((metrics.conversionRate || 0) + Math.random() * 0.5).toFixed(2)),
            },
          };
        })
      );

      // 更新完成后通知
      if (updateCount >= maxUpdates) {
        clearInterval(interval);
        addMessage({
          role: 'assistant',
          content: '📈 数据跟踪监测完成，当前各渠道数据已更新。点击查看详细分析。',
        });
      }
    }, 3000); // 每 3 秒更新一次
  };

  const handleNewRound = () => {
    reset();
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">选择分发渠道</h3>
          {allDone && tasks.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTracking}
                  onChange={(e) => setEnableTracking(e.target.checked)}
                  disabled={isPublishing}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={enableTracking ? 'text-indigo-700' : 'text-gray-500'}>数据跟踪</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  disabled={!enableTracking || isPublishing}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={autoRefresh ? 'text-indigo-700' : 'text-gray-500'}>自动刷新</span>
              </label>
            </div>
          )}
        </div>

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
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">分发结果：</p>
            {tasks.map((task) => (
              <div key={task.channel} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{CHANNEL_CONFIG[task.channel].icon}</span>
                    <span className="font-medium text-sm">{CHANNEL_CONFIG[task.channel].name}</span>
                    {task.trackingEnabled && (
                      <Badge variant="info" className="text-xs">数据跟踪已启用</Badge>
                    )}
                  </div>
                  {task.status === 'success' ? (
                    <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm">
                      查看链接
                    </a>
                  ) : (
                    <span className="text-red-500 text-sm">{task.error}</span>
                  )}
                </div>

                {/* 数据跟踪指标 */}
                {task.status === 'success' && task.trackingEnabled && task.metrics && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">曝光量</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        {task.metrics.impressions?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">点击量</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {task.metrics.clicks?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">互动数</p>
                      <p className="text-lg font-semibold text-green-600">
                        {(task.metrics.likes || 0) + (task.metrics.shares || 0) + (task.metrics.comments || 0)}
                      </p>
                    </div>
                    {task.metrics.conversionRate && (
                      <div className="col-span-3 text-center pt-1">
                        <p className="text-xs text-gray-500">预估转化率</p>
                        <p className="text-base font-semibold text-purple-600">
                          {task.metrics.conversionRate}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 未启用数据跟踪 */}
                {task.status === 'success' && !task.trackingEnabled && (
                  <div className="pt-2 text-center text-xs text-gray-400">
                    数据跟踪未启用
                  </div>
                )}
              </div>
            ))}

            {/* 数据跟踪统计摘要 */}
            {tasks.some((t) => t.trackingEnabled && t.metrics) && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm font-semibold text-indigo-800">数据跟踪总览</p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">总曝光</p>
                    <p className="text-sm font-bold text-indigo-600">
                      {tasks.reduce((sum, t) => sum + (t.metrics?.impressions || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">总点击</p>
                    <p className="text-sm font-bold text-orange-600">
                      {tasks.reduce((sum, t) => sum + (t.metrics?.clicks || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">总互动</p>
                    <p className="text-sm font-bold text-green-600">
                      {tasks.reduce((sum, t) => sum + (t.metrics?.likes || 0) + (t.metrics?.shares || 0) + (t.metrics?.comments || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">平均转化</p>
                    <p className="text-sm font-bold text-purple-600">
                      {tasks.filter(t => t.metrics?.conversionRate).length > 0
                        ? (tasks.reduce((sum, t) => sum + (t.metrics?.conversionRate || 0), 0) / tasks.filter(t => t.metrics?.conversionRate).length).toFixed(1) + '%'
                        : '0%'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
