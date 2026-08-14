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
      <div className="mt-4 mb-4 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-in)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4a5e3a]">{rank.rulesTitle}</p>
        <ul className="flex flex-col gap-2">
          {rank.rules.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#4a5e3a]">
              <AlertTriangle size={11} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" /> {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        {/* Login / Nick */}
        {loading ? null : playerNick ? (
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 py-2.5 shadow-[var(--neu-in)]">
            <div className="flex items-center gap-2">
              {isBedrock
                ? <Smartphone size={14} aria-hidden="true" className="text-[#354530]" />
                : <div aria-hidden="true" className="h-2 w-2 rounded-full bg-[#5a9e10]" />}
              <span className="font-mono text-sm font-bold text-[#1d2b1f]">{playerNick}</span>
              {isBedrock && <span className="neu-tag text-[10px] font-bold text-[#354530]">BEDROCK</span>}
            </div>
            <button
              type="button"
              onClick={() => { logout(); setPlatform(''); }}
              className="neu-press min-h-[48px] rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-3 text-[11px] font-semibold text-[#4a5e3a] shadow-[var(--neu-out)]"
            >
              Ganti akun
            </button>
          </div>
        ) : (
          <>
            {hasDot && (
              <div className="flex items-center gap-2 rounded-[var(--radius-neu)] bg-[#fff8f0] px-3 py-2 text-xs text-[#354530] shadow-[var(--neu-in)]">
                <Smartphone size={13} aria-hidden="true" />
                Username mengandung titik — akan dikenali sebagai <strong className="ml-1">Bedrock / PE</strong>
              </div>
            )}
            <div>
              <FieldLabel required>Nickname In-Game</FieldLabel>
              <form onSubmit={handleLogin} className="flex gap-2">
                <TextField
                  type="text"
                  value={nickInput}
                  onChange={(e) => setNickInput(e.target.value)}
                  placeholder="Username Minecraft kamu"
                  aria-label="Nickname In-Game"
                  maxLength={30}
                  disabled={loginSubmitting}
                  className="flex-1"
                />
                <button
                  type="submit"
                  disabled={loginSubmitting || !nickInput.trim()}
                  aria-label="Login"
                  className="neu-press grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,#d4ff80,#a8f040)] text-[#22331a] shadow-[var(--neu-out)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginSubmitting
                    ? <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#22331a]/25 border-t-[#22331a]" />
                    : <LogIn size={14} aria-hidden="true" />}
                </button>
              </form>
              <p className="mt-1 text-[11px] text-[#5a7048]">Login dulu untuk verifikasi username kamu terdaftar di server.</p>
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
          {isBedrock && <p className="mt-1 text-[11px] text-[#354530]">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>

        {/* Media-only fields */}
        {rank.key === 'MEDIA' && (
          <>
            <div>
              <FieldLabel required>Link / Username Akun Media Sosial</FieldLabel>
              <TextField value={socialLink} onChange={(e) => setSocialLink(e.target.value)} aria-label="Link / Username Akun Media Sosial" placeholder="https://tiktok.com/@username atau @username" />
            </div>
            <div>
              <FieldLabel required>Jumlah Follower / Subscriber</FieldLabel>
              <TextField
                type="number"
                min={MEDIA_MIN_FOLLOWERS}
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                placeholder={`Minimal ${MEDIA_MIN_FOLLOWERS.toLocaleString('id-ID')}`}
                aria-label="Jumlah Follower / Subscriber"
                className="font-mono"
              />
              {followerCount && parseInt(followerCount) < MEDIA_MIN_FOLLOWERS && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">
                  <AlertTriangle size={11} aria-hidden="true" /> Follower kamu belum mencapai minimal {MEDIA_MIN_FOLLOWERS.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </>
        )}

        <Button fullWidth size="sm" onClick={handleSend} disabled={!playerNick}>
          <Send size={13} aria-hidden="true" /> {playerNick ? 'Kirim Pendaftaran via WhatsApp' : 'Login dulu untuk daftar'}
        </Button>
      </div>
    </Modal>
  );
}

export function SpecialRanksSection() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="special-ranks" className="cv-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Special Ranks"
          title="Rank Gratis, Daftar Sekarang!"
          description="Rank Builder dan Media 100% gratis untuk player yang memenuhi syarat. Daftar langsung via WhatsApp."
        />

        <div className="neu-grid neu-grid-2 max-w-3xl mx-auto">
          {SPECIAL_RANKS.map((rank, i) => (
            <GlassCard
              key={rank.key}
              interactive
              data-aos={i === 0 ? 'fade-right' : 'fade-left'}
              data-aos-delay={i * 150}
              data-aos-duration="800"
            >
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="neu-icon h-11 w-11 rounded-[14px]">
                    {(() => { const Icon = RANK_ICONS[rank.icon]; return Icon ? <Icon size={20} aria-hidden="true" className="text-[#1d2b1f]" /> : null; })()}
                  </div>
                  <div>
                    <span className="neu-tag text-[0.6rem] font-bold uppercase tracking-wide text-[#4a5e3a]">FREE</span>
                    <h3 className="mt-0.5 font-display text-base font-bold text-[#1d2b1f]">{rank.name}</h3>
                    <p className="text-xs text-[#4a5e3a]">{rank.subtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#4a5e3a]">Benefit</p>
                    <ul className="flex flex-col gap-1.5">
                      {rank.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-1.5 text-[0.7rem] text-[#4a5e3a]">
                          <Check size={10} aria-hidden="true" className="mt-0.5 shrink-0 text-success-bright" /> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#4a5e3a]">Syarat</p>
                    <ul className="flex flex-col gap-1.5">
                      {rank.requirements.map((r) => (
                        <li key={r} className="flex items-start gap-1.5 text-[0.7rem] text-[#4a5e3a]">
                          <Check size={10} aria-hidden="true" className="mt-0.5 shrink-0 text-[#1d2b1f]" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button fullWidth variant="secondary" size="sm" onClick={() => setSelected(rank)}>
                  {rank.ctaLabel} <ChevronRight size={13} aria-hidden="true" />
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
