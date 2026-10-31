import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  BookOpen,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  CheckCircle2,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Citation, CitationDrawer } from './CitationDrawer';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  answerable?: boolean;
  timestamp: string;
}

interface AssistantPanelProps {
  joinerId?: string;
  initialQuery?: string;
  floating?: boolean;
  onClose?: () => void;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  joinerId,
  initialQuery = '',
  floating = false,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your AI HR Onboarding Assistant. I provide grounded answers directly from approved company policies and your onboarding tasks. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: textToSend,
          joiner_id: joinerId,
        }),
      });

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        citations: res.citations || [],
        answerable: res.answerable,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I couldn't reach the policy database at this moment. Please try again or reach out to your HR contact.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const starterQuestions = [
    "Which documents do I need to submit before my joining date?",
    "When and where do I report on my first day in Bengaluru?",
    "When will my laptop and corporate email account be ready?",
    "How do I acknowledge the Information Security Policy?"
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden ${floating ? 'h-[580px] w-96' : 'h-[650px] w-full'}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Onboarding Policy Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500">
              Grounded with Elasticsearch RAG & Policies
            </p>
          </div>
        </div>
        {floating && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                m.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-br-xs'
                  : m.answerable === false
                  ? 'bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-orange-950 dark:text-orange-200 rounded-bl-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
              }`}
            >
              {m.answerable === false && (
                <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300 font-semibold mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Out-of-Policy Inquiry</span>
                </div>
              )}

              <div className="leading-relaxed whitespace-pre-wrap">{m.text}</div>

              {/* Citations Chips */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Source Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedCitation(c);
                          setDrawerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 shadow-2xs transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>
                          {c.policy_code} • {c.section} (p.{c.page})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {m.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-[70%]">
            <Sparkles className="w-4 h-4 text-brand-600 animate-spin" />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Retrieving approved policies & generating grounded answer...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Questions */}
      {messages.length <= 2 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Suggested Questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {starterQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about onboarding policies, dates, or documents..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Slide-out Citation Drawer */}
      <CitationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        citation={selectedCitation}
      />
    </div>
  );
};

