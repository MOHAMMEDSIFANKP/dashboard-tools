
export function formatMicroIsoDate(
  raw: string | null | undefined,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' }
): string {
  if (typeof raw !== 'string') return '';
  const truncated = typeof raw === 'string' ? raw.slice(0, 23) : null;
  const date = truncated ? new Date(truncated) : null;
  return date ? date.toLocaleDateString() : '';
}
