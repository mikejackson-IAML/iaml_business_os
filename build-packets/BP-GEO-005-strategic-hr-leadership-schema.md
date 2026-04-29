# Build Packet: BP-GEO-005
## Add FAQPage + Organization Schema to strategic-hr-leadership.html

**Priority:** P3 | **File:** website/programs/strategic-hr-leadership.html | **Type:** Structured Data (JSON-LD)

### Problem
strategic-hr-leadership.html has Course schema but is missing:
1. FAQPage schema (all other 13 program pages have this)
2. Organization schema (all other program pages have this)

Note: The explore agent's original finding had this backwards — Course IS present, FAQPage is ABSENT.

### Where to Insert
After the closing </script> tag of the existing Course schema block, before </head>.

### Schema Blocks to Add

Block 1 — FAQPage:

  <!-- Schema.org FAQPage Structured Data -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the Certificate in Strategic HR Leadership program?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Certificate in Strategic HR Leadership is a 4.5-day intensive program from IAML that teaches HR professionals to function as strategic business partners. It covers employment law, performance management, workforce planning, and strategic HR frameworks. Participants earn 29.75 SHRM/HRCI professional development credits."
      }
    },
    {
      "@type": "Question",
      "name": "How is the Strategic HR Leadership program different from basic HR training?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most HR training focuses on compliance and administration. The Strategic HR Leadership program teaches frameworks for positioning HR as a competitive advantage \u2014 measuring HR impact in business terms, influencing executive decisions, and driving organizational performance. It is designed for HR professionals ready to move beyond administrative functions."
      }
    },
    {
      "@type": "Question",
      "name": "What continuing education credits does this program provide?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Certificate in Strategic HR Leadership provides 29.75 SHRM Professional Development Credits (PDC) and HRCI recertification credits. Plus, enrollment includes 12 months of quarterly employment law update sessions (6 additional credits), bringing the total to 35.75 credits."
      }
    },
    {
      "@type": "Question",
      "name": "Who should attend the Strategic HR Leadership program?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The program is designed for HR managers, HR business partners, and HR directors who want to move from an administrative to a strategic role. It is also valuable for senior HR professionals seeking to strengthen their business acumen and influence at the executive level."
      }
    },
    {
      "@type": "Question",
      "name": "Is the program available virtually or only in person?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Certificate in Strategic HR Leadership is available in three formats: in-person at various U.S. locations, live virtual via Zoom with full interaction, and on-demand self-paced over 90 days. All formats include the same practicing attorney and HR executive faculty with identical content and credentials."
      }
    },
    {
      "@type": "Question",
      "name": "What is the cost of the Strategic HR Leadership certificate program?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The complete Certificate in Strategic HR Leadership program is $2,375. This includes all live instruction, complete program materials, 29.75 continuing education credits, pre-program consultation, 12 months of quarterly employment law updates, and permanent access to program resources. There are no hidden fees."
      }
    }
  ]
}
  </script>

Block 2 — Organization:

  <!-- Schema.org Organization Structured Data -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Institute for Applied Management & Law",
  "alternateName": "IAML",
  "url": "https://iaml.com",
  "logo": "https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg",
  "foundingDate": "1979",
  "description": "IAML has provided professional employment law and HR management training to 80,000+ professionals since 1979.",
  "sameAs": [
    "https://www.linkedin.com/company/iaml"
  ]
}
  </script>

### QA Checklist
- [ ] Both JSON blocks validate at validator.schema.org
- [ ] No duplicate blocks on page (currently only Course schema exists)
- [ ] Blocks inserted before </head>
- [ ] Verify FAQ content matches actual page content before committing
- [ ] Smoke tests pass after commit

### Notes
- Do NOT modify the existing Course schema block
- Q&A content should be verified against actual page content and updated if program details differ
- This brings strategic-hr-leadership into parity with all other program pages
