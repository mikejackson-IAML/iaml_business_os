# Build Packet: BP-GEO-002
## Add FAQPage + HowTo Schema to corporate-training.html

**Priority:** P1 | **File:** website/corporate-training.html | **Type:** Structured Data (JSON-LD)

### Problem
corporate-training.html has Service + OfferCatalog + Organization schema but:
- NO FAQPage schema despite being a high-intent conversion page
- NO HowTo schema despite having a detailed 4-step "How It Works" process (Discovery Call -> Proposal -> Customization -> Delivery)

AI engines asked "How does IAML corporate training work?" cannot extract structured answers.

### Where to Insert
After the closing `</script>` tag of the BreadcrumbList schema block (around line 878),
before `</head>`.

### Schema Blocks to Add

Add both blocks below in sequence:

Block 1 — FAQPage:

  <!-- Schema.org FAQPage: Corporate Training Q&A -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is IAML corporate training?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML corporate training delivers custom HR compliance and employment law programs directly to your organization. Programs are designed by practicing employment law attorneys and tailored to your specific policies, procedures, and workplace challenges. Available on-site at your location or delivered virtually."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get a corporate training proposal from IAML?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The process starts with a 15-20 minute discovery call to understand your team's needs, challenges, and goals. Within 48 hours, IAML delivers a custom proposal with program design and pricing. There is no pressure and no sales tactics \u2014 just a straightforward recommendation based on what we heard."
      }
    },
    {
      "@type": "Question",
      "name": "Can IAML training be customized for our organization?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. IAML builds every corporate program around your specific policies, procedures, and hot-button issues. Programs address your actual workplace challenges in a confidential setting. We review draft materials with you before delivery and adjust based on your feedback."
      }
    },
    {
      "@type": "Question",
      "name": "What topics can IAML cover in corporate training?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML corporate programs cover employment law and compliance, harassment prevention and respectful workplace training, HR manager development and leadership, employee benefits law, labor relations, workplace investigations, ADA and FMLA compliance, and more. Programs can focus on a single topic or combine multiple subject areas."
      }
    },
    {
      "@type": "Question",
      "name": "Is IAML corporate training available virtually?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. IAML delivers corporate training both on-site at your organization's location and virtually via live video conferencing. Both formats use the same practicing attorney instructors with full interaction and Q&A. Format choice does not affect content quality or depth."
      }
    },
    {
      "@type": "Question",
      "name": "How long does IAML corporate training take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IAML corporate programs range from focused half-day sessions to multi-day comprehensive programs depending on your organization's needs and scope. Program length is determined during the discovery call and tailored to your schedule and learning objectives."
      }
    },
    {
      "@type": "Question",
      "name": "What post-training support does IAML provide?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "After training delivery, IAML provides 30 days of follow-up access to answer lingering questions and provide additional resources. Your team can reach out with real workplace situations that arise after training."
      }
    }
  ]
}
  </script>

Block 2 — HowTo:

  <!-- Schema.org HowTo: Corporate Training Process -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Get IAML Corporate Training for Your Organization",
  "description": "IAML delivers custom HR compliance and employment law training to organizations. Here is how the process works.",
  "totalTime": "PT48H",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Discovery Call (15-20 Minutes)",
      "text": "Schedule a brief call to discuss your team's needs: what challenges they face, what skills they need, how many people are involved, and what specific topics or compliance issues are top of mind.",
      "url": "https://iaml.com/corporate-training"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Custom Proposal (Within 48 Hours)",
      "text": "IAML delivers a tailored proposal including program design, topic coverage, delivery format options, and pricing. Review the proposal and provide feedback \u2014 IAML adjusts based on your input.",
      "url": "https://iaml.com/corporate-training"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Content Customization (Collaborative Process)",
      "text": "IAML builds the program around your specific policies, procedures, and hot-button issues. Draft materials are reviewed with you before delivery.",
      "url": "https://iaml.com/corporate-training"
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Training Delivery and 30-Day Follow-Up",
      "text": "Training is delivered on-site or virtually by practicing employment law attorneys. IAML follows up to answer lingering questions and provides 30 days of post-training access to additional resources.",
      "url": "https://iaml.com/corporate-training"
    }
  ]
}
  </script>

### QA Checklist
- [ ] Both JSON blocks validate at validator.schema.org
- [ ] No duplicate FAQPage or HowTo blocks on the page (none currently exist)
- [ ] Blocks inserted before </head> closing tag
- [ ] Smoke tests pass after commit

### Notes
- Do NOT modify existing Service, OfferCatalog, Organization, or BreadcrumbList schema
- FAQPage Q&A answers derived from the "How It Works" section content (lines 987-1160)
- HowTo steps map directly to the 4 ct-content-step-title headings on the page
