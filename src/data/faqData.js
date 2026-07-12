/**
 * Each FAQ answer is a list of content "blocks" rendered by <FaqAnswer>:
 *  - { type: 'p', text }              paragraph (supports **bold** and [[label|href]] links)
 *  - { type: 'reasons', items }       bulleted list with a colored dot: { color, text }
 *  - { type: 'info', rows }          label/value pairs (IP/Port style): { label, value }
 */
export const FAQ_CATEGORIES = [
  {
    icon: 'Wifi',
    title: 'Join & Teknis',
    items: [
      {
        question: 'Bagaimana cara join server AeroBlast?',
        answer: [
          { type: 'p', text: 'Buka Minecraft lalu pilih **Multiplayer → Add Server** dan masukkan:' },
          { type: 'info', rows: [{ label: 'IP', value: 'aeroblast.my.id' }, { label: 'Port', value: '25543' }] },
          { type: 'p', text: 'Mendukung **Java Edition** (1.20–1.21+) dan **Bedrock / PE**. Untuk Bedrock, masukkan IP dan port secara terpisah di menu External Server.' },
        ],
      },
      {
        question: 'Versi Minecraft berapa yang didukung?',
        answer: [
          { type: 'p', text: 'AeroBlast mendukung **Java Edition 1.20 hingga 1.21+** dan **Bedrock / Pocket Edition** versi 1.21.11+. Jika ada masalah versi, coba update Minecraft kamu ke versi terbaru.' },
        ],
      },
      {
        question: 'Kenapa saya tidak bisa masuk server?',
        answer: [
          { type: 'p', text: 'Coba periksa hal berikut:' },
          {
            type: 'reasons',
            items: [
              { color: 'blue', text: 'Pastikan IP dan Port sudah benar: **aeroblast.my.id : 25543**' },
              { color: 'blue', text: 'Cek status server di halaman utama — mungkin sedang maintenance.' },
              { color: 'blue', text: 'Pastikan koneksi internet kamu stabil.' },
              { color: 'yellow', text: 'Jika kamu menggunakan VPN, coba matikan dulu.' },
              { color: 'red', text: 'Jika masih tidak bisa, kemungkinan akunmu terkena ban — hubungi Admin.' },
            ],
          },
        ],
      },
      {
        question: 'Kenapa saya kena kick atau ban?',
        answer: [
          { type: 'p', text: 'Ada beberapa kemungkinan penyebabnya:' },
          {
            type: 'reasons',
            items: [
              { color: 'yellow', text: '**Kick otomatis** — tidak aktif terlalu lama (AFK tanpa pool), atau koneksi terputus.' },
              { color: 'yellow', text: '**Ban sementara** — melanggar rules seperti spam, toxic, atau griefing.' },
              { color: 'red', text: '**Ban permanen** — cheat, exploit bug, atau pelanggaran berat lainnya.' },
            ],
          },
          { type: 'p', text: 'Jika merasa tidak melanggar, hubungi Admin melalui **WhatsApp atau Discord** untuk klarifikasi dan proses banding.' },
        ],
      },
      {
        question: 'Apakah ada backup data pemain?',
        answer: [
          { type: 'p', text: 'Ya, server AeroBlast melakukan backup data secara berkala. Namun item yang hilang akibat **kelalaian pemain sendiri** (misal: jatuh ke lava, terkena mob) **tidak bisa dikembalikan**. Backup hanya digunakan untuk pemulihan server jika terjadi crash atau error teknis.' },
        ],
      },
    ],
  },
  {
    icon: 'Gamepad2',
    title: 'Gameplay & Fitur',
    items: [
      {
        question: 'Bagaimana cara claim land agar base tidak kena grief?',
        answer: [
          { type: 'p', text: 'Gunakan **Golden Shovel** (cangkul emas) untuk klaim area:' },
          {
            type: 'reasons',
            items: [
              { color: 'blue', text: 'Klik pojok pertama tanah yang mau diklaim.' },
              { color: 'blue', text: 'Klik pojok kedua (diagonal) untuk menyelesaikan klaim.' },
              { color: 'green', text: 'Gunakan **/trust [nama]** untuk memberi akses teman.' },
              { color: 'green', text: 'Gunakan **/trustlist** untuk melihat siapa saja yang punya akses.' },
              { color: 'red', text: 'Gunakan **/abandonclaim** / **/unclaim** untuk menghapus klaim.' },
            ],
          },
          { type: 'p', text: 'Area yang sudah diklaim **otomatis terlindungi** — pemain lain tidak bisa merusak atau mengambil item di dalamnya.' },
        ],
      },
      {
        question: 'Cara kerja Jobs dan bagaimana cara mulai?',
        answer: [
          { type: 'p', text: 'Jobs adalah sistem profesi yang memberi kamu **uang & XP** dari aktivitas in-game:' },
          {
            type: 'reasons',
            items: [
              { color: 'blue', text: 'Ketik **/jobs browse** untuk lihat semua profesi yang tersedia.' },
              { color: 'green', text: 'Ketik **/jobs join [nama job]** untuk bergabung.' },
              { color: 'blue', text: 'Kamu bisa bergabung di beberapa job sekaligus.' },
              { color: 'yellow', text: 'Semakin tinggi level job, semakin besar penghasilan per aksi.' },
            ],
          },
          { type: 'p', text: 'Contoh: Job **Miner** membayarmu setiap kali menambang ore. Job **Farmer** membayarmu setiap harvest tanaman.' },
        ],
      },
      {
        question: 'Apa itu Skill System dan cara meningkatkannya?',
        answer: [
          { type: 'p', text: 'Skill System adalah sistem RPG yang memberi kemampuan pasif unik. Ada **11 skill** yang bisa ditingkatkan:' },
          {
            type: 'reasons',
            items: [
              { color: 'purple', text: 'Mining, Farming, Fighting, Archery, Excavation, Fishing, Foraging, Agility, Alchemy, Defense, Enchanting.' },
              { color: 'green', text: 'Skill naik otomatis sesuai aktivitas — mining = naik Mining Skill, dst.' },
              { color: 'blue', text: 'Ketik **/skills** untuk melihat semua skill dan levelmu saat ini.' },
            ],
          },
          { type: 'p', text: 'Makin tinggi level skill, makin besar **bonus dan kemampuan pasif** yang kamu dapatkan.' },
        ],
      },
      {
        question: 'Cara membuat warp publik untuk toko atau farm?',
        answer: [
          {
            type: 'reasons',
            items: [
              { color: 'green', text: 'Pergi ke lokasi yang ingin dijadikan warp.' },
              { color: 'green', text: 'Ketik **/pwarp create [nama warp]** untuk membuat warp.' },
              { color: 'blue', text: 'Pemain lain bisa ketik **/pwarp [nama warp]** untuk teleport ke sana.' },
              { color: 'blue', text: 'Ketik **/pwarp** untuk melihat semua warp yang ada.' },
              { color: 'red', text: 'Ketik **/pwarp remove [nama]** untuk menghapus warpmu.' },
            ],
          },
        ],
      },
      {
        question: 'Apakah ada fitur teleport ke rumah?',
        answer: [
          {
            type: 'reasons',
            items: [
              { color: 'green', text: 'Ketik **/sethome** untuk menyimpan lokasi saat ini sebagai home.' },
              { color: 'blue', text: 'Ketik **/home** untuk teleport ke home.' },
              { color: 'blue', text: 'Kamu bisa punya beberapa home: **/sethome [nama]** dan **/home [nama]**.' },
              { color: 'yellow', text: 'Teleport memiliki cooldown singkat setelah digunakan.' },
            ],
          },
        ],
      },
    ],
  },
  {
    icon: 'Coins',
    title: 'Ekonomi & Store',
    items: [
      {
        question: 'Cara dapat uang in-game selain beli di store?',
        answer: [
          { type: 'p', text: 'Ada banyak cara gratis mendapatkan uang in-game:' },
          {
            type: 'reasons',
            items: [
              { color: 'green', text: '**Jobs** — kerjakan profesimu dan dapat money otomatis.' },
              { color: 'green', text: '**Vote harian** — dapat 15.000 balance per vote.' },
              { color: 'green', text: '**Daily reward** — login tiap hari untuk klaim reward.' },
              { color: 'green', text: '**Jual item** — lewat shop, Quick Shop, atau Auction House.' },
              { color: 'blue', text: '**Quest** — selesaikan misi harian/mingguan.' },
            ],
          },
        ],
      },
      {
        question: 'Bagaimana cara buka toko sendiri dengan Quick Shop?',
        answer: [
          {
            type: 'reasons',
            items: [
              { color: 'blue', text: 'Buat chest dan taruh item yang mau dijual di dalamnya.' },
              { color: 'blue', text: 'Klik chest sambil pegang item, lalu ketik **/qs**.' },
              { color: 'green', text: 'Atur harga jual sesuai keinginanmu.' },
              { color: 'green', text: 'Pemain lain bisa langsung klik chest tokomu untuk beli.' },
              { color: 'yellow', text: 'Pastikan chest berada di dalam area claimmu agar aman.' },
            ],
          },
          { type: 'p', text: 'Kamu juga bisa buat toko **beli item** (sebagai pembeli) dengan cara yang sama.' },
        ],
      },
      {
        question: 'Cara dapat Key gacha selain beli?',
        answer: [
          { type: 'p', text: 'Kamu bisa dapat Key secara gratis melalui:' },
          {
            type: 'reasons',
            items: [
              { color: 'green', text: '**Vote harian** — dapat 5 Basic Key + 1 Vote Key per vote.' },
              { color: 'green', text: '**Daily reward** — streak login tertentu memberikan Key.' },
              { color: 'purple', text: '**Exchange** — kamu bisa tukar key di **/keyc**.' },
              { color: 'purple', text: '**Balance** — kamu bisa beli key di **/keys**.' },
              { color: 'blue', text: '**Event server** — event khusus sering memberikan Key langka.' },
              { color: 'purple', text: '**Beli di Store** — untuk Key premium dan dalam jumlah besar.' },
            ],
          },
        ],
      },
      {
        question: 'Apa beda tiap tingkatan rank yang dijual di Store?',
        answer: [
          { type: 'p', text: 'Setiap rank memiliki **keistimewaan dan harga berbeda**. Semakin tinggi rank, semakin banyak fitur eksklusif yang didapat seperti:' },
          {
            type: 'reasons',
            items: [
              { color: 'blue', text: 'Prefix berwarna eksklusif di chat dan tab.' },
              { color: 'green', text: 'Akses fitur khusus seperti /fly, /nick, /hat, dll.' },
              { color: 'purple', text: 'Bonus claim blocks, home slots, dan warp slots lebih banyak.' },
              { color: 'yellow', text: 'Akses kit eksklusif dan reward tambahan.' },
            ],
          },
          { type: 'p', text: 'Kunjungi [[AeroBlast Store|/store]] untuk melihat detail dan perbandingan lengkap setiap rank.' },
        ],
      },
      {
        question: 'Apakah rank yang dibeli bisa hilang atau expired?',
        answer: [
          { type: 'p', text: 'Rank yang dibeli di AeroBlast Store bersifat **permanen** — tidak ada expired date. Namun rank dapat **dicabut** jika pemain terbukti melanggar rules server secara serius. Pastikan selalu mematuhi peraturan untuk menjaga rank kamu.' },
        ],
      },
    ],
  },
  {
    icon: 'Medal',
    title: 'Rank & Pendaftaran',
    items: [
      {
        question: 'Bagaimana cara daftar rank Builder atau Media?',
        answer: [
          { type: 'p', text: 'Klik tombol daftar di section [[Special Ranks|/#special-ranks]] di halaman utama, lalu ikuti langkahnya:' },
          {
            type: 'reasons',
            items: [
              { color: 'yellow', text: '**Builder** — harus sudah punya bangunan besar & keren di server, siap di-review Staff.' },
              { color: 'purple', text: '**Media** — harus sudah upload/live tentang server & punya 100+ follower/subscriber.' },
              { color: 'green', text: 'Kedua rank ini **100% gratis** dan diproses Admin via WhatsApp.' },
              { color: 'blue', text: 'Proses review biasanya 1 hari kerja.' },
            ],
          },
        ],
      },
      {
        question: 'Berapa lama proses verifikasi Builder/Media?',
        answer: [
          { type: 'p', text: 'Proses verifikasi biasanya memakan waktu **1 hari kerja** tergantung antrian dan ketersediaan Staff. Kamu akan dihubungi langsung via WhatsApp setelah proses selesai. Pastikan nomormu aktif dan bisa dihubungi.' },
        ],
      },
      {
        question: 'Apakah rank Builder/Media bisa dicabut?',
        answer: [
          { type: 'p', text: 'Ya, rank dapat dicabut kapan saja jika:' },
          {
            type: 'reasons',
            items: [
              { color: 'red', text: '**Builder** — melanggar rules, menghancurkan bangunan sendiri secara sengaja, atau tidak aktif lama.' },
              { color: 'red', text: '**Media** — membuat konten negatif tentang server, tidak aktif berkonten, atau follower turun di bawah syarat.' },
            ],
          },
          { type: 'p', text: 'Keputusan Staff bersifat **final**. Jika ada keberatan, bisa disampaikan via WhatsApp atau Discord secara sopan.' },
        ],
      },
    ],
  },
];

/** 3-item teaser shown inline on the homepage, linking out to the full /faq page. */
export const FAQ_HOME_PREVIEW = [FAQ_CATEGORIES[0].items[0], FAQ_CATEGORIES[0].items[3], FAQ_CATEGORIES[1].items[0]];
