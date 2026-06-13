import { NextRequest, NextResponse } from 'next/server';
import { getAIAdapter } from '@/lib/ai/adapter';
import { buildOutlinePrompt } from '@/lib/ai/prompts';
import type { Outline } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { intent, direction } = await request.json();

    if (!intent || !direction) {
      return NextResponse.json({ error: '缺少意图或方向信息' }, { status: 400 });
    }

    const ai = getAIAdapter();
    const messages = buildOutlinePrompt(
      intent.intent || intent,
      direction.title,
      direction.description,
      direction.contentType,
      direction.targetAudience
    );

    const outline = await ai.chatJSON<Outline>(messages);

    return NextResponse.json({ outline });
  } catch (error) {
    console.error('Outline API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '大纲生成失败' },
      { status: 500 }
    );
  }
}
