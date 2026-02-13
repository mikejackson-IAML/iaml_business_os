#!/usr/bin/env python3
"""
CSV Contact Filter — Classifies contacts as KEEP / REMOVE / REVIEW
based on job title relevance to HR director persona.

Usage:
  python3 filter_contacts.py analyze "input.csv"
  python3 filter_contacts.py filter "input.csv" "output_dir"
"""

import csv
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


# ──────────────────────────────────────────────────────────────
# CONFIGURATION: Adjust these lists to change filtering behavior
# ──────────────────────────────────────────────────────────────

# KEEP signals — title contains any of these → likely a real HR contact
KEEP_PATTERNS = [
    # Core HR
    r'human\s+resources?',
    r'\bhr\b',                    # word-boundary HR to avoid "share", "chr", etc.
    r'\bhris\b',
    r'human\s+resource\s+information\s+system',
    # People function
    r'people\s+(operations|and\s+culture|experience|partner|team|business|director|strategy|relations|consulting|solutions|care)',
    r'director\s+of\s+people\b',
    r'director\s+people\b',
    r'people\s+director',
    # Personnel
    r'personnel\s+director',
    r'director\s+of\s+personnel',
    # Employee-focused HR sub-functions
    r'employee\s+relations',
    r'employee\s+experience',
    r'employee\s+engagement',
    r'employee\s+success',
    r'employee\s+communications',
    r'employee\s+development',
    r'employee\s+benefits',
    r'employee\s+empowerment',
    r'employee\s+productivity',
    r'employee\s+administration',
    r'employee\s+clearance',
    r'employee\s+education',
    r'employee\s+appreciation',
    r'employee\s+listening',
    r'labor\s+relations',
    r'labor\s+and\s+employment',
    r'employment\s+law',
    r'employment\s+counsel',
    r'employment\s+practices',
    # Total Rewards / Comp & Ben
    r'total\s+rewards',
    r'compensation\s+and\s+benefits',
    r'compensation\s+benefits',
    r'comp\s+and\s+ben',
    r'comp\s+ben',
    # Workforce (HR-side)
    r'workforce\s+planning',
    r'workforce\s+analytics',
    r'workforce\s+management',
    r'workforce\s+engagement',
    r'workforce\s+transformation',
    r'workforce\s+strategies',
    r'workforce\s+optimization',
    r'workforce\s+experiences',
    # Talent Management
    r'talent\s+management',
    r'talent\s+development',
    r'talent\s+and\s+human\s+resources',
    r'talent\s+and\s+culture',
    r'talent\s+and\s+inclusion',
    r'talent\s+and\s+learning',
    r'talent\s+strategy',
    r'talent\s+partner',
    r'talent\s+operations',
    # talent acquisition and talent recruitment removed — recruiting not target ICP
    # Organizational
    r'organizational\s+culture',
    r'organizational\s+effectiveness',
    r'human\s+capital',
    # Recruiting removed from KEEP — not target ICP
    # Payroll (HR-adjacent)
    r'payroll\s+director',
    r'director\s+(?:of\s+)?payroll',
    r'director\s+north\s+america\s+payroll',
    r'university\s+payroll',
    r'global.*payroll\s+director',
    r'associate\s+director.*payroll',
    r'senior\s+director.*payroll',
    # Benefits (employee benefits, HR function)
    r'director\s+(?:of\s+)?benefits\b',
    r'benefits\s+director',
    r'director\s+(?:of\s+)?employee\s+benefits',
    r'director\s+benefits\s+and\s+compensation',
    r'director\s+compensation\s+and\s+benefits',
    r'director\s+health\s+and\s+benefits',
    r'director\s+(?:of\s+)?voluntary\s+benefits',
    r'director\s+retirement\s+benefits',
    r'senior\s+director.*benefits',
    r'associate\s+director.*benefits(?!.*healthcare)',
    # Staffing (internal HR)
    r'director\s+(?:of\s+)?staffing\b',
    r'staffing\s+director',
    r'staffing\s+programs',
    r'strategic\s+staffing',
    # Culture (organizational, not arts)
    r'director\s+(?:of\s+)?culture\b(?!.*\barts)',
    r'culture\s+and\s+(engagement|inclusion|talent|team\s+member)',
    r'director.*corporate\s+culture',
    r'director.*organizational\s+culture',
    r'culture\s+and\s+employee',
    r'culture\s+enrichment',
    r'culture\s+diversity',
    r'culture\s+and\s+workforce',
    # Enterprise / Corporate Learning (L&D)
    r'director\s+(?:of\s+)?enterprise\s+learning',
    r'enterprise\s+learning\s+director',
    r'director\s+(?:of\s+)?learning\s+and\s+(?:talent|development|continuous)',
    r'director\s+learning\s+performance',
    r'global\s+director.*learning',
    r'senior\s+director.*learning(?!.*center)',
    r'director\s+curriculum\s+and\s+learning',
]

# REMOVE signals — title contains any of these → definitely not HR
REMOVE_PATTERNS_WITH_REASONS = [
    # Fitness & Wellness (non-HR)
    (r'fitness\s+director', 'Fitness role'),
    (r'director\s+of\s+fitness', 'Fitness role'),
    (r'director\s+fitness', 'Fitness role'),
    (r'fitness\s+center', 'Fitness role'),
    (r'personal\s+training\s+director', 'Fitness/personal training role'),
    (r'director\s+of\s+personal\s+training', 'Fitness/personal training role'),
    (r'group\s+fitness', 'Fitness role'),
    (r'spa\s+and\s+fitness', 'Fitness/spa role'),
    (r'tennis\s+and\s+fitness', 'Fitness/recreation role'),
    (r'swim\s+and\s+fitness', 'Fitness/recreation role'),
    (r'fitness\s+and\s+wellness\b(?!.*\bhuman\s+resources?\b)', 'Fitness/wellness role'),
    (r'fitness\s+equipment', 'Fitness equipment sales'),
    (r'fitness\s+program\s+director', 'Fitness program role'),
    (r'membership\s+and\s+fitness', 'Fitness/recreation role'),
    (r'exercise\s+(specialist|medicine)', 'Fitness/exercise role'),
    (r'master\s+athletic\s+trainer', 'Athletic training role'),
    # Health & Wellness (non-HR standalone)
    (r'(?<!\bemployee\s)health\s+and\s+wellness\s+director', 'Health & wellness facility role'),
    (r'director\s+of\s+health\s+and\s+wellness\b(?!.*\bhuman\s+resources?\b)', 'Health & wellness facility role'),
    (r'(?<!\bemployee\s)health\s+and\s+wellness\s+regional', 'Health & wellness facility role'),
    (r'market\s+health\s+and\s+wellness', 'Health & wellness market role'),
    (r'rn\s+health\s+and\s+wellness', 'Nursing/health & wellness clinical role'),
    (r'clinical\s+director.*health\s+and\s+wellness', 'Clinical health & wellness role'),
    (r'director\s+health\s+and\s+wellness\s+center', 'Health & wellness center role'),
    (r'health\s+and\s+wellness\s+programming', 'Health & wellness programming role'),
    (r'director\s+for\s+women.s\s+health', 'Clinical health role'),
    (r'whole\s+health\s+director', 'Clinical health role'),
    (r'director\s+mind\s+health', 'Clinical health role'),
    (r'walmart\s+health', 'Retail health clinic role'),
    # Healthcare / Medical / Clinical
    (r'behavioral\s+health', 'Behavioral health clinical role'),
    (r'mental\s+health', 'Mental health clinical role'),
    (r'public\s+health', 'Public health role'),
    (r'population\s+health', 'Population health role'),
    (r'environmental\s+health', 'Environmental health role'),
    (r'medical\s+director', 'Medical director role'),
    (r'clinical\s+director', 'Clinical director role'),
    (r'healthcare\s+director', 'Healthcare industry role'),
    (r'healthcare\s+senior\s+director', 'Healthcare industry role'),
    (r'healthcare\s+sales', 'Healthcare sales role'),
    (r'healthcare\s+account', 'Healthcare account management'),
    (r'healthcare\s+consulting', 'Healthcare consulting role'),
    (r'healthcare\s+cloud', 'Healthcare technology role'),
    (r'healthcare\s+tech', 'Healthcare technology role'),
    (r'healthcare\s+strategy', 'Healthcare strategy role'),
    (r'healthcare\s+market', 'Healthcare market role'),
    (r'healthcare\s+analytics', 'Healthcare analytics role'),
    (r'healthcare\s+investment', 'Healthcare investment banking'),
    (r'healthcare\s+capital', 'Healthcare capital markets'),
    (r'healthcare\s+product', 'Healthcare product role'),
    (r'healthcare\s+planning', 'Healthcare planning role'),
    (r'healthcare\s+quality', 'Healthcare quality role'),
    (r'healthcare\s+professional', 'Healthcare professional role'),
    (r'director\s+of\s+healthcare', 'Healthcare industry role'),
    (r'national\s+director\s+of\s+healthcare', 'Healthcare industry role'),
    (r'director.*healthcare(?!\s+human)', 'Healthcare industry role'),
    (r'health\s+sciences', 'Health sciences academic role'),
    (r'allied\s+health', 'Allied health academic role'),
    (r'home\s+health', 'Home health clinical role'),
    (r'telehealth', 'Telehealth clinical role'),
    (r'tele-health', 'Telehealth clinical role'),
    (r'physician\s+recruit', 'Physician recruiting (not HR)'),
    (r'provider\s+recruit', 'Provider recruiting (not HR)'),
    (r'provider\s+contract', 'Provider contracting (not HR)'),
    (r'nursing\b', 'Nursing role'),
    (r'nurse\b(?!\s+practitioner\s+program)', 'Nursing role'),
    (r'dental\b', 'Dental role'),
    (r'pharmacy\b', 'Pharmacy role'),
    (r'pharmacist\b', 'Pharmacy role'),
    (r'veterinar', 'Veterinary role'),
    (r'district\s+health\s+director', 'Public health district role'),
    (r'county\s+health', 'County health department role'),
    (r'health\s+department', 'Public health department role'),
    (r'health\s+center\s+director', 'Health center clinical role'),
    (r'health\s+eligibility', 'Health plan eligibility role'),
    (r'health\s+plan', 'Health plan/insurance role'),
    (r'health\s+outcomes', 'Health outcomes research role'),
    (r'health\s+economics', 'Health economics role'),
    (r'health\s+equity(?!\s+strategies)', 'Health equity (public health) role'),
    (r'health\s+informatics', 'Health informatics clinical role'),
    (r'health\s+communication(?:s)?(?!\s+specialist)', 'Health communications (public health) role'),
    (r'health\s+policy', 'Health policy role'),
    (r'health\s+education\b', 'Health education role'),
    (r'health\s+information\s+management', 'Health information management'),
    (r'health\s+promotion(?!\s+department)', 'Health promotion (clinical) role'),
    (r'health\s+protection', 'Health protection (public health) role'),
    (r'health\s+surveillance', 'Health surveillance role'),
    (r'health\s+coach', 'Health coaching role'),
    (r'health\s+director\b(?!.*\bhuman)', 'Health director (clinical/public) role'),
    (r'director\s+of\s+health\b(?!.*\bhuman|\bemployee)', 'Health director (clinical/public) role'),
    (r'oral\s+health', 'Oral health clinical role'),
    (r'child\s+health', 'Child health clinical role'),
    (r'maternal.*health', 'Maternal health clinical role'),
    (r'infant.*health', 'Infant health clinical role'),
    (r'women.s\s+health', 'Women\'s health clinical role'),
    (r'reproductive\s+health', 'Reproductive health role'),
    (r'global\s+health\b(?!.*\bhuman)', 'Global health (public health) role'),
    (r'school.*health', 'School health role'),
    (r'rural\s+health', 'Rural health role'),
    (r'digital\s+health\b(?!.*\bhuman)', 'Digital health role'),
    (r'retail\s+health', 'Retail health role'),
    (r'spiritual\s+health', 'Spiritual health/chaplaincy role'),
    (r'brain\s+health', 'Brain health research role'),
    (r'animal\s+health', 'Animal health role'),
    (r'infection\s+prevention', 'Infection prevention clinical role'),
    (r'occupational\s+health(?!\s+and\s+safety\b.*\bhuman)', 'Occupational health (medical) role'),
    (r'correctional\s+health', 'Correctional healthcare role'),
    (r'bariatric', 'Bariatric medical role'),
    (r'oncology', 'Oncology clinical role'),
    (r'neurology', 'Neurology clinical role'),
    (r'neuropsychology', 'Neuropsychology clinical role'),
    (r'psychiatr', 'Psychiatry clinical role'),
    (r'physiatrist', 'Physiatry clinical role'),
    (r'psycholog(?:y|ist)\s+(?:training|internship)', 'Psychology training (clinical) role'),
    (r'epidemiolog', 'Epidemiology role'),
    (r'biostatistic', 'Biostatistics role'),
    (r'genetic\s+counsel', 'Genetic counseling role'),
    (r'pathogen', 'Pathogen/disease role'),
    (r'disease', 'Disease/clinical role'),
    (r'diabetes', 'Diabetes clinical role'),
    (r'cardio', 'Cardiology/cardiovascular role'),
    (r'surgery\s+center', 'Surgery center role'),
    (r'sleep\s+', 'Sleep medicine role'),
    (r'urology', 'Urology clinical role'),
    (r'lab\s*-?\s*director', 'Laboratory director role'),
    (r'laboratory\s+director', 'Laboratory director role'),
    # Education & Academic
    (r'teaching\s+and\s+learning', 'Academic teaching & learning role'),
    (r'distance\s+learning', 'Academic distance learning role'),
    (r'e-?learning', 'E-learning academic role'),
    (r'online\s+learning', 'Online learning academic role'),
    (r'experiential\s+learning', 'Academic experiential learning role'),
    (r'engaged\s+learning', 'Academic engaged learning role'),
    (r'admissions\s+and\s+recruit', 'Academic admissions role'),
    (r'director\s+of\s+admissions', 'Academic admissions role'),
    (r'student\s+recruit', 'Academic student recruitment role'),
    (r'undergraduate\s+recruit', 'Academic undergraduate recruitment role'),
    (r'undergraduate\s+admissions', 'Academic admissions role'),
    (r'graduate\s+recruit', 'Academic graduate recruitment role'),
    (r'residency\s+training', 'Medical residency training role'),
    (r'fellowship\b', 'Academic/medical fellowship role'),
    (r'academic\s+affairs', 'Academic affairs role'),
    (r'program\s+director.*allied\s+health', 'Allied health academic role'),
    (r'program\s+director.*health\s+science', 'Health sciences academic role'),
    (r'associate\s+professor', 'Academic faculty role'),
    (r'assistant\s+professor', 'Academic faculty role'),
    (r'professor\b(?!\s+of)', 'Academic faculty role'),
    (r'lecturer\b', 'Academic faculty role'),
    (r'early\s+learning', 'Early childhood education role'),
    (r'social\s+emotional\s+learning', 'SEL education role'),
    (r'school\s+counseling', 'School counseling role'),
    (r'pre-?health\s+(advising|professions)', 'Pre-health academic advising role'),
    (r'composition\s+culture', 'English composition academic role'),
    (r'learning\s+center\s+director', 'Academic learning center role'),
    (r'director\s+the\s+learning\s+center', 'Academic learning center role'),
    (r'learning\s+communities\s+director', 'Academic learning communities role'),
    (r'math\s+lab', 'Academic math lab role'),
    (r'writing\s+(center|collaborative)', 'Academic writing center role'),
    # Travel & Hospitality
    (r'travel\s+director', 'Travel/hospitality role'),
    (r'director\s+of\s+travel', 'Travel/hospitality role'),
    (r'business\s+travel', 'Business travel management role'),
    (r'travel\s+sales', 'Travel sales role'),
    (r'travel\s+management', 'Travel management role'),
    (r'travel\s+and\s+(housing|expense|e-commerce)', 'Travel operations role'),
    (r'leisure\s+travel', 'Leisure travel role'),
    (r'travel\s+partner', 'Travel partner role'),
    (r'on\s+demand\s+travel', 'Travel operations role'),
    (r'ticket\s+hospitality\s+and\s+travel', 'Hospitality/travel role'),
    # Sales-specific / non-HR recruiting
    (r'driver\s+recruit', 'Driver recruiting (not HR)'),
    (r'attorney\s+recruit', 'Attorney recruiting (law firm)'),
    (r'legal\s+recruit', 'Legal recruiting (law firm)'),
    (r'football\s+recruit', 'Athletic recruiting'),
    (r'athletic\s+recruit', 'Athletic recruiting'),
    (r'military\s+veteran\s+recruit', 'Military veteran recruitment'),
    (r'mortgage\s+recruit', 'Mortgage recruiting (not HR)'),
    (r'diversity\s+recruit', 'Diversity recruitment (academic)'),
    (r'multicultural\s+recruit', 'Multicultural recruitment (academic)'),
    (r'director\s+of\s+admissions\s+-\s+recruit', 'Academic admissions recruiting'),
    (r'franchise\s+recruit', 'Franchise recruiting (not HR)'),
    (r'locums?\s+recruit', 'Locum tenens recruiting (medical)'),
    (r'optometrist', 'Optometrist recruiting (medical)'),
    # Agriculture / Environment / Other
    (r'horticulture', 'Horticulture role'),
    (r'agriculture', 'Agriculture role'),
    (r'arts\s+and\s+culture', 'Arts & culture role'),
    (r'humanities\s+director', 'Humanities academic role'),
    (r'director\s+of\s+humanities', 'Humanities academic role'),
    (r'director.*digital\s+humanities', 'Digital humanities academic role'),
    (r'machine\s+learning\b(?!.*\bhuman)', 'Machine learning / AI tech role'),
    (r'artificial\s+intelligence', 'AI tech role'),
    (r'data\s+science\b(?!.*\bhuman)', 'Data science tech role'),
    (r'board\s+of\s+directors', 'Board governance role (not operational)'),
    (r'prison\s+ministry', 'Ministry/chaplaincy role'),
    (r'church\s+ministries', 'Ministry/chaplaincy role'),
    (r'film.*production', 'Film/entertainment role'),
    (r'entertainment', 'Entertainment industry role'),
    (r'soccer\s+coach', 'Athletic coaching role'),
    (r'head\s+coach', 'Athletic coaching role'),
    (r'band\s+director', 'Band director (education)'),
    (r'debate\b', 'Academic debate role'),
    (r'methane\b', 'Environmental/energy role'),
    (r'food\s+safety', 'Food safety role'),
    (r'regulatory\s+affairs', 'Regulatory affairs role'),
    # Government / Misc  
    (r'deputy\s+director.*(?:cdc|office\s+of|division\s+of|center\s+for)(?!.*\bhuman)', 'Government/agency role'),
    (r'associate\s+director.*(?:cdc|office\s+of|division\s+of|center\s+for)(?!.*\bhuman)', 'Government/agency role'),
    (r'(?:acting\s+)?director.*(?:office\s+of|division\s+of|center\s+for|national\s+center)(?!.*\bhuman)', 'Government/agency program role'),
    (r'flight\s+training', 'Aviation training role'),
    (r'military\s+training', 'Military training role'),
    (r'military\s+history', 'Military history role'),
    (r'construction\s+compliance', 'Construction compliance role'),
    (r'quality\s+audits', 'Quality audits role'),
    (r'product\s+portfolio', 'Product portfolio role'),
    (r'brand\s+activation', 'Brand marketing role'),
    (r'editorial\s+director', 'Editorial role'),
    (r'content\s+team', 'Content marketing role'),
    (r'special\s+investigations', 'Investigations role'),
    (r'revenue\s+accounting', 'Revenue accounting role'),
    (r'account\s+director', 'Account management/sales role'),
    (r'enterprise\s+account\s+director', 'Enterprise account sales role'),
    (r'strategic\s+account\s+director', 'Strategic account sales role'),
    (r'sales\s+director', 'Sales director role'),
    (r'marketing\s+director', 'Marketing director role'),
    (r'(?:senior\s+)?recruiter\s+director\s+of\s+marketing', 'Marketing role'),
    (r'self\s+employed', 'Self-employed / contractor'),
    (r'retired\b(?!.*\bhuman\s+resources?\b)', 'Retired role'),
    (r'lead\s+recruiter.*directorate', 'Military/defense recruiting'),
    (r'controller\b(?!.*\bhuman)', 'Controller (finance, not HR)'),
    (r'shift\s+manager', 'Operations management role'),
    (r'emerald\s+director', 'MLM/direct sales role'),
    (r'independent\s+director\s+and\s+recruiter', 'Independent recruiting (not corporate HR)'),
    (r'seo\s+and\s+answer\s+engine', 'SEO role'),
    # Recruiting / Recruitment / Recruiter — not target ICP
    (r'recruit(?:ing|ment|er)\s+director', 'Recruiting role (not HR director)'),
    (r'director.*recruit(?:ing|ment|er)', 'Recruiting role (not HR director)'),
    (r'recruit(?:ing|ment)\b(?!.*\bhuman\s+resources?\b)', 'Recruiting role (not HR director)'),
    (r'national\s+recruit', 'Recruiting role (not HR director)'),
    (r'corporate\s+recruit', 'Recruiting role (not HR director)'),
    (r'business\s+recruit', 'Recruiting role (not HR director)'),
    # Items moved from REVIEW to REMOVE
    (r'director.*learning\s+resources', 'Academic learning resources role'),
    (r'director\s+human\s+rights\s+program', 'Human rights program (not HR)'),
    (r'director\s+of\s+corporate\s+health\b(?!.*\bhuman)', 'Corporate health/wellness (medical, not HR)'),
    (r'healthcare.*infection', 'Healthcare infection control role'),
    (r'director\s+employee\s+health\s+services', 'Employee health services (clinical role)'),
    (r'employer\s+relations(?!.*\bhuman)', 'University employer relations / career services'),
    (r'director\s+of\s+professional\s+learning', 'Professional learning (likely academic)'),
    (r'director.*learning\s+center', 'Academic/facility learning center role'),
    (r'director\s+of\s+learning\b(?!.*\btalent|\bdevelopment|\bcontinuous|\bperformance|\benterprise|\bglobal|\bcorporate)', 'Academic/facility learning role'),
    (r'director\s+field\s+learning', 'Field learning (sales/retail training)'),
    (r'director\s+of\s+innovative\s+learning', 'Academic innovative learning role'),
    (r'director\s+of\s+personalized\s+learning', 'Academic personalized learning role'),
]

# REVIEW patterns — ambiguous, need human judgment
REVIEW_PATTERNS_WITH_REASONS = [
    (r'^director\s+of\s+training\b(?!.*\bhuman)', 'Training director — could be corporate L&D or military/clinical'),
    (r'^training\s+director\b(?!.*\bhuman)', 'Training director — could be corporate L&D or military/clinical'),
    (r'^director\s+training\b(?!.*\bhuman)', 'Training director — could be corporate L&D or military/clinical'),
    (r'director.*(?:corporate\s+)?training(?!.*\bhuman)', 'Training role — context needed'),
]


# ──────────────────────────────────────────────────────────────
# CLASSIFICATION ENGINE
# ──────────────────────────────────────────────────────────────

def compile_patterns():
    """Pre-compile all regex patterns for performance."""
    keep = [re.compile(p, re.IGNORECASE) for p in KEEP_PATTERNS]
    remove = [(re.compile(p, re.IGNORECASE), reason) for p, reason in REMOVE_PATTERNS_WITH_REASONS]
    review = [(re.compile(p, re.IGNORECASE), reason) for p, reason in REVIEW_PATTERNS_WITH_REASONS]
    return keep, remove, review


def classify_title(title, keep_pats, remove_pats, review_pats):
    """
    Classify a single title. Returns (status, reason).
    
    Logic:
    1. Check if title has a strong KEEP signal (explicit HR)
    2. Check if title has a REMOVE signal
    3. If both KEEP and REMOVE → KEEP wins when HR is explicit
    4. Check REVIEW patterns
    5. Default: if no signals matched → REVIEW
    """
    title_clean = title.strip()
    if not title_clean:
        return 'REMOVE', 'Empty title'
    
    # Check for strong KEEP signals
    has_keep = False
    keep_reason = ''
    for pat in keep_pats:
        if pat.search(title_clean):
            has_keep = True
            # Determine specific reason
            if re.search(r'human\s+resources?', title_clean, re.IGNORECASE):
                keep_reason = 'Core HR title'
            elif re.search(r'\bhr\b', title_clean, re.IGNORECASE):
                keep_reason = 'HR title (abbreviated)'
            elif re.search(r'people\s+(operations|and\s+culture|experience|partner|team|business|director|strategy)', title_clean, re.IGNORECASE):
                keep_reason = 'People/Culture function (HR equivalent)'
            elif re.search(r'employee\s+(relations|experience|engagement|success|communications|development|benefits)', title_clean, re.IGNORECASE):
                keep_reason = 'Employee-focused HR sub-function'
            elif re.search(r'labor\s+(relations|and\s+employment)', title_clean, re.IGNORECASE):
                keep_reason = 'Labor relations (HR function)'
            elif re.search(r'total\s+rewards|compensation|comp\s+and\s+ben', title_clean, re.IGNORECASE):
                keep_reason = 'Compensation/rewards (HR function)'
            elif re.search(r'talent\s+(management|acquisition|development)', title_clean, re.IGNORECASE):
                keep_reason = 'Talent management (HR function)'
            elif re.search(r'workforce\s+(planning|analytics|management|transformation)', title_clean, re.IGNORECASE):
                keep_reason = 'Workforce planning (HR function)'
            elif re.search(r'hris|human\s+resource\s+information', title_clean, re.IGNORECASE):
                keep_reason = 'HRIS (HR technology)'
            elif re.search(r'human\s+capital', title_clean, re.IGNORECASE):
                keep_reason = 'Human capital (HR function)'
            elif re.search(r'personnel', title_clean, re.IGNORECASE):
                keep_reason = 'Personnel (HR function)'
            elif re.search(r'organizational\s+(culture|effectiveness)', title_clean, re.IGNORECASE):
                keep_reason = 'Organizational effectiveness (HR function)'
            elif re.search(r'payroll', title_clean, re.IGNORECASE):
                keep_reason = 'Payroll (HR-adjacent function)'
            elif re.search(r'benefits|benefit', title_clean, re.IGNORECASE):
                keep_reason = 'Benefits (HR function)'
            elif re.search(r'staffing', title_clean, re.IGNORECASE):
                keep_reason = 'Staffing (HR function)'
            elif re.search(r'culture', title_clean, re.IGNORECASE):
                keep_reason = 'Culture (organizational development)'
            elif re.search(r'enterprise\s+learning|corporate\s+learning|global.*learning|learning.*talent', title_clean, re.IGNORECASE):
                keep_reason = 'Learning & Development (HR function)'
            else:
                keep_reason = 'HR-related function'
            break
    
    # Check for REMOVE signals
    has_remove = False
    remove_reason = ''
    for pat, reason in remove_pats:
        if pat.search(title_clean):
            has_remove = True
            remove_reason = reason
            break
    
    # Apply override logic
    # HARD REMOVE: recruiting always loses, even with HR signal
    if re.search(r'recruit(?:ing|ment|er|s)?\b', title_clean, re.IGNORECASE):
        return 'REMOVE', 'Recruiting role (not target ICP)'
    
    if has_keep and has_remove:
        # Explicit HR in title → KEEP wins
        if re.search(r'human\s+resources?', title_clean, re.IGNORECASE) or \
           re.search(r'\bhr\b', title_clean, re.IGNORECASE):
            return 'KEEP', f'{keep_reason} (overrides: {remove_reason})'
        else:
            # Non-explicit HR signal vs remove signal → REMOVE wins
            return 'REMOVE', remove_reason
    
    if has_keep:
        return 'KEEP', keep_reason
    
    if has_remove:
        return 'REMOVE', remove_reason
    
    # Check REVIEW patterns
    for pat, reason in review_pats:
        if pat.search(title_clean):
            return 'REVIEW', reason
    
    # Default: if no patterns matched at all, send to REVIEW
    return 'REVIEW', f'No matching rules — title needs manual review: "{title_clean[:80]}"'


# ──────────────────────────────────────────────────────────────
# AUTO-DETECT COLUMNS
# ──────────────────────────────────────────────────────────────

def detect_columns(headers):
    """Auto-detect which columns contain title, department, etc."""
    headers_lower = [h.lower().strip() for h in headers]
    
    title_col = None
    dept_col = None
    name_cols = []
    company_col = None
    
    for i, h in enumerate(headers_lower):
        if h in ('title', 'job title', 'jobtitle', 'job_title', 'position', 'role'):
            title_col = i
        elif h in ('department', 'dept', 'dept.', 'division'):
            dept_col = i
        elif h in ('firstname', 'first name', 'first_name', 'fname', 'firstName'):
            name_cols.insert(0, i)
        elif h in ('lastname', 'last name', 'last_name', 'lname', 'lastName'):
            name_cols.append(i)
        elif h in ('company', 'companyname', 'company name', 'company_name', 'organization'):
            company_col = i
    
    # Fallback: search for partial matches
    if title_col is None:
        for i, h in enumerate(headers_lower):
            if 'title' in h:
                title_col = i
                break
    
    return {
        'title': title_col,
        'department': dept_col,
        'name_cols': name_cols,
        'company': company_col,
    }


# ──────────────────────────────────────────────────────────────
# DEDUPLICATION
# ──────────────────────────────────────────────────────────────

def make_dedup_key(row, col_map, headers):
    """Create a deduplication key from name + company + title."""
    parts = []
    for col_idx in col_map.get('name_cols', []):
        if col_idx is not None and col_idx < len(row):
            parts.append(row[col_idx].strip().lower())
    if col_map.get('company') is not None:
        parts.append(row[col_map['company']].strip().lower())
    if col_map.get('title') is not None:
        parts.append(row[col_map['title']].strip().lower())
    return '|'.join(parts)


# ──────────────────────────────────────────────────────────────
# MAIN COMMANDS
# ──────────────────────────────────────────────────────────────

def read_csv(filepath):
    """Read CSV with encoding fallback."""
    for enc in ('utf-8', 'utf-8-sig', 'latin-1', 'cp1252'):
        try:
            with open(filepath, 'r', encoding=enc) as f:
                reader = csv.reader(f)
                headers = next(reader)
                rows = list(reader)
            return headers, rows
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise ValueError(f"Could not read {filepath} with any supported encoding")


def cmd_analyze(filepath):
    """Analyze a CSV and print summary stats."""
    headers, rows = read_csv(filepath)
    col_map = detect_columns(headers)
    
    print(f"=== CSV Analysis ===")
    print(f"File: {os.path.basename(filepath)}")
    print(f"Total rows: {len(rows)}")
    print(f"Columns ({len(headers)}): {', '.join(headers)}")
    print()
    
    if col_map['title'] is not None:
        print(f"Detected title column: '{headers[col_map['title']]}' (index {col_map['title']})")
    else:
        print("WARNING: Could not auto-detect title column!")
        return
    
    if col_map['department'] is not None:
        print(f"Detected department column: '{headers[col_map['department']]}'")
    
    # Compile patterns and classify
    keep_pats, remove_pats, review_pats = compile_patterns()
    
    title_idx = col_map['title']
    status_counts = Counter()
    reason_counts = defaultdict(int)
    title_counts = Counter()
    
    for row in rows:
        if title_idx < len(row):
            title = row[title_idx].strip()
            title_counts[title] += 1
            status, reason = classify_title(title, keep_pats, remove_pats, review_pats)
            status_counts[status] += 1
            if status == 'REMOVE':
                reason_counts[reason] += 1
    
    total = len(rows)
    print(f"\n--- Distribution Preview ---")
    for status in ['KEEP', 'REMOVE', 'REVIEW']:
        count = status_counts[status]
        pct = (count / total * 100) if total > 0 else 0
        print(f"  {status}: {count} ({pct:.1f}%)")
    
    print(f"\n--- Top 30 Titles ---")
    for title, count in title_counts.most_common(30):
        status, _ = classify_title(title, keep_pats, remove_pats, review_pats)
        marker = {'KEEP': '✓', 'REMOVE': '✗', 'REVIEW': '?'}[status]
        print(f"  {marker} {count:>3}x  {title}")
    
    print(f"\n--- Top Removal Reasons ---")
    for reason, count in sorted(reason_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"  {count:>3}x  {reason}")
    
    # Check for duplicates
    seen = Counter()
    for row in rows:
        key = make_dedup_key(row, col_map, headers)
        seen[key] += 1
    dupes = sum(1 for v in seen.values() if v > 1)
    if dupes:
        print(f"\n--- Duplicates ---")
        print(f"  {dupes} duplicate groups found (same name + company + title)")


def cmd_filter(filepath, output_dir):
    """Filter CSV and produce output files."""
    os.makedirs(output_dir, exist_ok=True)
    
    headers, rows = read_csv(filepath)
    col_map = detect_columns(headers)
    
    if col_map['title'] is None:
        print("ERROR: Could not detect title column. Please specify manually.")
        sys.exit(1)
    
    title_idx = col_map['title']
    keep_pats, remove_pats, review_pats = compile_patterns()
    
    # Extended headers
    out_headers = headers + ['_filter_status', '_filter_reason', '_duplicate']
    
    kept = []
    removed = []
    review = []
    
    # Dedup tracking
    seen_keys = Counter()
    row_keys = []
    for row in rows:
        key = make_dedup_key(row, col_map, headers)
        seen_keys[key] += 1
        row_keys.append(key)
    
    # Reset for second pass
    seen_so_far = Counter()
    
    # Classify each row
    status_counts = Counter()
    reason_counts = defaultdict(int)
    
    for i, row in enumerate(rows):
        title = row[title_idx].strip() if title_idx < len(row) else ''
        status, reason = classify_title(title, keep_pats, remove_pats, review_pats)
        
        # Mark duplicates
        key = row_keys[i]
        seen_so_far[key] += 1
        is_dup = 'Yes' if seen_keys[key] > 1 and seen_so_far[key] > 1 else ''
        
        out_row = row + [status, reason, is_dup]
        
        status_counts[status] += 1
        if status == 'REMOVE':
            reason_counts[reason] += 1
        
        if status == 'KEEP':
            kept.append(out_row)
        elif status == 'REMOVE':
            removed.append(out_row)
        else:
            review.append(out_row)
    
    # Write output files
    for fname, data in [('contacts_kept.csv', kept), 
                         ('contacts_removed.csv', removed),
                         ('contacts_review.csv', review)]:
        outpath = os.path.join(output_dir, fname)
        with open(outpath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(out_headers)
            writer.writerows(data)
        print(f"Wrote {len(data)} rows → {outpath}")
    
    # Write summary
    total = len(rows)
    summary_path = os.path.join(output_dir, 'filter_summary.txt')
    with open(summary_path, 'w') as f:
        f.write(f"=== CSV Contact Filter Results ===\n")
        f.write(f"Input file: {os.path.basename(filepath)}\n")
        f.write(f"Total contacts: {total}\n\n")
        for status in ['KEEP', 'REMOVE', 'REVIEW']:
            count = status_counts[status]
            pct = (count / total * 100) if total > 0 else 0
            f.write(f"{status}: {count} ({pct:.1f}%)\n")
        f.write(f"\nTop removal reasons:\n")
        for reason, count in sorted(reason_counts.items(), key=lambda x: -x[1])[:20]:
            f.write(f"  {count:>3}x  {reason}\n")
        
        # Duplicate summary
        dup_groups = sum(1 for v in seen_keys.values() if v > 1)
        dup_rows = sum(v - 1 for v in seen_keys.values() if v > 1)
        if dup_groups:
            f.write(f"\nDuplicates: {dup_groups} groups ({dup_rows} duplicate rows flagged)\n")
    
    print(f"\nSummary → {summary_path}")
    print(f"\n{'='*50}")
    print(f"KEEP:   {status_counts['KEEP']:>5} ({status_counts['KEEP']/total*100:.1f}%)")
    print(f"REMOVE: {status_counts['REMOVE']:>5} ({status_counts['REMOVE']/total*100:.1f}%)")
    print(f"REVIEW: {status_counts['REVIEW']:>5} ({status_counts['REVIEW']/total*100:.1f}%)")
    print(f"TOTAL:  {total:>5}")


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python3 filter_contacts.py analyze <input.csv>")
        print("  python3 filter_contacts.py filter <input.csv> <output_dir>")
        sys.exit(1)
    
    command = sys.argv[1]
    filepath = sys.argv[2]
    
    if command == 'analyze':
        cmd_analyze(filepath)
    elif command == 'filter':
        if len(sys.argv) < 4:
            print("ERROR: filter command requires output directory")
            sys.exit(1)
        cmd_filter(filepath, sys.argv[3])
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
