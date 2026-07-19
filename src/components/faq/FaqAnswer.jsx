'use client';
import Link from 'next/link';

const DOT_COLOR = { blue: 'bg-[#BFFF5E]', green: 'bg-success-bright', yellow: 'bg-warning', red: 'bg-danger-bright', purple: 'bg-purple' };

function renderInline(text) {
  // Supports **bold** and [[label|href]] link markup
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-[#1d2b1f] font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const [label, href] = part.slice(2, -2).split('|');
      return href?.startsWith('/') ? (
        <Link key={i} href={href} className="text-[#1d2b1f] underline underline-offset-2 hover:text-[#4a5e3a]">{label}</Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-[#1d2b1f] underline underline-offset-2 hover:text-[#4a5e3a]">{label}</a>
      );
    }
    return part;
  });
}

export function FaqAnswer({ blocks }) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return <p key={i} className="text-sm leading-relaxed text-[#4a5e3a]">{renderInline(block.text)}</p>;
        }
        if (block.type === 'reasons') {
          return (
            <ul key={i} className="flex flex-col gap-2 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-[#4a5e3a]">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[item.color] ?? 'bg-[#BFFF5E]'}`} />
                  <span>{renderInline(item.text)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'info') {
          return (
            <div key={i} className="rounded-md border border-[#1d2b1f]/20 bg-[#faf3e8] overflow-hidden">
              {block.rows.map((row, j) => (
                <div key={j} className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1d2b1f]/10 last:border-0">
                  <span className="w-12 shrink-0 text-xs font-bold uppercase tracking-wider text-[#4a5e3a]">{row.label}</span>
                  <span className="font-mono text-sm font-bold text-[#1d2b1f]">{row.value}</span>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
