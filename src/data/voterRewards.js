export const REWARD_TIERS = [
  {
    id: 1,
    span: 2,
    tone: 'gold',
    pill: '#1 TOP VOTER',
    label: 'Juara Pertama',
    items: [
      { name: 'Rank Aviator', tag: 'PERMANENT', tone: 'rank' },
      { name: 'Vote Key', tag: '×5', tone: 'vote' },
      { name: 'Legend Key', tag: '×1', tone: 'legend' },
    ],
    orLabel: 'ATAU JIKA SUDAH PUNYA RANK AVIATOR',
    orItems: [
      { name: 'Vote Key', tag: '×5', tone: 'vote' },
      { name: 'Legend Key', tag: '×1', tone: 'legend' },
      { name: 'Aerospace Key', tag: '×1', tone: 'aero' },
      { name: 'Fly Privilege', tag: '15 HARI', tone: 'fly' },
    ],
    note: 'Rank Aviator diberikan jika belum dimiliki. Jika sudah punya, akan diganti dengan paket alternatif di bawahnya yang lebih lengkap.',
  },
  {
    id: '2-3',
    tone: 'blue',
    pill: '#2 — #3',
    label: 'Runner Up',
    items: [
      { name: 'Aerospace Key', tag: '×1', tone: 'aero' },
      { name: 'Vote Key', tag: '×5', tone: 'vote' },
      { name: 'Legend Key', tag: '×1', tone: 'legend' },
    ],
  },
  {
    id: '4-5',
    tone: 'green',
    pill: '#4 — #5',
    label: 'Top 5',
    items: [
      { name: 'Legend Key', tag: '×1', tone: 'legend' },
      { name: 'Vote Key', tag: '×5', tone: 'vote' },
    ],
  },
  {
    id: '6-10',
    span: 2,
    tone: 'purple',
    pill: '#6 — #10',
    label: 'Top 10',
    items: [{ name: 'Vote Key', tag: '×10', tone: 'vote' }],
  },
];

const CHIP_REWARDS = {
  1: [{ tone: 'gold', text: 'Aviator Perma' }, { tone: 'blue', text: 'Vote Key ×5' }, { tone: 'orange', text: 'Legend ×1' }],
  2: [{ tone: 'green', text: 'Aerospace ×1' }, { tone: 'blue', text: 'Vote Key ×5' }, { tone: 'orange', text: 'Legend ×1' }],
  3: [{ tone: 'green', text: 'Aerospace ×1' }, { tone: 'blue', text: 'Vote Key ×5' }, { tone: 'orange', text: 'Legend ×1' }],
  4: [{ tone: 'orange', text: 'Legend ×1' }, { tone: 'blue', text: 'Vote Key ×5' }],
  5: [{ tone: 'orange', text: 'Legend ×1' }, { tone: 'blue', text: 'Vote Key ×5' }],
};

export function getChipsForRank(rank) {
  if (rank <= 5) return CHIP_REWARDS[rank] ?? [];
  if (rank <= 10) return [{ tone: 'purple', text: 'Vote Key ×10' }];
  return [];
}

export function getPodiumPrize(rank) {
  const map = {
    1: [{ tone: 'gold', text: 'Aviator' }, { tone: 'blue', text: 'Vote Key ×5' }, { tone: 'orange', text: 'Legend ×1' }],
    2: [{ tone: 'green', text: 'Aerospace ×1' }, { tone: 'blue', text: 'Vote Key ×5' }, { tone: 'orange', text: 'Legend ×1' }],
    3: [{ tone: 'green', text: 'Aerospace ×1' }, { tone: 'blue', text: 'Vote Key ×5' }, { tone: 'orange', text: 'Legend ×1' }],
  };
  return map[rank] ?? [];
}

export function getSeparatorLabel(index) {
  if (index === 0) return 'RANK #1 — TOP VOTER';
  if (index === 1) return 'RANK #2–3 — RUNNER UP';
  if (index === 3) return 'RANK #4–5 — TOP 5';
  if (index === 5) return 'RANK #6–10 — TOP 10';
  if (index === 10) return 'RANK #11+';
  return '';
}

export const DEMO_VOTERS = [
  { nickname: 'AeroPlayer1', votes: 87 },
  { nickname: 'NightWolf_', votes: 72 },
  { nickname: 'SkyBuilder99', votes: 65 },
  { nickname: 'CraftMaster', votes: 58 },
  { nickname: 'LunarStrike', votes: 49 },
  { nickname: 'VoidWalker', votes: 41 },
  { nickname: 'DarkMiner', votes: 37 },
  { nickname: 'IronForge', votes: 30 },
  { nickname: 'StarDust_', votes: 25 },
  { nickname: 'GoldRush42', votes: 19 },
  { nickname: 'SilverBolt', votes: 14 },
  { nickname: 'RedStone__', votes: 9 },
];

export function skinUrl(nickname, size = 80) {
  return `https://minotar.net/avatar/${encodeURIComponent(nickname)}/${size}`;
}
