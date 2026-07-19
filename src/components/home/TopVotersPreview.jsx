'use client';
import { RefreshCw, Trophy, Vote } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useTopVoters } from '@/hooks/useTopVoters';
import { SITE } from '@/data/config';
import { skinUrl } from '@/data/voterRewards';

const MEDAL_COLORS = ['text-warning', 'text-[#6b7f5a]', 'text-rank-orbiter', 'text-[#4a5e3a]', 'text-[#4a5e3a]'];
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
          data-aos="fade-up"
          data-aos-duration="800"
        />

        <GlassCard className="mb-5 overflow-hidden" data-aos="fade-up" data-aos-duration="800">
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#4a5e3a]">
              <RefreshCw size={14} className="animate-spin" /> Memuat data voter...
            </div>
          )}

          {status === 'empty' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Trophy size={28} className="text-[#6b7f5a]" />
              <p className="text-xs text-[#4a5e3a]">Belum ada voter bulan ini.<br />Jadilah yang pertama!</p>
            </div>
          )}

          {status === 'success' && voters.length > 0 && (
            <ul className="divide-y divide-[#D8D1C0]/60">
              {voters.slice(0, 5).map((voter, i) => (
                <li key={voter.nickname} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-6 shrink-0 text-center font-mono text-xs font-bold ${MEDAL_COLORS[i]}`}>
                    {MEDAL_LABELS[i]}
                  </span>
                  <img
                    src={skinUrl(voter.nickname, 40)}
                    alt={voter.nickname}
                    loading="lazy"
                    className="h-7 w-7 shrink-0 rounded-lg border border-2 border-[#1d2b1f] object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="flex-1 font-mono text-xs font-semibold text-[#1d2b1f]">{voter.nickname}</span>
                  <span className="font-mono text-xs font-bold text-[#1d2b1f]">{voter.votes} votes</span>
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
          <Link href="/top-voters">
            <Button variant="secondary" size="sm">Lihat Leaderboard Lengkap</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
