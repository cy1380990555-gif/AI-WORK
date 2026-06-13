import { NextRequest, NextResponse } from 'next/server';
import { getAIAdapter } from '@/lib/ai/adapter';
import { buildContentPrompt } from '@/lib/ai/prompts';
import type { GeneratedContent, Outline } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { outline } = await request.json();

    if (!outline) {
      return NextResponse.json({ error: '缺少大纲信息' }, { status: 400 });
    }

    const typedOutline = outline as Outline;
    const ai = getAIAdapter();

    const outlineItemsText = typedOutline.items
      .sort((a, b) => a.order - b.order)
      .map((item) => `${item.order}. ${item.title}: ${item.description}`)
      .join('\n');

    const messages = buildContentPrompt(
      typedOutline.title,
      outlineItemsText,
      typedOutline.contentType,
      typedOutline.tone,
      typedOutline.targetAudience
    );

    const content = await ai.chatJSON<GeneratedContent>(messages);

    // 为图片描述生成占位图片URL
    const contentWithImages: GeneratedContent = {
      ...content,
      images: content.images?.map((desc, i) =>
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(desc)}&image_size=landscape_16_9&_index=${i}`
      ) || [],
    };

    return NextResponse.json({ content: contentWithImages });
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内容生成失败' },
      { status: 500 }
    );
  }
}
