/**
 * Joins conditional class names together, skipping falsy values.
 * A minimal stand-in for `clsx` so we don't pull in an extra dependency
 * for something this small.
 *
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
