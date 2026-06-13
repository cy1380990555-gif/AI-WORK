import type { AIChatMessage } from '@/lib/types';

// 意图识别 Prompt
export function buildIntentPrompt(userInput: string): AIChatMessage[] {
  return [
    {
      role: 'system',
      content: `你是一个营销意图识别专家。用户会给你一句话描述他们的营销需求，你需要分析出：
1. 营销意图（intent）：用户想要做什么类型的营销
2. 目标受众（targetAudience）：最可能的目标人群
3. 内容类型（contentType）：最适合的内容形式，从以下选项中选择：xiaohongshu（小红书笔记）、wechat_article（公众号文章）、douyin_script（抖音短视频脚本）、weibo（微博文案）、general（通用内容）
4. 关键词（keywords）：3-5个核心关键词
5. 摘要（summary）：一句话概括营销目标

请以JSON格式返回，格式如下：
\`\`\`json
{
  "intent": "营销意图描述",
  "targetAudience": "目标受众",
  "contentType": "内容类型代码",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "一句话摘要"
}
\`\`\`

只返回JSON，不要其他内容。`,
    },
    {
      role: 'user',
      content: userInput,
    },
  ];
}

// 方向建议 Prompt
export function buildDirectionPrompt(intent: string, targetAudience: string, contentType: string): AIChatMessage[] {
  return [
    {
      role: 'system',
      content: `你是一个营销策略专家。基于用户的营销意图，给出2-3个不同的营销方向供用户选择。

每个方向需要包含：
1. id：方向标识，如 "direction_1"
2. title：方向标题，简洁有力
3. description：方向描述，2-3句话说明这个方向的核心策略
4. suitableFor：适合场景说明
5. contentType：推荐的内容类型代码（xiaohongshu/wechat_article/douyin_script/weibo/general）
6. targetAudience：该方向的目标受众

请以JSON数组格式返回：
\`\`\`json
[
  {
    "id": "direction_1",
    "title": "方向标题",
    "description": "方向描述",
    "suitableFor": "适合场景",
    "contentType": "内容类型代码",
    "targetAudience": "目标受众"
  }
]
\`\`\`

确保各方向之间有明显的差异化，给用户真正的选择空间。只返回JSON数组，不要其他内容。`,
    },
    {
      role: 'user',
      content: `营销意图：${intent}\n目标受众：${targetAudience}\n内容类型：${contentType}`,
    },
  ];
}

// 大纲生成 Prompt
export function buildOutlinePrompt(
  intent: string,
  directionTitle: string,
  directionDescription: string,
  contentType: string,
  targetAudience: string
): AIChatMessage[] {
  return [
    {
      role: 'system',
      content: `你是一个内容策划专家。基于用户选择的营销方向，生成一份详细的内容大纲。

大纲需要包含：
1. title：内容标题
2. items：大纲条目数组，每个条目包含：
   - id：条目标识，如 "item_1"
   - title：条目标题
   - description：条目内容描述（2-3句话）
   - order：排序序号
3. contentType：内容类型代码
4. targetAudience：目标受众
5. tone：内容语调风格

请根据内容类型调整大纲结构：
- 小红书笔记：标题+开头hook+3-5个要点+结尾互动
- 公众号文章：标题+引言+3-5个章节+总结
- 抖音脚本：标题+开头3秒hook+主体内容+结尾CTA
- 微博文案：标题+核心观点+2-3个论据+互动引导

以JSON格式返回：
\`\`\`json
{
  "title": "内容标题",
  "items": [
    { "id": "item_1", "title": "条目标题", "description": "条目描述", "order": 1 }
  ],
  "contentType": "内容类型代码",
  "targetAudience": "目标受众",
  "tone": "语调风格"
}
\`\`\`

只返回JSON，不要其他内容。`,
    },
    {
      role: 'user',
      content: `营销意图：${intent}\n选择方向：${directionTitle}\n方向描述：${directionDescription}\n内容类型：${contentType}\n目标受众：${targetAudience}`,
    },
  ];
}

// 内容生成 Prompt
export function buildContentPrompt(
  outlineTitle: string,
  outlineItems: string,
  contentType: string,
  tone: string,
  targetAudience: string
): AIChatMessage[] {
  const contentGuides: Record<string, string> = {
    xiaohongshu: `生成小红书笔记格式内容：
- 使用emoji增加视觉吸引力
- 每段简短有力
- 包含5-8个相关话题标签（#标签）
- 结尾有明确的互动引导
- 文字控制在1000字以内`,
    wechat_article: `生成微信公众号文章格式内容：
- 标题吸引眼球
- 开头有共鸣感引言
- 段落间过渡自然
- 适当使用小标题
- 结尾有总结和行动号召
- 文字可较长，2000-5000字`,
    douyin_script: `生成抖音短视频脚本格式内容：
- 开头3秒必须有强hook
- 节奏紧凑，每15秒一个信息点
- 包含画面描述和台词
- 结尾有明确的CTA
- 总时长控制在30-60秒`,
    weibo: `生成微博文案格式内容：
- 简洁有力，2000字以内
- 开头抓眼球
- 包含2-3个核心论点
- 使用话题标签
- 结尾互动引导`,
    general: `生成通用营销内容：
- 结构清晰
- 语言有感染力
- 包含核心卖点和行动号召`,
  };

  return [
    {
      role: 'system',
      content: `你是一个顶级营销文案创作者。请根据提供的大纲，生成完整的营销内容。

${contentGuides[contentType] || contentGuides.general}

语调风格：${tone}
目标受众：${targetAudience}

请以JSON格式返回：
\`\`\`json
{
  "title": "内容标题",
  "body": "完整正文内容（使用Markdown格式）",
  "images": ["图片描述1", "图片描述2", "图片描述3"],
  "contentType": "${contentType}",
  "hashtags": ["标签1", "标签2", "标签3"],
  "callToAction": "行动号召语"
}
\`\`\`

注意：images字段是图片的描述文字，用于后续生成配图。只返回JSON，不要其他内容。`,
    },
    {
      role: 'user',
      content: `大纲标题：${outlineTitle}\n\n大纲条目：\n${outlineItems}`,
    },
  ];
}
