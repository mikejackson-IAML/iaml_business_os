// Planning Studio Research Markers
// Detects and strips <!-- RESEARCH: query --> markers from Claude responses

const RESEARCH_MARKER_REGEX = /<!--\s*RESEARCH:\s*(.+?)\s*-->/g;

/**
 * Detect all research markers in content.
 * Returns an array of query strings extracted from markers.
 */
export function detectResearchMarkers(content: string): string[] {
  const queries: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(RESEARCH_MARKER_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    queries.push(match[1].trim());
  }
  return queries;
}

/**
 * Strip all research markers from content.
 * Returns the cleaned content with markers removed.
 */
export function stripResearchMarkers(content: string): string {
  return content.replace(RESEARCH_MARKER_REGEX, '').trim();
}
