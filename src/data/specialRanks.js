export const SPECIAL_RANKS = [
  {
    key: 'BUILDER',
    name: 'Builder',
    subtitle: 'Rank Khusus Builder',
    icon: 'HardHat',
    benefits: ['Prefix [BUILDER] eksklusif', 'Fitur Fly di area claim'],
    requirements: ['Memiliki bangunan besar dan keren', 'Bangunan akan direview Staff'],
    ctaLabel: 'Daftar Builder',
    rulesTitle: 'Syarat Rank BUILDER',
    rules: [
      'Kamu harus sudah membangun bangunan yang besar dan keren di dalam server AeroBlast. Minimal 150 x 150 block',
      'Bangunan akan di-review langsung oleh Staff',
      'Dilarang menggunakan bangunan orang lain',
      'Rank Builder dapat dicabut kapan saja jika ditemukan pelanggaran',
    ],
  },
  {
    key: 'MEDIA',
    name: 'Media',
    subtitle: 'Rank Khusus Content Creator',
    icon: 'Video',
    benefits: ['Prefix [MEDIA] eksklusif', 'Akses /fly untuk cinematic', 'Izin share link konten'],
    requirements: ['Upload/live streaming di server', 'Minimal 1.000 follower/subscriber'],
    ctaLabel: 'Daftar Media',
    rulesTitle: 'Syarat Rank MEDIA',
    rules: [
      'Kamu harus sudah mengupload video atau live streaming tentang server AeroBlast',
      'Akun harus memiliki minimal 1.000 follower/subscriber',
      'Konten tidak boleh mengandung unsur negatif atau SARA',
      'Rank Media dapat dicabut kapan saja jika creator tidak aktif',
    ],
  },
];

// `value` is what actually gets sent in the WhatsApp message (matches the
// legacy <option value="..."> attribute); `label` is what's shown on screen.
export const REQUEST_CATEGORIES = [
  { value: 'Plugin Baru', label: 'Plugin Baru' },
  { value: 'Fitur Gameplay', label: 'Fitur Gameplay' },
  { value: 'Event / Konten', label: 'Event / Konten' },
  { value: 'Perbaikan', label: 'Perbaikan / Balance' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export const REPORT_CATEGORIES = [
  { value: 'Cheat / Hack', label: 'Cheat / Hack' },
  { value: 'Grief / Pencurian', label: 'Grief / Pencurian' },
  { value: 'Spam / Flood Chat', label: 'Spam / Flood Chat' },
  { value: 'Kata Kasar / Toxic', label: 'Kata Kasar / Toxic' },
  { value: 'Scam', label: 'Scam Sesama Pemain' },
  { value: 'Bug Abuse', label: 'Bug Abuse' },
  { value: 'Lainnya', label: 'Lainnya' },
];
