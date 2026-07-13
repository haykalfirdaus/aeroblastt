import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const GREETING = 'Halo! Aku AeroBlast Assistant 👋 Ada yang ingin kamu tanyakan tentang server kami?';

let msgCounter = 0;
function makeId() { return ++msgCounter; }

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-neon-400/60"
          style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const greeted = useRef(false);

  // Show greeting on first open
  useEffect(() => {
    if (open && !greeted.current) {
      greeted.current = true;
      setMessages([{ id: makeId(), role: 'ai', text: GREETING }]);
    }
  }, [open]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  // Escape closes popup
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: makeId(), role: 'user', text };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || 'Terjadi kesalahan. Coba lagi.');
      } else {
        setMessages((prev) => {
          const next = [...prev, { id: makeId(), role: 'ai', text: data.reply }];
          return next.length > 50 ? next.slice(next.length - 50) : next;
        });
      }
    } catch {
      setError('Tidak dapat terhubung. Periksa koneksimu.');
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">
      {/* Popup */}
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-2xl backdrop-blur-xl',
          'w-[340px] sm:w-[370px]',
          'transition-all duration-200 origin-bottom-right',
          open
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        )}
        style={{ maxHeight: '480px' }}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-white/8 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neon-500/15 border border-neon-500/30">
            <Bot size={14} className="text-neon-400" />
          </div>
          <span className="font-display text-sm font-semibold text-text-bright">AeroBlast Assistant</span>
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-dim">
            Beta
          </span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-text-dim transition-colors hover:bg-white/5 hover:text-text-bright"
            aria-label="Tutup chat"
          >
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-neon-500/30 bg-neon-500/15 px-3 py-2 text-sm leading-relaxed text-text-bright">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start gap-2">
                <Bot size={13} className="mt-1.5 shrink-0 text-neon-400" />
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/8 bg-white/[0.04] px-3 py-2 text-sm leading-relaxed text-text-bright whitespace-pre-wrap">
                  {msg.text}
                </div>
              </div>
            )
          )}
          {loading && (
            <div className="flex items-start gap-2">
              <Bot size={13} className="mt-1.5 shrink-0 text-neon-400" />
              <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-white/[0.04]">
                <LoadingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="shrink-0 border-t border-white/6 px-4 py-2 text-xs text-danger/80">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 flex items-end gap-2 border-t border-white/8 p-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya seputar AeroBlast..."
            disabled={loading}
            maxLength={500}
            className={cn(
              'flex-1 resize-none rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2',
              'text-sm text-text-bright placeholder:text-text-faint',
              'outline-none transition-colors focus:border-neon-400/50 focus:bg-white/[0.06]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'leading-relaxed max-h-28 overflow-y-auto'
            )}
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Kirim pesan"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
              input.trim() && !loading
                ? 'bg-neon-500 text-white shadow-md shadow-neon-500/30 hover:bg-neon-400'
                : 'bg-white/5 text-text-dim cursor-not-allowed'
            )}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Tutup chat' : 'Buka AeroBlast Assistant'}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          open
            ? 'bg-surface border border-white/15 text-text-bright hover:bg-surface-2'
            : 'bg-neon-500 text-white shadow-neon-500/40 hover:bg-neon-400 hover:scale-105'
        )}
      >
        {open ? <X size={20} /> : <Bot size={22} />}
      </button>
    </div>
  );
}
