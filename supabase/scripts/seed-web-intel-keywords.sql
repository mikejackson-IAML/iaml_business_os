-- Seed initial keywords for Web Intelligence tracking
-- Run this after creating the web_intel schema
-- Customize keywords for your specific business

-- Clear existing (if re-seeding)
-- DELETE FROM web_intel.tracked_keywords;

-- Brand Keywords (High Priority)
INSERT INTO web_intel.tracked_keywords (keyword, priority, category, target_url) VALUES
('iaml', 'high', 'brand', '/'),
('iaml training', 'high', 'brand', '/'),
('institute for applied management and law', 'high', 'brand', '/'),
('iaml hr training', 'high', 'brand', '/programs')
ON CONFLICT (keyword) DO NOTHING;

-- Program Keywords (High Priority)
INSERT INTO web_intel.tracked_keywords (keyword, priority, category, target_url) VALUES
('hr certification programs', 'high', 'program', '/programs'),
('employment law training', 'high', 'program', '/programs/employment-law'),
('hr compliance training', 'high', 'program', '/programs/hr-compliance'),
('workplace investigation training', 'high', 'program', '/programs/workplace-investigations'),
('supervisor training program', 'high', 'program', '/programs/supervisor-training'),
('diversity and inclusion training', 'high', 'program', '/programs/dei'),
('harassment prevention training', 'high', 'program', '/programs/harassment-prevention'),
('labor relations training', 'high', 'program', '/programs/labor-relations'),
('hr fundamentals course', 'high', 'program', '/programs/hr-fundamentals'),
('performance management training', 'high', 'program', '/programs/performance-management')
ON CONFLICT (keyword) DO NOTHING;

-- Industry Keywords (Medium Priority)
INSERT INTO web_intel.tracked_keywords (keyword, priority, category, target_url) VALUES
('hr training courses', 'medium', 'industry', '/programs'),
('hr professional development', 'medium', 'industry', '/programs'),
('corporate training programs', 'medium', 'industry', '/programs'),
('employee training programs', 'medium', 'industry', '/programs'),
('management training courses', 'medium', 'industry', '/programs'),
('leadership development training', 'medium', 'industry', '/programs'),
('hr certification online', 'medium', 'industry', '/programs'),
('employment law courses', 'medium', 'industry', '/programs/employment-law'),
('california employment law training', 'medium', 'industry', '/programs/employment-law'),
('hr continuing education', 'medium', 'industry', '/programs')
ON CONFLICT (keyword) DO NOTHING;

-- Long-tail Keywords (Medium Priority)
INSERT INTO web_intel.tracked_keywords (keyword, priority, category, target_url) VALUES
('how to conduct workplace investigation', 'medium', 'longtail', '/programs/workplace-investigations'),
('hr training for managers', 'medium', 'longtail', '/programs/supervisor-training'),
('harassment prevention training california', 'medium', 'longtail', '/programs/harassment-prevention'),
('supervisor training for new managers', 'medium', 'longtail', '/programs/supervisor-training'),
('hr compliance training online', 'medium', 'longtail', '/programs/hr-compliance'),
('dei training for employees', 'medium', 'longtail', '/programs/dei'),
('labor relations certification', 'medium', 'longtail', '/programs/labor-relations'),
('shrm continuing education credits', 'medium', 'longtail', '/programs'),
('hrci recertification credits', 'medium', 'longtail', '/programs'),
('virtual hr training programs', 'medium', 'longtail', '/programs')
ON CONFLICT (keyword) DO NOTHING;

-- Competitor Keywords (Low Priority - for monitoring)
INSERT INTO web_intel.tracked_keywords (keyword, priority, category, target_url) VALUES
('shrm training', 'low', 'competitor', '/programs'),
('hrci certification', 'low', 'competitor', '/programs'),
('atd training', 'low', 'competitor', '/programs'),
('shrm learning system', 'low', 'competitor', '/programs'),
('hr certificate programs', 'low', 'competitor', '/programs')
ON CONFLICT (keyword) DO NOTHING;

-- Verify count
SELECT
  category,
  priority,
  COUNT(*) as keyword_count
FROM web_intel.tracked_keywords
GROUP BY category, priority
ORDER BY
  CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  category;
