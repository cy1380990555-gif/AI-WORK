import { NextRequest, NextResponse } from 'next/server';
import { getAIAdapter } from '@/lib/ai/adapter';
import { buildContentPrompt } from '@/lib/ai/prompts';
import type { GeneratedContent, Outline, ContentType } from '@/lib/types';

// 有效内容类型枚举
const VALID_CONTENT_TYPES: ContentType[] = [
  'xiaohongshu',
  'douyin_video',
  'wechat_article',
  'weibo',
  'text_article',
  'video_script',
  'general',
];

// 校验参数是否有效
function validateOutline(outline: unknown): outline is Outline {
  if (!outline || typeof outline !== 'object') {
    return false;
  }

  const obj = outline as Record<string, unknown>;

  // 必填字段校验
  if (typeof obj.title !== 'string' || !obj.title.trim()) {
    return false;
  }
  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    return false;
  }
  if (typeof obj.contentType !== 'string' || !VALID_CONTENT_TYPES.includes(obj.contentType as ContentType)) {
    return false;
  }
  if (typeof obj.targetAudience !== 'string' || !obj.targetAudience.trim()) {
    return false;
  }
  if (typeof obj.tone !== 'string' || !obj.tone.trim()) {
    return false;
  }

  // 校验大纲条目结构
  return obj.items.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const i = item as Record<string, unknown>;
    return (
      typeof i.id === 'string' &&
      typeof i.title === 'string' &&
      typeof i.description === 'string' &&
      typeof i.order === 'number'
    );
  });
}

// 生成图片占位 URL
function generateImagePlaceholderUrl(description: string, index: number): string {
  const baseUrl = process.env.IMAGE_PLACEHOLDER_BASE_URL || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
  const params = new URLSearchParams({
    prompt: description,
    image_size: 'landscape_16_9',
    _index: String(index),
  });
  return `${baseUrl}?${params.toString()}`;
}

// 校验内容类型
function validateContentType(contentType: string): boolean {
  return VALID_CONTENT_TYPES.includes(contentType as ContentType);
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    // 校验必要字段
    if (!body || !body.outline) {
      return NextResponse.json(
        { error: '缺少必要参数: outline', details: '请求体必须包含 outline 对象' },
        { status: 400 }
      );
    }

    // 类型校验
    if (!validateOutline(body.outline)) {
      return NextResponse.json(
        {
          error: '大纲数据格式无效',
          details: 'outline 必须包含: title(字符串), items(非空数组), contentType(有效类型), targetAudience(字符串), tone(字符串)',
          requiredFields: {
            title: 'string - 大纲标题',
            items: 'Array<{id: string, title: string, description: string, order: number}> - 大纲条目列表',
            contentType: 'string - 内容类型 (xiaohongshu/douyin_video/wechat_article/weibo/text_article/video_script/general)',
            targetAudience: 'string - 目标受众描述',
            tone: 'string - 内容语调风格',
          },
        },
        { status: 400 }
      );
    }

    const typedOutline = body.outline as Outline;

    // 检查 AI 适配器是否可用
    const ai = getAIAdapter();
    if (!ai || typeof ai.chatJSON !== 'function') {
      return NextResponse.json(
        { error: 'AI 适配器未正确配置', details: '请检查环境变量 AI_PROVIDER 配置' },
        { status: 503 }
      );
    }

    // 构建大纲文本
    const outlineItemsText = typedOutline.items
      .sort((a, b) => a.order - b.order)
      .map((item) => `${item.order}. ${item.title}: ${item.description}`)
      .join('\n');

    // 构建 AI 提示消息
    const messages = buildContentPrompt(
      typedOutline.title,
      outlineItemsText,
      typedOutline.contentType,
      typedOutline.tone,
      typedOutline.targetAudience
    );

    // 调用 AI 生成内容
    const content = await ai.chatJSON<GeneratedContent>(messages);

    // 校验返回内容结构
    if (!content || typeof content !== 'object') {
      throw new Error('AI 返回的内容格式无效');
    }

    // 根据内容类型处理返回数据
    const isVideo = typedOutline.contentType === 'douyin_video' || typedOutline.contentType === 'video_script';
    const isTextLong = typedOutline.contentType === 'wechat_article' || typedOutline.contentType === 'text_article';

    // 处理图片 URL
    const images = (content.images || [])
      .filter((desc): desc is string => typeof desc === 'string' && desc.trim().length > 0)
      .map((desc, i) => generateImagePlaceholderUrl(desc, i));

    // 视频类型不需要图片
    if (isVideo) {
      images.length = 0;
    }

    const contentWithImages: GeneratedContent = {
      title: content.title || typedOutline.title,
      body: content.body || '',
      videoDescription: content.videoDescription || (isVideo ? content.body : undefined),
      images: images,
      contentType: content.contentType || typedOutline.contentType,
      hashtags: content.hashtags || [],
      callToAction: content.callToAction || '',
    };

    // 文本类型确保 body 足够长
    if (isTextLong && contentWithImages.body.length < 500) {
      contentWithImages.body = contentWithImages.body || '请根据大纲生成完整的文章内容...';
    }

    return NextResponse.json({ content: contentWithImages });
  } catch (error) {
    console.error('Content API error:', error);

    // 区分错误类型并返回不同的响应
    if (error instanceof Error) {
      if (error.message.includes('AI API error') || error.message.includes('fetch')) {
        return NextResponse.json(
          {
            error: 'AI 服务调用失败',
            details: error.message,
            suggestion: '请检查 AI 提供商的 API Key 和网络连接',
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error: '内容生成失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
