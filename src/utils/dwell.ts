/**
 * Real-Time Container Dwell Time and Demurrage Computation Utility
 * Calculates live elapsed dwell days based on actual real-time clock timestamps.
 */

/**
 * Computes exact dwell days according to the stock report formula:
 * =$R$1 - H155 + 1
 * where $R$1 is the current report date (real-time Date or exit date) and H155 is the container arrival date.
 * The +1 represents inclusive calendar day counting (day of arrival is Day 1).
 *
 * @param entryTimestamp ISO string of when container arrived/turned in (H155)
 * @param exitTimestamp Optional ISO string if container was gated out
 * @param nowMs Current real-time timestamp in milliseconds ($R$1, defaults to Date.now())
 * @returns Number of elapsed dwell days: ($R$1 - H155) + 1
 */
export function parseDateSafe(dateInput?: string | Date | number | null): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'number') return new Date(dateInput);

  const str = String(dateInput).trim();
  // Check if DD/MM/YYYY or DD-MM-YYYY format
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(str)) {
    const parts = str.split(/[/-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2].slice(0, 4), 10);
    return new Date(Date.UTC(year, month, day));
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

export function calculateRealTimeDwellDays(
  entryTimestamp: string,
  exitTimestamp?: string | null,
  nowMs: number = Date.now()
): number {
  if (!entryTimestamp) return 1;
  const entryDate = parseDateSafe(entryTimestamp);
  if (isNaN(entryDate.getTime())) return 1;

  // $R$1: Exit timestamp if gated out, otherwise current real-time clock
  const refDate = exitTimestamp ? parseDateSafe(exitTimestamp) : new Date(nowMs);
  if (isNaN(refDate.getTime())) return 1;

  // Calendar dates at UTC midnight (matching Excel date serial subtraction $R$1 - H155)
  const refUtcMidnight = Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate());
  const entryUtcMidnight = Date.UTC(entryDate.getUTCFullYear(), entryDate.getUTCMonth(), entryDate.getUTCDate());

  const dayDifference = Math.floor((refUtcMidnight - entryUtcMidnight) / (1000 * 60 * 60 * 24));

  // Formula: =$R$1 - H155 + 1 (minimum 1 day for inclusive arrival date)
  return Math.max(1, dayDifference + 1);
}

/**
 * Provides human-readable breakdown of dwell with reference to the =$R$1 - H155 + 1 formula.
 */
export function getDetailedDwellBreakdown(
  entryTimestamp: string,
  exitTimestamp?: string | null,
  nowMs: number = Date.now()
): {
  days: number;
  formulaText: string;
  reportDateStr: string;
  arrivalDateStr: string;
  label: string;
} {
  const days = calculateRealTimeDwellDays(entryTimestamp, exitTimestamp, nowMs);
  const entryDate = new Date(entryTimestamp);
  const refDate = exitTimestamp ? new Date(exitTimestamp) : new Date(nowMs);

  const reportDateStr = !isNaN(refDate.getTime()) 
    ? refDate.toLocaleDateString('en-GB') 
    : 'Today';
  const arrivalDateStr = !isNaN(entryDate.getTime()) 
    ? entryDate.toLocaleDateString('en-GB') 
    : '-';

  return {
    days,
    formulaText: `=$R$1 - H155 + 1 (${reportDateStr} - ${arrivalDateStr} + 1)`,
    reportDateStr,
    arrivalDateStr,
    label: `${days} ${days === 1 ? 'day' : 'days'}`
  };
}

/**
 * Calculates demurrage fee based on dwell days, free days tier, and daily rate.
 */
export function calculateDemurrage(
  dwellDays: number,
  freeDays: number = 5,
  ratePerDayUsd: number = 115
): {
  isDemurring: boolean;
  overdueDays: number;
  demurrageAmountUsd: number;
} {
  const overdueDays = Math.max(0, dwellDays - freeDays);
  const isDemurring = overdueDays > 0;
  const demurrageAmountUsd = overdueDays * ratePerDayUsd;

  return {
    isDemurring,
    overdueDays,
    demurrageAmountUsd
  };
}
