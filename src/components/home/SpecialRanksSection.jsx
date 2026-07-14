import { useState } from 'react';
import { ChevronRight, Check, AlertTriangle, Send, HardHat, Video } from 'lucide-react';

const RANK_ICONS = { HardHat, Video };
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Modal } from '@/components/ui/Modal';
import { FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { SPECIAL_RANKS } from '@/data/specialRanks';
import { buildRankApplicationMessage, openWhatsApp } from '@/utils/whatsapp';
import { useToast } from '@/context/ToastContext';

function ApplicationModal({ rank, open, onClose }) {
  const showToast = useToast();
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState('');
  const [socialLink, setSocialLink] = useState('');

  if (!rank) return null;

  function handleSend() {
    if (!nick.trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (rank.key === 'MEDIA' && !socialLink.trim()) return showToast('Masukkan link akun media sosialmu!', 'error');
    openWhatsApp(buildRankApplicationMessage({ nick: nick.trim(), platform, rank: rank.name.toUpperCase(), socialLink: socialLink.trim() }));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Daftar Rank ${rank.name}`} badge="FREE RANK">
      <div className="mt-4 mb-4 rounded-xl border border-white/8 bg-white/[0.025] p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">{rank.rulesTitle}</p>
        <ul className="flex flex-col gap-2">
          {rank.rules.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
              <AlertTriangle size={11} className="mt-0.5 shrink-0 text-warning" /> {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <div><FieldLabel required>Nickname In-Game</FieldLabel><TextField value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Username Minecraft kamu" /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">-- Pilih Platform --</option>
            <option>Java Edition</option>
            <option>Bedrock / PE</option>
          </SelectField>
        </div>
        {rank.key === 'MEDIA' && (
          <div><FieldLabel required>Link / Username Akun Media Sosial</FieldLabel><TextField value={socialLink} onChange={(e) => setSocialLink(e.target.value)} placeholder="https://tiktok.com/@username atau @username" /></div>
        )}
        <Button fullWidth size="sm" onClick={handleSend}>
          <Send size={13} /> Kirim Pendaftaran via WhatsApp
        </Button>
      </div>
    </Modal>
  );
}

export function SpecialRanksSection() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="special-ranks" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Special Ranks"
          title="Rank Gratis, Daftar Sekarang!"
          description="Rank Builder dan Media 100% gratis untuk player yang memenuhi syarat. Daftar langsung via WhatsApp."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 max-w-3xl mx-auto">
          {SPECIAL_RANKS.map((rank, i) => (
            <GlassCard key={rank.key} interactive>
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] shadow-[0_0_18px_-4px_rgba(59,130,246,0.35)]">
                    {(() => { const Icon = RANK_ICONS[rank.icon]; return Icon ? <Icon size={20} className="text-neon-300" /> : null; })()}
                  </div>
                  <div>
                    <span className="rounded-full border border-success/25 bg-success/8 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-success-bright">FREE</span>
                    <h3 className="mt-0.5 font-display text-base font-bold text-text-bright">{rank.name}</h3>
                    <p className="text-xs text-text-dim">{rank.subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wide text-text-dim">Benefit</p>
                    <ul className="flex flex-col gap-1.5">
                      {rank.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-1.5 text-[0.7rem] text-text-muted">
                          <Check size={10} className="mt-0.5 shrink-0 text-success-bright" /> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wide text-text-dim">Syarat</p>
                    <ul className="flex flex-col gap-1.5">
                      {rank.requirements.map((r) => (
                        <li key={r} className="flex items-start gap-1.5 text-[0.7rem] text-text-muted">
                          <Check size={10} className="mt-0.5 shrink-0 text-neon-400" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button fullWidth variant="secondary" size="sm" onClick={() => setSelected(rank)}>
                  {rank.ctaLabel} <ChevronRight size={13} />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <ApplicationModal rank={selected} open={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
}
