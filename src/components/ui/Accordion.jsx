'use client';
import { createContext, use, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const AccordionCtx = createContext(null);

/** Wraps a group of <AccordionItem>s; only one stays open at a time. */
export function Accordion({ className, children }) {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((current) => (current === id ? null : id));
  return (
    <AccordionCtx value={{ openId, toggle }}>
      <div className={cn('flex flex-col gap-3', className)}>{children}</div>
    </AccordionCtx>
  );
}

export function AccordionItem({ id, title, icon, children, className }) {
  const ctx = use(AccordionCtx);
  const isOpen = ctx.openId === id;

  return (
    <div className={cn('overflow-hidden rounded-md border border-[#1d2b1f]/20 bg-[#fffdf9] transition-colors', isOpen && 'border-[#1d2b1f]/50 bg-[#faf3e8]', className)}>
      <button
        type="button"
        onClick={() => ctx.toggle(id)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5"
      >
        {icon && <span className="text-lg shrink-0">{icon}</span>}
        <span className="flex-1 font-semibold text-[#1d2b1f] text-sm">{title}</span>
        <ChevronDown size={18} className={cn('shrink-0 text-[#4a5e3a] transition-transform duration-300', isOpen && 'rotate-180 text-[#1d2b1f]')} />
      </button>
      <div className={cn('grid transition-all duration-300 ease-in-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 sm:px-5 text-sm text-[#4A5E3E] leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
