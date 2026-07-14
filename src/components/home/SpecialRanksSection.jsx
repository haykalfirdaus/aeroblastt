import { useState } from 'react';
import { ChevronRight, Check, AlertTriangle, Send, HardHat, Video, LogIn, Smartphone } from 'lucide-react';

const RANK_ICONS = { HardHat, Video };
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Modal } from '@/components/ui/Modal';
import { FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { SPECIAL_RANKS } from '@/data/specialRanks';
import { buildRankApplicationMessage, openWhatsApp } from '@/utils/whatsapp';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';

const NICK_RE = /^[a-zA-Z0-9_.]{1,30}$/;
const MEDIA_MIN_FOLLOWERS = 1000;

function ApplicationModal({ rank, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick, loading, login, logout } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');

  const [nickInput, setNickInput] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [platform, setPlatform] = useState(isBedrock ? 'Bedrock / PE' : '');
  const [socialLink, setSocialLink] = useState('');
  const [followerCount, setFollowerCount] = useState('');

  if (!rank) return null;

  const hasDot = nickInput.includes('.');

  async function handleLogin(e) {
    e.preventDefault();
    if (!nickInput.trim() || loginSubmitting) return;
    if (!NICK_RE.test(nickInput.trim())) {
      showToast('Username tidak valid (maks 30 karakter, huruf/angka/underscore/titik)', 'error');
      return;
    }
    setLoginSubmitting(true);
    try {
      await login(nickInput.trim());
      showToast('Login berhasil!', 'success');
      setNickInput('');
      setPlatform(nickInput.includes('.') ? 'Bedrock / PE' : '');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoginSubmitting(false);
    }
  }

  function handleSend() {
    if (!playerNick) return showToast('Login dengan username Minecraft kamu dulu!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (rank.key === 'MEDIA') {
      if (!socialLink.trim()) return showToast('Masukkan link akun media sosialmu!', 'error');
      const fc = parseInt(followerCount);
      if (!fc || fc < MEDIA_MIN_FOLLOWERS) return showToast(`Minimal follower adalah ${MEDIA_MIN_FOLLOWERS.toLocaleString('id-ID')}!`, 'error');
    }
    openWhatsApp(buildRankApplicationMessage({
      nick: playerNick,
      platform,
      rank: rank.name.toUpperCase(),
      socialLink: socialLink.trim(),
      followerCount: followerCount ? parseInt(followerCount).toLocaleString('id-ID') : '',
    }));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Daftar Rank ${rank.name}`} badge="FREE RANK">
      {/* Syarat */}
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
        {/* Login / Nick */}
        {loading ? null : playerNick ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neon-500/20 bg-neon-500/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-2">
              {isBedrock
                ? <Smartphone size={14} className="text-cyan-400" />
                : <div className="h-2 w-2 rounded-full bg-neon-400" />}
              <span className="font-mono text-sm font-bold text-text-bright">{playerNick}</span>
              {isBedrock && <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">BEDROCK</span>}
            </div>
            <button onClick={() => { logout(); setPlatform(''); }} className="text-[11px] text-text-dim hover:text-text-bright transition-colors">
              Ganti akun
            </button>
          </div>
        ) : (
          <>
            {hasDot && (
              <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/8 px-3 py-2 text-xs text-cyan-300">
                <Smartphone size={13} />
                Username mengandung titik — akan dikenali sebagai <strong className="ml-1">Bedrock / PE</strong>
              </div>
            )}
            <div>
              <FieldLabel required>Nickname In-Game</FieldLabel>
              <form onSubmit={handleLogin} className="flex gap-2">
                <input
                  type="text"
                  value={nickInput}
                  onChange={(e) => setNickInput(e.target.value)}
                  placeholder="Username Minecraft kamu"
                  maxLength={30}
                  disabled={loginSubmitting}
                  className="flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loginSubmitting || !nickInput.trim()}
                  className="flex items-center gap-1.5 rounded-xl border border-neon-500/40 bg-neon-500/15 px-3 py-2.5 text-sm font-semibold text-neon-300 transition-colors hover:bg-neon-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loginSubmitting
                    ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neon-400/30 border-t-neon-400" />
                    : <LogIn size={14} />}
                </button>
              </form>
              <p className="mt-1 text-[11px] text-text-faint">Login dulu untuk verifikasi username kamu terdaftar di server.</p>
            </div>
          </>
        )}

        {/* Platform */}
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={isBedrock ? 'Bedrock / PE' : platform} onChange={(e) => !isBedrock && setPlatform(e.target.value)} disabled={isBedrock}>
            <option value="">-- Pilih Platform --</option>
            <option>Java Edition</option>
            <option>Bedrock / PE</option>
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-cyan-400">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>

        {/* Media-only fields */}
        {rank.key === 'MEDIA' && (
          <>
            <div>
              <FieldLabel required>Link / Username Akun Media Sosial</FieldLabel>
              <TextField value={socialLink} onChange={(e) => setSocialLink(e.target.value)} placeholder="https://tiktok.com/@username atau @username" />
            </div>
            <div>
              <FieldLabel required>Jumlah Follower / Subscriber</FieldLabel>
              <input
                type="number"
                min={MEDIA_MIN_FOLLOWERS}
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                placeholder={`Minimal ${MEDIA_MIN_FOLLOWERS.toLocaleString('id-ID')}`}
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 font-mono text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60"
              />
              {followerCount && parseInt(followerCount) < MEDIA_MIN_FOLLOWERS && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
                  <AlertTriangle size={11} /> Follower kamu belum mencapai minimal {MEDIA_MIN_FOLLOWERS.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </>
        )}

        <Button fullWidth size="sm" onClick={handleSend} disabled={!playerNick}>
          <Send size={13} /> {playerNick ? 'Kirim Pendaftaran via WhatsApp' : 'Login dulu untuk daftar'}
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
