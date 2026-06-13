import { NextRequest, NextResponse } from 'next/server';
import { getAIAdapter } from '@/lib/ai/adapter';
import { buildIntentPrompt, buildDirectionPrompt } from '@/lib/ai/prompts';
import type { IntentResult, Direction } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json({ error: '请提供营销需求描述' }, { status: 400 });
    }

    const ai = getAIAdapter();
    const isMock = (process.env.AI_PROVIDER || 'mock') === 'mock';

    if (isMock) {
      // Mock 模式：chatJSON 直接返回完整数据
      const intentMessages = buildIntentPrompt(userInput);
      const mockResult = await ai.chatJSON<{ intent: IntentResult; directions: Direction[] }>(intentMessages);
      return NextResponse.json(mockResult);
    }

    // Step 1: 意图识别
    const intentMessages = buildIntentPrompt(userInput);
    const intentResult = await ai.chatJSON<IntentResult>(intentMessages);

    // Step 2: 基于意图生成方向选项
    const directionMessages = buildDirectionPrompt(
      intentResult.intent,
      intentResult.targetAudience,
      intentResult.contentType
    );
    const directions = await ai.chatJSON<Direction[]>(directionMessages);

    return NextResponse.json({
      intent: intentResult,
      directions,
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 服务调用失败' },
      { status: 500 }
    );
  }
}
