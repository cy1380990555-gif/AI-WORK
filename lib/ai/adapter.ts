import type { AIChatMessage, AIChatOptions } from '@/lib/types';

export interface AIAdapter {
  chat(messages: AIChatMessage[], options?: AIChatOptions): AsyncGenerator<string>;
  chatJSON<T>(messages: AIChatMessage[], options?: AIChatOptions): Promise<T>;
}

// OpenAI 兼容格式的通用请求实现
export async function* openaiCompatibleStream(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AIChatMessage[],
  options?: AIChatOptions
): AsyncGenerator<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

// 非流式请求，用于结构化 JSON 输出
export async function openaiCompatibleJSON<T>(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AIChatMessage[],
  options?: AIChatOptions
): Promise<T> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || '';

  // 尝试提取 JSON
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
    content.match(/\{[\s\S]*\}/) ||
    content.match(/\[[\s\S]*\]/);

  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }

  return JSON.parse(content);
}

// 获取当前配置的 AI 适配器
export function getAIAdapter(): AIAdapter {
  const provider = process.env.AI_PROVIDER || 'mock';

  switch (provider) {
    case 'doubao':
      return createDoubaoAdapter();
    case 'tongyi':
      return createTongyiAdapter();
    case 'zhipu':
      return createZhipuAdapter();
    case 'mock':
    default:
      return createMockAdapter();
  }
}

// Mock 适配器 - 无需 API Key，用于流程验证
function createMockAdapter(): AIAdapter {
  return {
    async *chat(messages, _options) {
      const lastMsg = messages[messages.length - 1]?.content || '';
      const response = `这是模拟回复。你输入的内容是：「${lastMsg.slice(0, 50)}...」\n\n当前为 Mock 模式，请在 .env.local 中配置 AI_PROVIDER 和对应 API Key 以启用真实 AI。`;
      // 模拟流式输出
      for (const char of response) {
        yield char;
        await new Promise((r) => setTimeout(r, 20));
      }
    },
    async chatJSON<T>(messages: AIChatMessage[], _options?: AIChatOptions): Promise<T> {
      const lastMsg = messages[messages.length - 1]?.content || '';
      const systemMsg = messages[0]?.content || '';

      // 优先用 system 消息判断阶段（更准确），再用 user 消息辅助
      if (systemMsg.includes('内容策划专家') || lastMsg.includes('选择方向：')) {
        return mockOutline() as T;
      }
      if (systemMsg.includes('营销文案创作者') || lastMsg.includes('大纲标题：')) {
        return mockContent() as T;
      }
      if (systemMsg.includes('营销策略专家') || (lastMsg.includes('营销意图：') && !lastMsg.includes('选择方向'))) {
        return mockDirections() as T;
      }
      // 默认：意图识别阶段
      return mockIntentAndDirections(lastMsg) as T;
    },
  };
}

function mockIntentAndDirections(userInput: string) {
  const intent = {
    intent: 'EX7 摩托车型推广营销',
    targetAudience: '20-40 岁骑行爱好者及通勤用户',
    contentType: 'xiaohongshu',
    keywords: ['EX7', '智能电摩', '新能源', '骑行体验'],
    summary: `用户希望推广 EX7 摩托车型，目标受众为骑行爱好者和通勤用户，推荐使用小红书种草内容形式`,
  };
  return { intent, directions: mockDirections() };
}

function mockDirections() {
  return [
    {
      id: 'direction_1',
      title: '骑行种草路线',
      description: '以真实骑行场景为切入点，展示 EX7 的外观设计、续航能力和智能配置如何满足日常通勤和周末骑行的双重需求，让用户在阅读中自然产生试驾欲望。',
      suitableFor: '通勤用户、周末骑行爱好者、颜值党',
      contentType: 'xiaohongshu',
      targetAudience: '20-35 岁骑行爱好者',
    },
    {
      id: 'direction_2',
      title: '科技深度评测路线',
      description: '以专业视角深度解读 EX7 的智能仪表盘、电机性能和三电安全，建立科技实力形象。通过数据和实测支撑，增强用户信任感。',
      suitableFor: '科技爱好者、硬核玩家、理性购车人群',
      contentType: 'wechat_article',
      targetAudience: '25-40 岁科技爱好者',
    },
    {
      id: 'direction_3',
      title: '短视频沉浸体验路线',
      description: '制作 15-60 秒的短视频，以第一视角展示 EX7 的外观设计、加速性能和智能交互，配合热门 BGM 和骑行话题挑战。',
      suitableFor: '年轻用户、短视频活跃用户、骑行圈层',
      contentType: 'douyin_script',
      targetAudience: '20-35 岁短视频用户',
    },
  ];
}

function mockOutline() {
  return {
    title: '骑了 EX7 一个月，彻底爱上这台电动摩托车了！',
    items: [
      { id: 'item_1', title: '开头 Hook', description: '用真实通勤场景开头，比如"之前骑共享单车被淋雨，换 EX7 后风雨无阻"，3 秒内抓住注意力', order: 1 },
      { id: 'item_2', title: '痛点共鸣', description: '描述日常通勤的痛点：公交地铁太挤、打车太贵、共享单车天气影响，直到遇到 EX7 解决了所有问题', order: 2 },
      { id: 'item_3', title: '核心卖点展示', description: '重点介绍 EX7 三大亮点：智能仪表盘+APP 互联、续航实测 60km+、智能防盗和 NFC 解锁', order: 3 },
      { id: 'item_4', title: '真实骑行感受', description: '分享一个月真实体验：通勤效率的提升、周末城市骑行的乐趣、智能辅助带来的安全感和便利性', order: 4 },
      { id: 'item_5', title: '总结推荐', description: '总结 EX7 适合的人群：通勤党、外卖小哥、年轻潮人，引导试驾和互动', order: 5 },
    ],
    contentType: 'xiaohongshu',
    targetAudience: '20-35 岁骑行爱好者',
    tone: '真实分享、骑行圈层化表达',
  };
}

function mockContent() {
  return {
    title: '骑了 EX7 一个月，彻底爱上这台电动摩托车了！',
    body: `## 之前骑共享单车被淋雨，换 EX7 后风雨无阻！\n\n兄弟们！今天必须来分享一下我的 EX7 真实骑行体验！\n\n### 通勤那些痛点\n每天挤公交地铁真的太折磨人了，早高峰人贴人，打车费用又高得肉疼，共享单车又受天气影响，一到下雨就慌了...直到骑友推荐了 EX7。\n\n### 三大核心亮点\n- **超长续航**：官方标称 80km，实测城市通勤 60km+，一周充两次电就够\n- **智能体验**：APP 远程控车、NFC 解锁超方便、仪表盘实时显示电量速度和导航\n- **安全性能**：ABS 防抱死 + 双碟刹、智能防盗系统、夜间 LED 大灯超亮\n\n### 一个月真实感受\n骑了整整一个月，最大的感受就是——出行效率直接翻倍！\n\n日常通勤：单程 20 分钟到公司，风雨无阻，比地铁快了 3 倍\n周末骑行：城市兜风超有感觉，回头率 100%\n充电体验：家充桩一晚上充满，外出快充 40 分钟 80%\n\n> 实测电耗：城市骑行 1.2kWh/100km，高速模式 1.8kWh/100km\n\n### 总结\n真心推荐给正在找通勤工具的兄弟们！\n\n适合人群：\n- 通勤距离 5-30km 的上班族\n- 追求效率和自由的年轻人\n- 外卖骑手和跑腿小哥\n\n试驾了就知道，EX7 真的值！`,
    images: [
      'EX7 摩托车侧面照，流线型车身设计，城市街道背景，阳光质感',
      'EX7 仪表盘特写，智能互联 APP 界面，显示电量和导航信息',
      'EX7 夜间骑行照，LED 大灯亮起，城市灯光背景',
    ],
    contentType: 'xiaohongshu',
    hashtags: ['EX7', '智能电摩', '通勤神器', '新能源', '骑行体验'],
    callToAction: '正在选摩托车的兄弟们觉得有用的话记得点赞收藏！有什么关于 EX7 的问题评论区问我～',
  };
}

function createDoubaoAdapter(): AIAdapter {
  const baseUrl = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  const apiKey = process.env.DOUBAO_API_KEY || '';
  const model = process.env.DOUBAO_MODEL || 'doubao-pro-32k';

  return {
    async *chat(messages, options) {
      yield* openaiCompatibleStream(baseUrl, apiKey, model, messages, options);
    },
    async chatJSON(messages, options) {
      return openaiCompatibleJSON(baseUrl, apiKey, model, messages, options);
    },
  };
}

function createTongyiAdapter(): AIAdapter {
  const baseUrl = process.env.TONGYI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const apiKey = process.env.TONGYI_API_KEY || '';
  const model = process.env.TONGYI_MODEL || 'qwen-plus';

  return {
    async *chat(messages, options) {
      yield* openaiCompatibleStream(baseUrl, apiKey, model, messages, options);
    },
    async chatJSON(messages, options) {
      return openaiCompatibleJSON(baseUrl, apiKey, model, messages, options);
    },
  };
}

function createZhipuAdapter(): AIAdapter {
  const baseUrl = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  const apiKey = process.env.ZHIPU_API_KEY || '';
  const model = process.env.ZHIPU_MODEL || 'glm-4';

  return {
    async *chat(messages, options) {
      yield* openaiCompatibleStream(baseUrl, apiKey, model, messages, options);
    },
    async chatJSON(messages, options) {
      return openaiCompatibleJSON(baseUrl, apiKey, model, messages, options);
    },
  };
}
