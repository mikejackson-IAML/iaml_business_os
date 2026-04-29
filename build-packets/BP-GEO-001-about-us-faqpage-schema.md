# Build Packet: BP-GEO-001
## Add FAQPage Schema to about-us.html

**Priority:** P1 | **File:** website/about-us.html | **Type:** Structured Data (JSON-LD)

### Problem
about-us.html has AboutPage + Organization schema but NO FAQPage schema.
AI engines asked "What is IAML?" or "Why do HR professionals trust IAML?" cannot
extract structured answers. This is IAML's primary brand authority page.

### Where to Insert
After the closing `</script>` at line 113 (end of existing schema block), before `</head>`.

### Schema Block to Add

Insert this HTML verbatim:

  <!-- Schema.org FAQPage: Brand Authority Q&A -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is IAML?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML (Institute for Applied Management & Law) is a professional HR training organization founded in 1979. IAML has trained 80,000+ HR professionals in employment law, labor relations, benefits law, and HR management. All programs are taught by practicing employment law attorneys with real courtroom experience."
      }
    },
    {
      "@type": "Question",
      "name": "Who teaches at IAML?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML faculty are practicing employment law attorneys and senior HR executives \u2014 not academics. They actively litigate employment cases, counsel employers on compliance, and bring current real-world strategies to every program."
      }
    },
    {
      "@type": "Question",
      "name": "How long has IAML been training HR professionals?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML has been providing professional HR and employment law training since 1979 \u2014 over 45 years. During that time, IAML has trained more than 80,000 HR professionals across the United States."
      }
    },
    {
      "@type": "Question",
      "name": "How many professionals has IAML trained?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML has trained over 80,000 HR professionals, employment attorneys, and organizational leaders since 1979. Participants include HR managers from Fortune 500 companies, government agencies, healthcare organizations, and businesses of all sizes nationwide."
      }
    },
    {
      "@type": "Question",
      "name": "What professional credentials does IAML training provide?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML is an approved provider for SHRM Professional Development Credits (PDC), HRCI recertification credits, and CLE (Continuing Legal Education) credits. Most full programs provide 20-30+ credits, typically more than HR professionals earn in two years through other sources."
      }
    },
    {
      "@type": "Question",
      "name": "What makes IAML different from other HR training providers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The defining difference is faculty: IAML uses only practicing attorneys who handle employment law cases daily \u2014 not academics teaching from textbooks. Content is continuously updated to reflect current court decisions, regulatory changes, and real workplace challenges."
      }
    },
    {
      "@type": "Question",
      "name": "Is IAML training available online or only in person?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML offers three delivery formats: in-person programs at various U.S. locations, live virtual programs via Zoom with full Q&A, and on-demand self-paced access over 90 days. Corporate training can also be delivered on-site at your organization."
      }
    },
    {
      "@type": "Question",
      "name": "What types of organizations trust IAML for HR training?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML trains HR professionals from Fortune 500 companies, mid-size businesses, government agencies, healthcare systems, educational institutions, and nonprofits across the United States."
      }
    }
  ]
}
  </script>

### QA Checklist
- [ ] JSON validates at validator.schema.org
- [ ] No duplicate FAQPage blocks on the page (none currently exist)
- [ ] Block inserted before </head> closing tag
- [ ] Smoke tests pass after commit

### Notes
- Do NOT modify existing schema blocks — add only
- All Q&A answers derived from existing on-page content (President's letter, hero, faculty sections)
- No new factual claims introduced
