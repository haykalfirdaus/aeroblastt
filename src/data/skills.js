/**
 * 11 skills across 3 categories. Each level costs `pricePerLevel`; the
 * order modal multiplies that by the level count the buyer chooses.
 */
export const SKILL_CATEGORIES = [
  {
    id: 'combat',
    label: 'Combat Skills',
    pricePerLevel: 3000,
    accent: 'combat',
    skills: [
      { name: 'Fighting', abilities: ['Parry', 'Sword Master', 'First Strike', 'Bleed', 'Lightning Blade'] },
      { name: 'Defense', abilities: ['Shielding', 'Mob Master', 'Immunity', 'No Debuff', 'Absorption'] },
      { name: 'Archery', abilities: ['Retrieval', 'Bow Master', 'Piercing', 'Stun', 'Charged Shot'] },
    ],
  },
  {
    id: 'semi',
    label: 'Semi-Combat Skills',
    pricePerLevel: 2500,
    accent: 'semi',
    skills: [
      { name: 'Agility', abilities: ['Light Fall', 'Jumper', 'Golden Heal', 'Fleeting', 'Meal Steal'] },
      { name: 'Alchemy', abilities: ['Alchemist', 'Life Steal', 'Golden Heart', 'Wise Effect', 'Brewer'] },
    ],
  },
  {
    id: 'gather',
    label: 'Gathering & Utility',
    pricePerLevel: 2000,
    accent: 'gather',
    skills: [
      { name: 'Farming', abilities: ['Bountiful Harvest', 'Farmer', 'Scythe Master', 'Geneticist', 'Replenish'] },
      { name: 'Foraging', abilities: ['Lumberjack', 'Axe Master', 'Valor', 'Shredder', 'Treecapitator'] },
      { name: 'Mining', abilities: ['Lucky Miner', 'Miner', 'Pick Master', 'Stamina', 'Speed Mine'] },
      { name: 'Fishing', abilities: ['Lucky Catch', 'Treasure Hunter', 'Grappler', 'Epic Catch', 'Sharp Hook'] },
      { name: 'Excavation', abilities: ['Bigger Scoop', 'Spade Master', 'Metal Detector', 'Lucky Spades', 'Terraform'] },
      { name: 'Enchanting', abilities: ['XP Convert', 'Enchanter', 'Anvil Master', 'Enchanted Strength', 'Lucky Table'] },
    ],
  },
];

export const SKILL_MAX_LEVEL = 100;
export const SKILL_DEFAULT_LEVELS = 10;
