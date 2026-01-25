/**
 * Date range utilities for web-intel dashboard
 * This file has NO 'use client' directive so it can be used in both server and client components
 */

export type DateRange = '7d' | '30d' | '90d';

/**
 * Parse date range from URL or return default
 */
export function parseDateRange(range: string | undefined): DateRange {
  if (range === '7d' || range === '30d' || range === '90d') {
    return range;
  }
  return '30d'; // Default
}

/**
 * Convert date range to days number
 */
export function rangeToDays(range: DateRange): number {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
  }
}
