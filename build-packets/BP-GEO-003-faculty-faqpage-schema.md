# Build Packet: BP-GEO-003
## Add FAQPage Schema to faculty.html

**Priority:** P2 | **File:** website/faculty.html | **Type:** Structured Data (JSON-LD)

### Problem
faculty.html has EducationalOrganization + CollectionPage + BreadcrumbList schema but NO FAQPage schema.
AI engines asked "Are IAML instructors practicing attorneys?" or "Who teaches IAML programs?"
cannot extract structured answers from the faculty page.

### Where to Insert
After the closing `</script>` of the BreadcrumbList schema block at line 175, before `</head>`.

### Schema Block to Add

  <!-- Schema.org FAQPage: Faculty Q&A -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Who are IAML's faculty members?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML faculty includes partners from the nation's top employment law firms, in-house counsel from Fortune 500 companies, and HR executives who have built world-class programs. All faculty are active practitioners \u2014 litigating cases, counseling organizations, and navigating real workplace challenges daily."
      }
    },
    {
      "@type": "Question",
      "name": "Are IAML instructors practicing attorneys or academics?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML instructors are practicing attorneys and active HR leaders \u2014 not academics or consultants who left practice to teach. They handle employment law cases, defend discrimination charges, and advise employers on these exact issues in their daily practice. This means participants learn from current, real-world experience, not textbooks."
      }
    },
    {
      "@type": "Question",
      "name": "What areas of employment law and HR does IAML faculty cover?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML faculty covers four main practice areas: Employment Law (discrimination, harassment, termination, FMLA, ADA, NLRA), HR Management (strategic HR, leadership, employee relations), Benefits Law (ERISA, plan administration, fiduciary obligations), and Environmental Health and Safety (OSHA compliance, workplace safety)."
      }
    },
    {
      "@type": "Question",
      "name": "Do IAML instructors have real courtroom experience?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. IAML's employment law faculty are active litigators who represent employers in discrimination charges, labor disputes, and workplace lawsuits. They bring strategies from actual courtrooms and real settlements \u2014 not hypothetical scenarios."
      }
    },
    {
      "@type": "Question",
      "name": "How is IAML's faculty different from typical HR training instructors?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most HR training uses former practitioners, consultants, or academics. IAML uses only active practitioners who are handling these cases right now. When participants ask 'what do I do about this specific situation,' IAML faculty answer from direct, current experience \u2014 not from how things worked years ago."
      }
    }
  ]
}
  </script>

### QA Checklist
- [ ] JSON validates at validator.schema.org
- [ ] No duplicate FAQPage blocks on page (none currently exist)
- [ ] Block inserted before </head>
- [ ] Smoke tests pass after commit

### Notes
- Do NOT modify existing schema blocks
- Q&A content derived from faculty page sections (practice area descriptions, hero section)
- "Practicing attorneys" claim verified against page content
