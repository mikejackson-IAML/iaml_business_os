(function () {
  const triggers = document.querySelectorAll('[id^="openApprovalKit"]');
  const modal = document.getElementById('approvalKitModal');
  const form = document.getElementById('approvalKitForm');
  const error = document.getElementById('approvalKitError');
  const result = document.getElementById('approvalKitResult');
  const output = document.getElementById('approvalKitOutput');
  const copyButton = document.getElementById('copyApprovalText');
  const brochureLinks = document.querySelectorAll('#approvalKitBrochureLink, #approvalKitResultBrochure');
  const registerLink = document.getElementById('approvalKitRegisterLink');
  let lastFocus = null;

  if (!triggers.length || !modal || !form || !output) return;

  const primaryTrigger = triggers[0];
  const config = {
    programSlug: primaryTrigger.dataset.program || modal.dataset.program || 'unknown-program',
    programName: primaryTrigger.dataset.programName || modal.dataset.programName || 'IAML program',
    brochureUrl: primaryTrigger.dataset.brochureUrl || modal.dataset.brochureUrl || window.location.pathname,
    registerUrl: primaryTrigger.dataset.registerUrl || modal.dataset.registerUrl || '/program-schedule.html',
    tuition: primaryTrigger.dataset.tuition || modal.dataset.tuition || '[Add tuition]',
    duration: primaryTrigger.dataset.duration || modal.dataset.duration || '[Add duration]',
    completionShare: primaryTrigger.dataset.completionShare || modal.dataset.completionShare || 'share key takeaways with the team and identify 2-3 practices we can apply'
  };

  const challengeBullets = {
    risk: [
      'Reduce avoidable workplace and employee relations risk by strengthening how we recognize issues, document decisions, and escalate appropriately.',
      'Bring back practical frameworks for handling workplace situations before they become more costly or disruptive.',
      'Apply IAML guidance to improve consistency in everyday HR and management decisions.'
    ],
    documentation: [
      'Improve the quality and consistency of documentation, escalation, and follow-through.',
      'Bring back practical tools for asking better questions, preserving facts, and creating clearer records.',
      'Strengthen confidence when responding to complaints, discipline issues, and sensitive workplace concerns.'
    ],
    compliance: [
      'Strengthen our handling of leave, accommodation, harassment, retaliation, and related workplace-law issues.',
      'Build a clearer framework for recognizing when legal obligations may be triggered and when to escalate.',
      'Bring back practical guidance that can support better decisions across HR, managers, and business partners.'
    ],
    capability: [
      'Build formal workplace-law capability in an area where many professionals learn only through experience.',
      'Create a stronger foundation for interpreting workplace facts, asking better questions, and partnering with counsel when needed.',
      'Bring back structured materials and frameworks that can be reused after the program.'
    ],
    partners: [
      'Improve how HR partners and managers recognize workplace issues early and respond consistently.',
      'Bring back practical scenarios and decision frameworks that can be shared with colleagues after the program.',
      'Support better frontline decisions on documentation, escalation, discipline, accommodation, and complaint handling.'
    ]
  };

  function absoluteUrl(value) {
    try {
      return new URL(value, window.location.origin).href;
    } catch (_) {
      return value;
    }
  }

  function trackApprovalKitEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, Object.assign({ program: config.programSlug, page_path: window.location.pathname }, params || {}));
    }
  }

  function getFocusable() {
    return Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((el) => el.offsetWidth || el.offsetHeight || el === document.activeElement);
  }

  function openModal(event) {
    if (event) event.preventDefault();
    lastFocus = document.activeElement;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstInput = document.getElementById('approvalEmail');
    if (firstInput) firstInput.focus();
    trackApprovalKitEvent('approval_kit_opened');
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function value(id) {
    const el = document.getElementById(id);
    return el && 'value' in el ? el.value.trim() : '';
  }

  function getChallengeLabel(challenge) {
    const select = document.getElementById('approvalChallenge');
    if (!select) return challenge;
    const selected = select.options[select.selectedIndex];
    return selected ? selected.text : challenge;
  }

  function buildApprovalText(data) {
    const bullets = challengeBullets[data.challenge] || challengeBullets.capability;
    const nameLine = data.name ? `\nFrom: ${data.name}` : '\nFrom: [Your name]';
    const orgLine = data.organization ? `\nOrganization/department: ${data.organization}` : '\nOrganization/department: [Your organization or department]';
    const contextLine = data.context ? `\n\nAdditional context: ${data.context}` : '';
    const attendance = data.attendance || '[preferred format]';
    const travelLine = attendance.toLowerCase().includes('person')
      ? 'Estimated travel/hotel/meals: [Add estimate based on company travel policy]'
      : 'Estimated travel/hotel/meals: $0 if attending virtually or on demand; otherwise add estimate based on company travel policy';

    return `Subject: Approval request: IAML ${config.programName}${nameLine}${orgLine}\n\nI am requesting approval to attend IAML’s ${config.programName} via ${attendance} to strengthen our capability in ${getChallengeLabel(data.challenge).toLowerCase()}.\n\nBusiness impact:\n- ${bullets[0]}\n- ${bullets[1]}\n- ${bullets[2]}\n\nWhy IAML: IAML is a long-running provider of workplace-law and management training, with programs designed for practical application.\n\nEstimated investment and time away:\n- Tuition: ${config.tuition}\n- Program length: ${config.duration}\n- ${travelLine}\n- Coverage while I am out: [Add coverage plan for time-sensitive responsibilities]\n\nAfter the program, I will ${config.completionShare}.${contextLine}\n\nProgram details: ${absoluteUrl(config.brochureUrl)}\nRegistration page: ${absoluteUrl(config.registerUrl)}\n\nThank you for considering this request.\n[Your name]`;
  }

  triggers.forEach((trigger) => trigger.addEventListener('click', openModal));
  modal.querySelectorAll('[data-approval-close]').forEach((closeControl) => closeControl.addEventListener('click', closeModal));

  document.addEventListener('keydown', (event) => {
    if (modal.getAttribute('aria-hidden') !== 'false') return;
    if (event.key === 'Escape') {
      closeModal();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      email: value('approvalEmail'),
      attendance: value('approvalAttendance'),
      challenge: value('approvalChallenge'),
      name: value('approvalName'),
      organization: value('approvalOrganization'),
      context: value('approvalContext')
    };
    if (!data.email || !data.attendance || !data.challenge) {
      error.textContent = 'Please complete the required fields: work email, preferred attendance option, and main business reason.';
      error.hidden = false;
      return;
    }
    error.hidden = true;
    output.value = buildApprovalText(data);
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.persistApprovalKitRequest) {
      window.persistApprovalKitRequest(data, output.value, {
        programSlug: config.programSlug,
        programName: config.programName
      }).catch((err) => {
        console.error('Approval request sync failed:', err);
        error.textContent = 'Your approval text was created, but we could not save the request for follow-up. Please copy the text and contact IAML if you do not hear from us.';
        error.hidden = false;
      });
    }
    trackApprovalKitEvent('approval_kit_submitted', {
      attendance: data.attendance,
      challenge: data.challenge,
      email_domain: data.email.includes('@') ? data.email.split('@').pop() : ''
    });
  });

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(output.value);
      } catch (_) {
        output.focus();
        output.select();
        document.execCommand('copy');
      }
      copyButton.textContent = 'Copied';
      setTimeout(() => { copyButton.textContent = 'Copy text'; }, 1800);
      trackApprovalKitEvent('approval_kit_copied');
    });
  }
  brochureLinks.forEach((link) => link.addEventListener('click', () => trackApprovalKitEvent('approval_kit_brochure_clicked')));
  if (registerLink) registerLink.addEventListener('click', () => trackApprovalKitEvent('approval_kit_register_clicked'));
})();
