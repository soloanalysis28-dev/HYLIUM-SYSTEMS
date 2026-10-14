/**
 * ISO 6346 Standard Check Digit Validator and Generator
 * Standard for Freight Containers - Coding, Identification and Marking
 */

const LETTER_VALUES: Record<string, number> = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
  K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
  U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38
};

/**
 * Calculates the ISO 6346 check digit for a 10-character container prefix + serial
 * @param code 10-character string (4 letters + 6 digits, e.g. "MSKU729183")
 * @returns check digit (0-9)
 */
export function calculateIsoCheckDigit(code: string): number {
  const sanitized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (sanitized.length < 10) return -1;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = sanitized[i];
    let val: number;
    if (/[A-Z]/.test(char)) {
      val = LETTER_VALUES[char] || 0;
    } else {
      val = parseInt(char, 10);
    }
    const weight = Math.pow(2, i);
    sum += val * weight;
  }

  const remainder = sum % 11;
  return remainder === 10 ? 0 : remainder;
}

/**
 * Validates a full 11-character container number
 * @param fullCode Container number e.g. "MSKU7291834" or "MSKU 729183-4"
 */
export function validateIsoContainerNumber(fullCode: string): {
  isValid: boolean;
  expectedCheckDigit: number;
  actualCheckDigit: number;
  cleanCode: string;
  formatted: string;
  message: string;
} {
  const clean = fullCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 11) {
    return {
      isValid: false,
      expectedCheckDigit: -1,
      actualCheckDigit: -1,
      cleanCode: clean,
      formatted: fullCode,
      message: 'Container number must be exactly 11 characters (4 letters, 6 digits, 1 check digit).'
    };
  }

  const prefix = clean.slice(0, 4);
  const serial = clean.slice(4, 10);
  const actualCheckDigit = parseInt(clean[10], 10);

  if (!/^[A-Z]{4}$/.test(prefix)) {
    return {
      isValid: false,
      expectedCheckDigit: -1,
      actualCheckDigit,
      cleanCode: clean,
      formatted: `${prefix} ${serial}-${actualCheckDigit}`,
      message: 'First 4 characters must be owner code letters (e.g. MSKU, MEDU, CMAU).'
    };
  }

  if (!/^\d{6}$/.test(serial)) {
    return {
      isValid: false,
      expectedCheckDigit: -1,
      actualCheckDigit,
      cleanCode: clean,
      formatted: `${prefix} ${serial}-${actualCheckDigit}`,
      message: 'Middle 6 characters must be numeric serial digits.'
    };
  }

  const expectedCheckDigit = calculateIsoCheckDigit(clean.slice(0, 10));
  const isValid = expectedCheckDigit === actualCheckDigit;

  return {
    isValid,
    expectedCheckDigit,
    actualCheckDigit,
    cleanCode: clean,
    formatted: `${prefix} ${serial}-${actualCheckDigit}`,
    message: isValid 
      ? 'Valid ISO 6346 Container Number.' 
      : `Check digit mismatch: Provided '${actualCheckDigit}', expected '${expectedCheckDigit}'.`
  };
}

/**
 * Generates a valid container number from a 4-letter prefix and 6-digit number
 */
export function generateValidContainerNumber(prefix: string, serial: string | number): string {
  const cleanPrefix = prefix.toUpperCase().padEnd(4, 'U').slice(0, 4);
  const cleanSerial = String(serial).padStart(6, '0').slice(0, 6);
  const checkDigit = calculateIsoCheckDigit(`${cleanPrefix}${cleanSerial}`);
  return `${cleanPrefix}${cleanSerial}${checkDigit}`;
}
