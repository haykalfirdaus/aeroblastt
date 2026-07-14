import * as icons from 'lucide-react';

/**
 * Renders a lucide-react icon by name, e.g. <Icon name="Rocket" size={20} />.
 * Lets data files (ranks, features, commands...) reference icons as plain
 * strings instead of importing JSX, keeping them trivially serializable.
 */
export function Icon({ name, className, size = 20, strokeWidth = 2 }) {
  const Component = icons[name];
  if (!Component) return null;
  return <Component className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}
