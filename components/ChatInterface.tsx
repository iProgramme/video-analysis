import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, User, Sparkles } from 'lucide-react';
import { Chat } from '@google/genai';

interface ChatInterfaceProps {
  chatSession: Chat | null;
  isEnabled: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatSession, isEnabled }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: "我已经观看了视频。你可以问我关于具体细节、视觉元素或背景的任何问题。",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: input });
      const responseText = result.text || "我无法生成回答。";
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "抱歉，回答时遇到了错误。",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isEnabled) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">
        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
        <p>请先分析视频以开始对话。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-700 text-slate-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
               <Sparkles size={16} />
             </div>
             <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-tl-none">
               <div className="flex space-x-1.5">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="询问关于特定时刻、物体或细节的问题..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-colors flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};