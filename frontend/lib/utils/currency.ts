/**
 * Formats a number as Philippine Peso currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string with ₱ symbol
 */
export function formatPHP(amount: number, options: Intl.NumberFormatOptions = {}): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₱0'
  }
  
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(amount)
  
  return `₱${formatted}`
}

/**
 * Formats a number as PHP currency without decimals
 * @param amount - The amount to format
 * @returns Formatted currency string without decimals
 */
export function formatPHPCompact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₱0'
  }
  
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
  
  return `₱${formatted}`
}

/**
 * Formats a large amount with abbreviated units (K, M, B)
 * @param amount - The amount to format
 * @returns Formatted currency string with units
 */
export function formatPHPWithUnits(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₱0'
  }
  
  if (amount >= 1_000_000_000) {
    const billions = (amount / 1_000_000_000).toFixed(1)
    return `₱${billions}B`
  }
  if (amount >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(1)
    return `₱${millions}M`
  }
  if (amount >= 1_000) {
    const thousands = (amount / 1_000).toFixed(1)
    return `₱${thousands}K`
  }
  return formatPHPCompact(amount)
}
