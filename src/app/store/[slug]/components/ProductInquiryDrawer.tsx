'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Send, MessageCircle, Bot, ShoppingBag } from 'lucide-react';
import { StorefrontProduct, StorefrontConfig } from '@/types/storefront';
import { formatCurrency } from '@/utils/format';
import { useFocusTrap } from '@/hooks';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface ProductInquiryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: StorefrontProduct;
  config: StorefrontConfig;
  productUrl: string;
  primaryColor?: string;
}

export function ProductInquiryDrawer({
  isOpen,
  onClose,
  product,
  config,
  productUrl,
  primaryColor = '#3b82f6',
}: ProductInquiryDrawerProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello! I'm ${config.store_name}'s assistant. Have questions about ${product.name}, sizes, or delivery? Ask me below!`,
      timestamp: 'Just now',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCounterRef = useRef(1);

  const containerRef = useFocusTrap(isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const quickQuestions = ['Is this in stock?', 'What variants or sizes are available?', 'How does delivery work?'];

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    msgCounterRef.current += 1;
    const userMsg: Message = {
      id: `user-${msgCounterRef.current}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    // Context-aware automated response logic
    setTimeout(() => {
      let reply = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('stock') || qLower.includes('available')) {
        if (product.total_stock > 0) {
          reply = `Yes! We currently have ${product.total_stock} ${product.total_stock === 1 ? 'unit' : 'units'} in stock for ${product.name}.`;
        } else {
          reply = `Sorry, ${product.name} is currently out of stock. You can save it to your wishlist to be notified when it's back!`;
        }
      } else if (qLower.includes('size') || qLower.includes('variant') || qLower.includes('color')) {
        const variantList = product.variants
          .map((v) => `${v.title} (${formatCurrency(v.price, config.currency)})`)
          .join(', ');
        reply = `Available options for ${product.name}: ${variantList || 'Standard'}.`;
      } else if (qLower.includes('delivery') || qLower.includes('shipping') || qLower.includes('arrive')) {
        reply = config.delivery_policy || 'We deliver across Ghana. Standard delivery takes 1-3 business days.';
      } else {
        reply = `Thanks for asking! For specific customizations or bulk inquiries, you can also tap "Speak to Merchant" below to chat directly on WhatsApp.`;
      }

      msgCounterRef.current += 1;
      const aiMsg: Message = {
        id: `ai-${msgCounterRef.current}`,
        sender: 'ai',
        text: reply,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  // Build Context Pack for WhatsApp Escalation
  const merchantPhone = config.whatsapp_phone?.replace(/[^0-9]/g, '') || '';
  const lastQuestion =
    messages.filter((m) => m.sender === 'user').slice(-1)[0]?.text || 'I have a question about this product.';
  const contextPackText = encodeURIComponent(
    `Hi ${config.store_name}, I have a question about *${product.name}* (${formatCurrency(product.min_price, config.currency)}).\n🔗 Link: ${productUrl}\n❓ Question: ${lastQuestion}`
  );
  const whatsappEscalationUrl = `https://wa.me/${merchantPhone}?text=${contextPackText}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Product inquiry assistant"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-separator shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-separator flex items-center justify-between bg-surface-elevated">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Bot size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Product Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
                </h3>
                <p className="text-[10px] text-muted truncate max-w-50">{product.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition cursor-pointer"
              aria-label="Close assistant"
            >
              <X size={18} />
            </button>
          </div>

          {/* Product Mini Banner */}
          <div className="p-3 bg-surface border-b border-separator/60 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-elevated border border-separator/40 shrink-0">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="48px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <ShoppingBag size={16} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-foreground truncate">{product.name}</h4>
              <p className="text-xs font-bold" style={{ color: primaryColor }}>
                {formatCurrency(product.min_price, config.currency)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.total_stock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}
              >
                {product.total_stock > 0 ? `${product.total_stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs ${
                    m.sender === 'user'
                      ? 'bg-brand-primary text-white rounded-br-xs'
                      : 'bg-surface-elevated border border-separator text-foreground rounded-bl-xs'
                  }`}
                  style={m.sender === 'user' ? { backgroundColor: primaryColor } : undefined}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <span className={`text-[9px] block mt-1 ${m.sender === 'user' ? 'text-white/80' : 'text-muted'}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-muted text-xs">
                <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Bot size={14} />
                </div>
                <div className="flex gap-1 py-2 px-3 bg-surface-elevated rounded-2xl border border-separator">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 bg-surface border-t border-separator/40 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className="text-[10px] font-semibold text-muted bg-surface-elevated border border-separator rounded-full px-2.5 py-1 whitespace-nowrap hover:text-foreground hover:border-separator/80 transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Footer Input & WhatsApp Escalation */}
          <div className="p-3 border-t border-separator bg-surface-elevated space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about this product..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 text-xs rounded-xl bg-surface border border-separator px-3 py-2.5 placeholder:text-muted/60 focus:ring-1 focus:ring-brand-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="p-2.5 rounded-xl text-white shadow-xs transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
                aria-label="Send question"
              >
                <Send size={15} />
              </button>
            </form>

            {merchantPhone && (
              <a
                href={whatsappEscalationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#25D366] text-white text-[11px] font-bold hover:bg-[#20ba59] transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageCircle size={14} />
                <span>Speak to Merchant on WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
