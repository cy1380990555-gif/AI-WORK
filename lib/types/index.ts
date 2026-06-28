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

// 内容类型 - 新增 text_article（文本文章）和 video_script（视频脚本）
export type ContentType = 
  | 'xiaohongshu'       // 小红书图文
  | 'douyin_video'      // 抖音短视频
  | 'wechat_article'    // 微信公众号文章
  | 'weibo'             // 微博文案
  | 'text_article'      // 文本文章（新增）
  | 'video_script'      // 视频脚本（新增）
  | 'general';

// 内容类型标签映射
export type ContentTypeLabel = '小红书图文' | '抖音短视频' | '微信公众号文章' | '微博文案' | '文本文章' | '视频脚本' | '通用内容';

// 平台品牌色映射
export type PlatformColor = '#FF2442' | '#000000' | '#07C160' | '#E6162D' | '#666666' | '#999999';

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

// 生成内容 - 支持多种内容类型的字段
export interface GeneratedContent {
  title: string;
  body: string;              // 正文内容（文本类型较长）
  images: string[];          // 图片描述/URL（图文类型）
  videoDescription?: string; // 视频脚本描述（视频类型）
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

// 内容类型标签映射
export const CONTENT_TYPE_LABELS: Record<ContentType, ContentTypeLabel> = {
  xiaohongshu: '小红书图文',
  wechat_article: '微信公众号文章',
  douyin_video: '抖音短视频',
  weibo: '微博文案',
  text_article: '文本文章',
  video_script: '视频脚本',
  general: '通用内容',
};

// 平台品牌色
export const PLATFORM_COLORS: Record<ContentType, PlatformColor> = {
  xiaohongshu: '#FF2442',       // 小红书红
  douyin_video: '#000000',      // 抖音黑
  wechat_article: '#07C160',    // 微信绿
  weibo: '#E6162D',             // 微博红
  text_article: '#666666',      // 文本灰
  video_script: '#999999',      // 视频深灰
  general: '#999999',           // 通用灰
};

// 获取内容类型分类
export function getContentCategory(contentType: ContentType): 'short_form' | 'long_form' | 'video' {
  switch (contentType) {
    case 'xiaohongshu':
    case 'weibo':
      return 'short_form';  // 短内容
    case 'wechat_article':
    case 'text_article':
      return 'long_form';   // 长内容
    case 'douyin_video':
    case 'video_script':
      return 'video';       // 视频
    default:
      return 'short_form';
  }
}

// 获取内容类型显示名称
export function getContentTypeDisplayName(contentType: ContentType): string {
  return CONTENT_TYPE_LABELS[contentType] || '未知类型';
}
