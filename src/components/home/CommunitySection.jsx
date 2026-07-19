import { useState } from 'react';
import { MessageCircle, Gamepad2, Lightbulb, AlertTriangle, ArrowRight, Send } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FieldLabel, SelectField, TextareaField, TextField } from '@/components/ui/FormFields';
import { REQUEST_CATEGORIES, REPORT_CATEGORIES } from '@/data/specialRanks';
import { SITE } from '@/data/config';
import { buildRequestMessage, buildReportMessage, openWhatsApp } from '@/utils/whatsapp';
import { useToast } from '@/context/ToastContext';

function RequestModal({ open, onClose }) {
  const showToast = useToast();
  const [nick, setNick] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  function handleSend() {
    if (!nick.trim()) return showToast('Masukkan nickname!', 'error');
    if (!category) return showToast('Pilih kategori!', 'error');
    if (!description.trim()) return showToast('Masukkan deskripsi request!', 'error');
    openWhatsApp(buildRequestMessage({ nick: nick.trim(), category, description: description.trim() }));
  }

  return (
    <Modal open={open} onClose={onClose} title="Kirim Request" badge="COMMUNITY">
      <div className="mt-5 flex flex-col gap-4">
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Username in-game" /></div>
        <div>
          <FieldLabel required>Kategori</FieldLabel>
          <SelectField value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">-- Pilih Kategori --</option>
            {REQUEST_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectField>
        </div>
        <div><FieldLabel required>Deskripsi Request</FieldLabel><TextareaField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan ide atau request kamu secara detail..." /></div>
        <Button fullWidth size="sm" onClick={handleSend}>
          <Send size={13} /> Kirim Request
        </Button>
      </div>
    </Modal>
  );
}

function ReportModal({ open, onClose }) {
  const showToast = useToast();
  const [nick, setNick] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  function handleSend() {
    if (!nick.trim()) return showToast('Masukkan nickname pelapor!', 'error');
    if (!target.trim()) return showToast('Masukkan nickname yang dilaporkan!', 'error');
    if (!category) return showToast('Pilih kategori pelanggaran!', 'error');
    if (!description.trim()) return showToast('Masukkan deskripsi laporan!', 'error');
    openWhatsApp(buildReportMessage({ nick: nick.trim(), target: target.trim(), category, description: description.trim() }));
  }

  return (
    <Modal open={open} onClose={onClose} title="Laporkan Pemain" badge="REPORT">
      <div className="mt-5 flex flex-col gap-4">
        <div><FieldLabel required>Nickname Kamu (Pelapor)</FieldLabel><TextField value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Username in-game kamu" /></div>
        <div><FieldLabel required>Nickname yang Dilaporkan</FieldLabel><TextField value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Username pemain yang dilaporkan" /></div>
        <div>
          <FieldLabel required>Jenis Pelanggaran</FieldLabel>
          <SelectField value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">-- Pilih Pelanggaran --</option>
            {REPORT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectField>
        </div>
        <div><FieldLabel required>Detail Kejadian</FieldLabel><TextareaField value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan kejadian secara detail (sertakan bukti screenshot jika ada)" /></div>
        <Button fullWidth variant="danger" size="sm" onClick={handleSend}>
          <AlertTriangle size={13} /> Kirim Laporan
        </Button>
      </div>
    </Modal>
  );
}

export function CommunitySection() {
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <section id="community" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Komunitas"
          title="Bergabung & Berkontribusi"
          description="Jadilah bagian dari komunitas AeroBlast. Kirim request, laporkan pemain, atau bergabung di platform kami."
          data-aos="fade-up"
          data-aos-duration="800"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* WhatsApp Group */}
          <GlassCard interactive as="a" href={SITE.social.whatsapp} target="_blank" rel="noopener noreferrer" className="p-5" data-aos="fade-right" data-aos-duration="800">
            <div className="flex flex-col gap-3 h-full">
              <div className="grid h-10 w-10 place-items-center rounded-md border border-success/25 bg-success/8">
                <MessageCircle size={18} className="text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-bold text-[#1d2b1f] mb-1">Grup WhatsApp</h3>
                <p className="text-xs text-[#4a5e3a]">Bergabung ke grup WA komunitas AeroBlast untuk update dan diskusi.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                Bergabung Sekarang <ArrowRight size={11} />
              </span>
            </div>
          </GlassCard>

          {/* Discord */}
          <GlassCard interactive as="a" href={SITE.social.discord} target="_blank" rel="noopener noreferrer" className="p-5" data-aos="fade-up" data-aos-delay="100" data-aos-duration="800">
            <div className="flex flex-col gap-3 h-full">
              <div className="grid h-10 w-10 place-items-center rounded-md border border-[#BFFF5E]/35 bg-[#BFFF5E]/10">
                <Gamepad2 size={18} className="text-[#1d2b1f]" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-bold text-[#1d2b1f] mb-1">Server Discord</h3>
                <p className="text-xs text-[#4a5e3a]">Join Discord untuk support, pengumuman event, dan komunitas aktif.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d2b1f]">
                Join Discord <ArrowRight size={11} />
              </span>
            </div>
          </GlassCard>

          {/* Request Feature */}
          <GlassCard interactive className="p-5 cursor-pointer" onClick={() => setRequestOpen(true)} data-aos="fade-left" data-aos-delay="200" data-aos-duration="800">
            <div className="flex flex-col gap-3 h-full">
              <div className="grid h-10 w-10 place-items-center rounded-md border border-[#4a5e3a]/30 bg-[#4a5e3a]/10">
                <Lightbulb size={18} className="text-[#354530]" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-bold text-[#1d2b1f] mb-1">Request Fitur</h3>
                <p className="text-xs text-[#4a5e3a]">Punya ide atau saran untuk server? Kirim request ke Admin.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#354530]">
                Kirim Request <ArrowRight size={11} />
              </span>
            </div>
          </GlassCard>

          {/* Report Player */}
          <GlassCard interactive className="p-5 cursor-pointer sm:col-span-2 lg:col-span-3" onClick={() => setReportOpen(true)} data-aos="fade-up" data-aos-delay="300" data-aos-duration="800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-danger/18 bg-danger/8">
                <AlertTriangle size={18} className="text-danger-bright" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-sm font-bold text-[#1d2b1f] mb-1">Laporkan Pemain</h3>
                <p className="text-xs text-[#4a5e3a]">Ada pemain yang cheating, griefing, atau berperilaku toxic? Laporkan ke Admin sekarang.</p>
              </div>
              <Button variant="danger" size="sm" className="shrink-0">
                <AlertTriangle size={12} /> Lapor Sekarang
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      <RequestModal open={requestOpen} onClose={() => setRequestOpen(false)} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </section>
  );
}
