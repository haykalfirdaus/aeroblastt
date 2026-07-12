import { RefreshCw, Trophy, Vote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useTopVoters } from '@/hooks/useTopVoters';
import { SITE } from '@/data/config';
import { skinUrl } from '@/data/voterRewards';

const MEDAL_COLORS = ['text-warning', 'text-text-muted', 'text-rank-orbiter', 'text-text-dim', 'text-text-dim'];
const MEDAL_LABELS = ['#1', '#2', '#3', '#4', '#5'];

export function TopVotersPreview() {
  const { voters, status } = useTopVoters({ limit: 5, useProxy: true, fallbackToDemo: false });

  return (
    <section id="top-voters" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Top Voters Bulan Ini"
          title="Leaderboard Voter"
          description="Vote setiap hari dan menangkan reward eksklusif di akhir bulan!"
        />

        <GlassCard className="mb-5 overflow-hidden">
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-text-muted">
              <RefreshCw size={14} className="animate-spin" /> Memuat data voter...
            </div>
          )}

          {status === 'empty' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Trophy size={28} className="text-text-dim" />
              <p className="text-xs text-text-muted">Belum ada voter bulan ini.<br />Jadilah yang pertama!</p>
            </div>
          )}

          {status === 'success' && voters.length > 0 && (
            <ul className="divide-y divide-white/5">
              {voters.slice(0, 5).map((voter, i) => (
                <li key={voter.nickname} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-6 shrink-0 text-center font-mono text-xs font-bold ${MEDAL_COLORS[i]}`}>
                    {MEDAL_LABELS[i]}
                  </span>
                  <img
                    src={skinUrl(voter.nickname, 40)}
                    alt={voter.nickname}
                    loading="lazy"
                    className="h-7 w-7 shrink-0 rounded-lg border border-white/8 object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="flex-1 font-mono text-xs font-semibold text-text-bright">{voter.nickname}</span>
                  <span className="font-mono text-xs font-bold text-neon-300">{voter.votes} votes</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
          <a href={SITE.voters.voteUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              <Vote size={13} /> Vote Sekarang
            </Button>
          </a>
          <Link to="/top-voters">
            <Button variant="secondary" size="sm">Lihat Leaderboard Lengkap</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
