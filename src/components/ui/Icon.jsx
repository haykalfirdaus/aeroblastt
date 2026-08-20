import {
  ArrowRightLeft, Briefcase, CheckSquare, Clock, CloudSun, Coins, Crown, Dices, DoorOpen, Drumstick,
  Eye, Feather, Gamepad2, Gem, Ghost, Globe, Hammer, HardHat, Heart, Home, Key,
  Landmark, MapPin, Medal, Rocket, Sailboat, Satellite, ScrollText, ShieldHalf,
  Sparkles, Star, Store, Swords, TreePine, Trophy, Video, Wifi, Wrench, Zap,
} from 'lucide-react';

/**
 * Renders a lucide icon by name, e.g. <Icon name="Rocket" size={20} />.
 * Data files (ranks, features, commands…) reference icons as plain strings,
 * which keeps them trivially serializable.
 *
 * PERF: this used to be `import * as icons from 'lucide-react'`. A namespace
 * import defeats tree-shaking — the bundler cannot know which members are
 * reached through a computed `icons[name]` lookup, so it must keep the entire
 * library. The explicit map below covers only the 37 names actually referenced
 * across src/data/*.js, letting everything else be dropped from the bundle.
 *
 * If you add an `icon:` value to a data file, add it here too. An unknown name
 * renders nothing — the same failure mode as before.
 */
const ICONS = {
  ArrowRightLeft, Briefcase, CheckSquare, Clock, CloudSun, Coins, Crown, Dices, DoorOpen, Drumstick,
  Eye, Feather, Gamepad2, Gem, Ghost, Globe, Hammer, HardHat, Heart, Home, Key,
  Landmark, MapPin, Medal, Rocket, Sailboat, Satellite, ScrollText, ShieldHalf,
  Sparkles, Star, Store, Swords, TreePine, Trophy, Video, Wifi, Wrench, Zap,
};

export function Icon({ name, className, size = 20, strokeWidth = 2 }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}
