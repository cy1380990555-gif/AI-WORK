'use client';

import type { Message } from '@/lib/types';
import { DirectionCard } from './DirectionCard';
import { OutlineEditor } from '@/components/outline/OutlineEditor';
import { ContentPreview } from '@/components/content/ContentPreview';
import { PublishPanel } from '@/components/publish/PublishPanel';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
        isUser ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
      }`}>
        {isUser ? '你' : 'AI'}
      </div>

      {/* 消息内容 */}
      <div className={`max-w-[80%] ${isUser ? '' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-tr-sm' 
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {message.content && (
            isUser 
              ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              : <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* 附件渲染 */}
        {message.attachment && (
          <div className="mt-3">
            {message.attachment.type === 'directions' && (
              <DirectionCard directions={message.attachment.data as Parameters<typeof DirectionCard>[0]['directions']} />
            )}
            {message.attachment.type === 'outline' && (
              <OutlineEditor outline={message.attachment.data as Parameters<typeof OutlineEditor>[0]['outline']} />
            )}
            {message.attachment.type === 'content' && (
              <ContentPreview content={message.attachment.data as Parameters<typeof ContentPreview>[0]['content']} />
            )}
            {message.attachment.type === 'publish' && (
              <PublishPanel publishState={message.attachment.data as Parameters<typeof PublishPanel>[0]['publishState']} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
