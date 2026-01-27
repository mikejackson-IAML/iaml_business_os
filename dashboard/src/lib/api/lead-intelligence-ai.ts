// Lead Intelligence - AI Helpers
// Claude API functions for search parsing and summary generation

import Anthropic from '@anthropic-ai/sdk';
import type { ContactListParams } from './lead-intelligence-contacts-types';
import type { AISearchResult, AISummary } from './lead-intelligence-ai-types';

// ==================== Client ====================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return _client;
}

// ==================== Valid Values ====================

const VALID_STATUS = ['active', 'inactive', 'prospect', 'client', 'former_client', 'do_not_contact'];
const VALID_SENIORITY = ['c_suite', 'vp', 'director', 'manager', 'senior', 'mid', 'junior', 'entry', 'intern'];
const VALID_EMAIL_STATUS = ['valid', 'invalid', 'catch_all', 'unknown', 'pending'];
const VALID_COMPANY_SIZE = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

const VALID_FILTER_KEYS: (keyof ContactListParams)[] = [
  'status', 'state', 'company_id', 'title', 'department', 'seniority_level',
  'email_status', 'is_vip', 'engagement_score_min', 'engagement_score_max',
  'created_after', 'created_before', 'search', 'company_size', 'program_id',
  'sort', 'order',
];

// ==================== System Prompts ====================

const SEARCH_SYSTEM_PROMPT = `You are a search query parser for a CRM contact database. Convert natural language queries into structured JSON filters.

Return ONLY a JSON object with filter keys. Do NOT include any text outside the JSON.

Valid filter keys and their allowed values:
- status: one of ${JSON.stringify(VALID_STATUS)}
- state: US state abbreviation, one of ${JSON.stringify(US_STATES)}
- title: free text job title search (e.g. "attorney", "partner", "associate")
- department: free text department name
- seniority_level: one of ${JSON.stringify(VALID_SENIORITY)}
- email_status: one of ${JSON.stringify(VALID_EMAIL_STATUS)}
- is_vip: true or false
- engagement_score_min: number 0-100
- engagement_score_max: number 0-100
- company_size: one of ${JSON.stringify(VALID_COMPANY_SIZE)}
- program_id: only if a specific program name is mentioned (use the program name as value, it will be resolved to ID later)
- created_after: ISO date string (YYYY-MM-DD)
- created_before: ISO date string (YYYY-MM-DD)
- search: general text search across name/email/company
- sort: field name to sort by (e.g. "last_name", "engagement_score", "created_at")
- order: "asc" or "desc"

Examples:
- "attorneys in Florida" -> {"title":"attorney","state":"FL"}
- "VIP contacts with high engagement" -> {"is_vip":true,"engagement_score_min":70}
- "partners at large firms" -> {"title":"partner","company_size":"501-1000"}
- "inactive contacts from last year" -> {"status":"inactive","created_before":"2025-01-01"}

If you cannot parse the query into valid filters, return: {"error":"unparseable","suggestion":"Try searching for..."}`;

const SUMMARY_SYSTEM_PROMPT = `You are a friendly CRM assistant generating contact intelligence summaries. Write in a conversational, warm tone — like a knowledgeable colleague briefing you before a meeting.

Return ONLY a JSON object with this structure:
{
  "headline": "One-sentence summary of this contact's relationship with us",
  "sections": [
    { "title": "Attendance & Engagement", "content": "narrative about their event participation and engagement level" },
    { "title": "Satisfaction Trends", "content": "narrative about satisfaction signals from their interactions" },
    { "title": "Company Context", "content": "brief context about their company and role" },
    { "title": "Suggested Next Steps", "content": "2-3 actionable suggestions for strengthening the relationship" }
  ]
}

Keep each section to 2-3 sentences. Be specific — reference actual data points. If data is sparse, acknowledge it and suggest what information would be helpful to gather.`;

// ==================== Functions ====================

/**
 * Parse a natural language search query into structured ContactListParams filters.
 */
export async function parseSearchQuery(query: string): Promise<AISearchResult> {
  const client = getClient();

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-20250414',
      max_tokens: 256,
      system: SEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return { filters: {}, error: 'No response from AI', suggestion: 'Try a simpler query' };
    }

    const parsed = extractJSON(textBlock.text);
    if (!parsed) {
      return { filters: {}, error: 'Could not parse AI response', suggestion: 'Try a simpler query' };
    }

    // Check for error response from AI
    if (parsed.error === 'unparseable') {
      return { filters: {} as Partial<ContactListParams>, error: 'unparseable', suggestion: String(parsed.suggestion || 'Try rephrasing your search') };
    }

    // Validate and filter to only allowed keys/values
    const filters = validateFilters(parsed);
    return { filters };
  } catch (error) {
    console.error('parseSearchQuery error:', error);
    return { filters: {}, error: 'Search took too long', suggestion: 'Try a simpler query' };
  }
}

/**
 * Generate an AI summary for a contact given their data.
 */
export async function generateContactSummary(contactData: object): Promise<AISummary> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Generate a summary for this contact:\n\n${JSON.stringify(contactData, null, 2)}` }],
  });

  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  const parsed = extractJSON(textBlock.text);
  if (!parsed || !parsed.headline || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid summary response from AI');
  }

  return {
    headline: String(parsed.headline),
    sections: parsed.sections.map((s: { title?: string; content?: string }) => ({
      title: String(s.title || ''),
      content: String(s.content || ''),
    })),
  };
}

// ==================== Helpers ====================

/**
 * Extract JSON object from text that may contain surrounding prose.
 */
function extractJSON(text: string): Record<string, unknown> | null {
  let jsonStr = text.trim();
  if (!jsonStr.startsWith('{')) {
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      jsonStr = jsonStr.substring(start, end + 1);
    } else {
      return null;
    }
  }
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Validate parsed filters against allowed keys and enum values.
 * Invalid fields are silently removed.
 */
function validateFilters(raw: Record<string, unknown>): Partial<ContactListParams> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!VALID_FILTER_KEYS.includes(key as keyof ContactListParams)) continue;
    if (value === null || value === undefined) continue;

    switch (key) {
      case 'status':
        if (VALID_STATUS.includes(String(value))) result[key] = String(value);
        break;
      case 'state':
        if (US_STATES.includes(String(value).toUpperCase())) result[key] = String(value).toUpperCase();
        break;
      case 'seniority_level':
        if (VALID_SENIORITY.includes(String(value))) result[key] = String(value);
        break;
      case 'email_status':
        if (VALID_EMAIL_STATUS.includes(String(value))) result[key] = String(value);
        break;
      case 'company_size':
        if (VALID_COMPANY_SIZE.includes(String(value))) result[key] = String(value);
        break;
      case 'is_vip':
        result[key] = Boolean(value);
        break;
      case 'engagement_score_min':
      case 'engagement_score_max': {
        const num = Number(value);
        if (!isNaN(num) && num >= 0 && num <= 100) result[key] = num;
        break;
      }
      case 'order':
        if (value === 'asc' || value === 'desc') result[key] = value;
        break;
      // Free text fields: title, department, search, sort, company_id, program_id, created_after, created_before
      default:
        result[key] = String(value);
        break;
    }
  }

  return result as Partial<ContactListParams>;
}
