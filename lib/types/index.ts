// 流程步骤
export type FlowStep =
  | 'idle'
  | 'intent_recognized'
  | 'direction_chosen'
  | 'outline_confirmed'
  | 'content_ready'
  | 'publishing'
  | 'published';

// 对话消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 消息附件类型
export type MessageAttachmentType = 'directions' | 'outline' | 'content' | 'publish';

// 对话消息
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  attachment?: MessageAttachment;
  timestamp: number;
}

export interface MessageAttachment {
  type: MessageAttachmentType;
  data: unknown;
}

// 意图识别结果
export interface IntentResult {
  intent: string;
  targetAudience: string;
  contentType: ContentType;
  keywords: string[];
  summary: string;
}

// 内容类型
export type ContentType = 'xiaohongshu' | 'wechat_article' | 'douyin_script' | 'weibo' | 'general';

// 营销方向
export interface Direction {
  id: string;
  title: string;
  description: string;
  suitableFor: string;
  contentType: ContentType;
  targetAudience: string;
}

// 大纲条目
export interface OutlineItem {
  id: string;
  title: string;
  description: string;
  order: number;
}

// 内容大纲
export interface Outline {
  title: string;
  items: OutlineItem[];
  contentType: ContentType;
  targetAudience: string;
  tone: string;
}

// 生成内容
export interface GeneratedContent {
  title: string;
  body: string;
  images: string[];
  contentType: ContentType;
  hashtags: string[];
  callToAction: string;
}

// 社媒渠道
export type Channel = 'xiaohongshu' | 'douyin' | 'wechat' | 'weibo';

export interface ChannelInfo {
  id: Channel;
  name: string;
  icon: string;
  maxTextLength: number;
  maxImages: number;
  supported: boolean;
}

// 分发任务状态
export type PublishStatus = 'pending' | 'publishing' | 'success' | 'failed';

export interface PublishTask {
  channel: Channel;
  status: PublishStatus;
  url?: string;
  error?: string;
  publishedAt?: number;
  // 数据跟踪监测字段
  trackingId?: string;
  metrics?: {
    impressions?: number;      // 曝光量
    clicks?: number;           // 点击量
    likes?: number;            // 点赞数
    shares?: number;           // 分享数
    comments?: number;         // 评论数
    conversionRate?: number;   // 转化率
  };
  trackingEnabled?: boolean;   // 是否启用数据跟踪
}

// 分发状态
export interface PublishState {
  channels: Channel[];
  tasks: PublishTask[];
  allDone: boolean;
}

// AI 适配器类型
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// 渠道配置
export const CHANNEL_CONFIG: Record<Channel, ChannelInfo> = {
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    icon: '📖',
    maxTextLength: 1000,
    maxImages: 9,
    supported: true,
  },
  douyin: {
    id: 'douyin',
    name: '抖音',
    icon: '🎵',
    maxTextLength: 300,
    maxImages: 0,
    supported: true,
  },
  wechat: {
    id: 'wechat',
    name: '微信公众号',
    icon: '💬',
    maxTextLength: 20000,
    maxImages: 20,
    supported: true,
  },
  weibo: {
    id: 'weibo',
    name: '微博',
    icon: '🔥',
    maxTextLength: 2000,
    maxImages: 9,
    supported: true,
  },
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  xiaohongshu: '小红书笔记',
  wechat_article: '公众号文章',
  douyin_script: '抖音短视频脚本',
  weibo: '微博文案',
  general: '通用内容',
};
