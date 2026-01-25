/**
 * Filter utilities for web-intel dashboard
 * This file has NO 'use client' directive so it can be used in both server and client components
 */

// Priority filter for keywords
export type KeywordPriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export function parsePriorityFilter(value: string | undefined): KeywordPriorityFilter {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'all';
}

// Alert type filter
export type AlertTypeFilterValue = 'all' | 'traffic' | 'ranking' | 'technical';

export function parseAlertTypeFilter(value: string | undefined): AlertTypeFilterValue {
  if (value === 'traffic' || value === 'ranking' || value === 'technical') {
    return value;
  }
  return 'all';
}

// Recommendation priority filter
export type RecommendationPriorityFilterValue = 'all' | 'high' | 'medium' | 'low';

export function parseRecommendationPriorityFilter(
  value: string | undefined
): RecommendationPriorityFilterValue {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'all';
}
