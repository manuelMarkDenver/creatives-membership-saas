/**
 * Formats a number as Philippine Peso currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatPHP(amount: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(amount)
}

/**
 * Formats a number as PHP currency without decimals
 * @param amount - The amount to format
 * @returns Formatted currency string without decimals
 */
export function formatPHPCompact(amount: number): string {
  return formatPHP(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Formats a large amount with abbreviated units (K, M, B)
 * @param amount - The amount to format
 * @returns Formatted currency string with units
 */
export function formatPHPWithUnits(amount: number): string {
  if (amount >= 1_000_000_000) {
    return formatPHP(amount / 1_000_000_000, { maximumFractionDigits: 1 }) + 'B'
  }
  if (amount >= 1_000_000) {
    return formatPHP(amount / 1_000_000, { maximumFractionDigits: 1 }) + 'M'
  }
  if (amount >= 1_000) {
    return formatPHP(amount / 1_000, { maximumFractionDigits: 1 }) + 'K'
  }
  return formatPHP(amount)
}
