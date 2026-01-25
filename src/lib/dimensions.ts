/**
 * Convert inches to a human-readable feet and inches format
 * Examples:
 *   72 => "6'"
 *   78 => "6'6\""
 *   6 => "6\""
 *   0 => "0\""
 */
export function inchesToFeetInches(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;

  if (feet === 0) {
    return `${remainingInches}"`;
  }

  if (remainingInches === 0) {
    return `${feet}'`;
  }

  return `${feet}'${remainingInches}"`;
}

/**
 * Convert inches to a longer descriptive format
 * Examples:
 *   72 => "6 feet"
 *   78 => "6 feet 6 inches"
 *   6 => "6 inches"
 */
export function inchesToFeetInchesLong(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;

  if (feet === 0) {
    return `${remainingInches} ${remainingInches === 1 ? 'inch' : 'inches'}`;
  }

  if (remainingInches === 0) {
    return `${feet} ${feet === 1 ? 'foot' : 'feet'}`;
  }

  return `${feet} ${feet === 1 ? 'foot' : 'feet'} ${remainingInches} ${remainingInches === 1 ? 'inch' : 'inches'}`;
}
