export function cn(...classes) {
  return classes.flatMap((value) => {
    if (!value) return [];
    if (typeof value === 'string') return value.split(' ');
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') {
      return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => key);
    }
    return [];
  }).join(' ');
}
