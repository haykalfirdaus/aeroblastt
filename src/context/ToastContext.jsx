'use client';
import { createContext, use, useCallback, useRef, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONE_CLASSES = {
  success: 'border-success/40 bg-success/10 text-success-bright',
  error: 'border-danger/40 bg-danger/10 text-danger-bright',
  info: 'border-neon-500/40 bg-neon-500/10 text-neon-300',
};

let idSeed = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 400);
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = ++idSeed;
      setToasts((current) => [...current, { id, message, type, leaving: false }]);
      const timeout = setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, timeout);
    },
    [dismiss]
  );

  return (
    <ToastContext value={showToast}>
      {children}
      <div className="pointer-events-none fixed top-5 right-5 z-[200] flex flex-col gap-2.5 sm:top-6 sm:right-6">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] ?? Info;
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-400',
                'bg-panel/90',
                TONE_CLASSES[toast.type],
                toast.leaving ? '-translate-y-3 scale-95 opacity-0' : 'translate-y-0 scale-100 opacity-100'
              )}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium leading-snug text-text-bright">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

/** Returns showToast(message, 'success' | 'error' | 'info'). */
export function useToast() {
  const showToast = use(ToastContext);
  if (!showToast) throw new Error('useToast must be used within a ToastProvider');
  return showToast;
}
