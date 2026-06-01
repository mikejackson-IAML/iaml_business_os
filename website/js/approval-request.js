(function () {
  const API_ENDPOINT = '/api/approval-request';

  function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function slugify(value) {
    return clean(value)
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function inferProgramSlug() {
    const path = window.location.pathname || '';
    const match = path.match(/\/programs\/([^/.]+)/);
    if (match) return slugify(match[1].replace(/-b3b-preview$/, ''));
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      const canonicalMatch = canonical.href.match(/\/programs\/([^/.]+)/);
      if (canonicalMatch) return slugify(canonicalMatch[1].replace(/-b3b-preview$/, ''));
    }
    return 'unknown-program';
  }

  function inferProgramName(programSlug) {
    const map = {
      'employee-relations-law': 'Certificate in Employee Relations Law',
      'advanced-employment-law': 'Advanced Strategic Employment Law Conference',
      'workplace-investigations': 'Certificate in Workplace Investigations',
      'strategic-hr-leadership': 'Strategic HR Leadership',
      'managers-supervisors-employment-law-training': 'Managers & Supervisors Employment Law Training'
    };
    return map[programSlug] || (document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : programSlug);
  }

  function getUtm() {
    const params = new URLSearchParams(window.location.search || '');
    return {
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmContent: params.get('utm_content') || '',
      utmTerm: params.get('utm_term') || ''
    };
  }

  async function persistApprovalKitRequest(formData, approvalText, extra) {
    const programSlug = slugify((extra && extra.programSlug) || inferProgramSlug());
    const payload = Object.assign({
      email: clean(formData.email),
      name: clean(formData.name),
      organization: clean(formData.organization),
      attendance: clean(formData.attendance),
      challenge: clean(formData.challenge),
      context: clean(formData.context),
      approvalText: clean(approvalText),
      programSlug,
      programName: (extra && extra.programName) || inferProgramName(programSlug),
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      referrer: document.referrer || '',
      ctaLocation: (extra && extra.ctaLocation) || 'approval_request_modal',
      tags: ['approval_request_modal']
    }, getUtm());

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload })
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      throw new Error(result.message || result.error || `Approval request sync failed (${response.status})`);
    }
    return result;
  }

  window.persistApprovalKitRequest = persistApprovalKitRequest;
})();
