// Utility to normalize strings for accent-insensitive comparisons.
// Strips diacritics and lowercases; keeps original characters otherwise.
export function normalizeDiacritics(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
