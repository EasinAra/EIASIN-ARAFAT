
import React from 'react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar Placeholder */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${isUser ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>
          {isUser ? 'U' : 'E'}
        </div>

        {/* Bubble */}
        <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
          ? 'bg-indigo-600 text-white rounded-tr-none' 
          : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          
          <div className={`mt-1 text-[10px] opacity-40 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};
