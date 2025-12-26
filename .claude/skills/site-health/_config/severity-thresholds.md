# Severity Thresholds Configuration

## Score-Based Thresholds

### Lighthouse Scores
| Metric | Critical (🔴) | High (🟠) | Medium (🟡) | Good (🟢) |
|--------|---------------|-----------|-------------|-----------|
| Performance | < 30 | 30-49 | 50-89 | 90-100 |
| Accessibility | < 50 | 50-69 | 70-89 | 90-100 |
| Best Practices | < 50 | 50-69 | 70-89 | 90-100 |
| SEO | < 50 | 50-69 | 70-89 | 90-100 |

### Core Web Vitals
| Metric | Poor (🔴) | Needs Improvement (🟡) | Good (🟢) |
|--------|-----------|------------------------|-----------|
| LCP | > 4.0s | 2.5s - 4.0s | < 2.5s |
| FID | > 300ms | 100ms - 300ms | < 100ms |
| INP | > 500ms | 200ms - 500ms | < 200ms |
| CLS | > 0.25 | 0.1 - 0.25 | < 0.1 |

### Additional Performance Metrics
| Metric | Poor | Moderate | Good |
|--------|------|----------|------|
| TTFB | > 800ms | 200-800ms | < 200ms |
| FCP | > 3.0s | 1.8s - 3.0s | < 1.8s |
| Speed Index | > 5.8s | 3.4s - 5.8s | < 3.4s |
| TBT | > 600ms | 200-600ms | < 200ms |
| TTI | > 7.3s | 3.8s - 7.3s | < 3.8s |

## Count-Based Thresholds

### Crawl & Indexation Issues
| Issue Type | Critical | High | Medium | Low |
|------------|----------|------|--------|-----|
| Crawl Errors (4xx/5xx) | > 100 | 25-100 | 5-25 | < 5 |
| Pages Excluded from Index | > 50% | 25-50% | 10-25% | < 10% |
| Redirect Chains | > 50 | 20-50 | 5-20 | < 5 |
| Broken Internal Links | > 20 | 10-20 | 5-10 | < 5 |

### Accessibility Issues
| Issue Type | Critical | High | Medium | Low |
|------------|----------|------|--------|-----|
| Missing Alt Text | > 50% | 25-50% | 10-25% | < 10% |
| Color Contrast Failures | > 20 | 10-20 | 5-10 | < 5 |
| ARIA Violations | > 30 | 15-30 | 5-15 | < 5 |

### Security Issues
| Issue Type | Severity |
|------------|----------|
| No HTTPS | Critical |
| Mixed Content | High |
| Vulnerable Libraries | High |
| Missing Security Headers | Medium |

## Trend-Based Thresholds

### Ranking Changes
| Change | Severity |
|--------|----------|
| > 10 position drop on priority keyword | Critical |
| 5-10 position drop on priority keyword | High |
| 2-5 position drop on priority keyword | Medium |
| Any position drop | Monitor |

### Traffic Changes
| Change | Severity |
|--------|----------|
| > 30% organic traffic drop WoW | Critical |
| 15-30% organic traffic drop WoW | High |
| 5-15% organic traffic drop WoW | Medium |

### Indexation Changes
| Change | Severity |
|--------|----------|
| > 20% pages deindexed | Critical |
| 10-20% pages deindexed | High |
| 5-10% pages deindexed | Medium |
