import { Link } from 'react-router-dom';

const DOT_COLOR = { blue: 'bg-neon-400', green: 'bg-success-bright', yellow: 'bg-warning', red: 'bg-danger-bright', purple: 'bg-purple' };

function renderInline(text) {
  // Supports **bold** and [[label|href]] link markup
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-text-bright font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const [label, href] = part.slice(2, -2).split('|');
      return href?.startsWith('/') ? (
        <Link key={i} to={href} className="text-neon-300 underline-offset-2 hover:underline">{label}</Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-neon-300 underline-offset-2 hover:underline">{label}</a>
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
          return <p key={i} className="text-sm leading-relaxed text-text-muted">{renderInline(block.text)}</p>;
        }
        if (block.type === 'reasons') {
          return (
            <ul key={i} className="flex flex-col gap-2 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[item.color] ?? 'bg-neon-400'}`} />
                  <span>{renderInline(item.text)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'info') {
          return (
            <div key={i} className="rounded-xl border border-neon-500/20 bg-neon-500/8 overflow-hidden">
              {block.rows.map((row, j) => (
                <div key={j} className="flex items-center gap-4 px-4 py-2.5 border-b border-white/6 last:border-0">
                  <span className="w-12 shrink-0 text-xs font-bold uppercase tracking-wider text-text-dim">{row.label}</span>
                  <span className="font-mono text-sm font-bold text-text-bright">{row.value}</span>
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
