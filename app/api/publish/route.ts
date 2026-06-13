import { NextRequest, NextResponse } from 'next/server';
import type { Channel, PublishTask, GeneratedContent } from '@/lib/types';

// 模拟社媒分发（MVP阶段）
export async function POST(request: NextRequest) {
  try {
    const { content, channels, enableTracking = true } = await request.json();

    if (!content || !channels || !Array.isArray(channels)) {
      return NextResponse.json({ error: '缺少内容或渠道信息' }, { status: 400 });
    }

    const typedContent = content as GeneratedContent;
    const typedChannels = channels as Channel[];

    // 模拟分发过程
    const tasks: PublishTask[] = await Promise.all(
      typedChannels.map(async (channel) => {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

        // 模拟 90% 成功率
        const success = Math.random() > 0.1;

        return {
          channel,
          status: success ? 'success' : 'failed',
          url: success ? generateMockUrl(channel) : undefined,
          error: success ? undefined : '发布失败，请稍后重试',
          publishedAt: success ? Date.now() : undefined,
          trackingId: success ? `trk_${channel}_${Date.now()}_${Math.random().toString(36).substring(7)}` : undefined,
          trackingEnabled: enableTracking && success,
          metrics: enableTracking && success ? generateMockMetrics() : undefined,
        };
      })
    );

    const allDone = tasks.every((t) => t.status === 'success' || t.status === 'failed');

    return NextResponse.json({
      tasks,
      allDone,
      summary: {
        total: tasks.length,
        success: tasks.filter((t) => t.status === 'success').length,
        failed: tasks.filter((t) => t.status === 'failed').length,
      },
    });
  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '分发失败' },
      { status: 500 }
    );
  }
}

// 生成模拟数据指标
function generateMockMetrics() {
  const impressions = Math.floor(Math.random() * 5000) + 1000;
  const clicks = Math.floor(Math.random() * 500) + 50;
  const likes = Math.floor(Math.random() * 100) + 10;
  const shares = Math.floor(Math.random() * 30) + 2;
  const comments = Math.floor(Math.random() * 20) + 1;
  const conversionRate = Number((Math.random() * 3).toFixed(2));

  return {
    impressions,
    clicks,
    likes,
    shares,
    comments,
    conversionRate,
  };
}

function generateMockUrl(channel: Channel): string {
  const urls: Record<Channel, string> = {
    xiaohongshu: 'https://www.xiaohongshu.com/explore/',
    douyin: 'https://www.douyin.com/video/',
    wechat: 'https://mp.weixin.qq.com/s/',
    weibo: 'https://weibo.com/',
  };
  return urls[channel] + Math.random().toString(36).substring(2, 10);
}
