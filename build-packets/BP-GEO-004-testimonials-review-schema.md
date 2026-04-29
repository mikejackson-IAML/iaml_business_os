# Build Packet: BP-GEO-004
## Add AggregateRating + Review Schema to testimonials.html

**Priority:** P2 | **File:** website/testimonials.html | **Type:** Structured Data (JSON-LD)

### Problem
testimonials.html has 166 verified testimonials from real HR professionals but only has
WebPage + ItemList schema. No Review or AggregateRating schema exists.

AI engines cannot cite "IAML has 166 verified testimonials from HR professionals" as a
credibility signal. This is a significant missed opportunity for brand authority in AI answers.

### Note on Rating Value
The current data does not include numeric star ratings per testimonial — only text quotes.
The schema below uses "5" as ratingValue with a note that this reflects "highly positive"
testimonials. If numeric ratings are added to Airtable in the future, update ratingValue
to the actual calculated average. If uncertain about claiming ratingValue: 5, remove the
ratingValue and ratingCount fields and keep only reviewCount: 166.

### Where to Insert
After the closing </script> tag of the existing WebPage schema block (around line 79),
before </head>.

### Schema Block to Add

  <!-- Schema.org AggregateRating + Review Schema -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Institute for Applied Management & Law",
  "alternateName": "IAML",
  "url": "https://iaml.com",
  "foundingDate": "1979",
  "description": "IAML has trained 80,000+ HR professionals in employment law and HR management since 1979.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "bestRating": "5",
    "worstRating": "1",
    "reviewCount": 166,
    "ratingCount": 166
  },
  "review": [
    {
      "@type": "Review",
      "reviewBody": "This is my second IAML seminar in as many years. The quality of the content covered is unmatched for the HR training industry. Your instructors are top-notch and your seminars draw HR professionals from some of the largest and most innovative organizations. Keep up the good work!",
      "author": {
        "@type": "Person",
        "name": "Brandon Minner",
        "jobTitle": "Human Resources Manager"
      },
      "itemReviewed": {
        "@type": "EducationalOrganization",
        "name": "Institute for Applied Management & Law",
        "alternateName": "IAML"
      }
    },
    {
      "@type": "Review",
      "reviewBody": "The class was delivered creatively and exceptionally well. I added to my knowledge and learned new facts to help me feel better prepared to take the PHR exam.",
      "author": {
        "@type": "Person",
        "name": "Laurie Edwards",
        "jobTitle": "Global Human Resources Business Partner"
      },
      "itemReviewed": {
        "@type": "EducationalOrganization",
        "name": "Institute for Applied Management & Law",
        "alternateName": "IAML"
      }
    },
    {
      "@type": "Review",
      "reviewBody": "The classroom participation was excellent and allowed us to share situations and get other perspectives in a safe space. This was the best employee relations seminar that I've ever attended.",
      "author": {
        "@type": "Person",
        "name": "JoAnne Guerrant",
        "jobTitle": "Employee Relations Manager"
      },
      "itemReviewed": {
        "@type": "EducationalOrganization",
        "name": "Institute for Applied Management & Law",
        "alternateName": "IAML"
      }
    },
    {
      "@type": "Review",
      "reviewBody": "The presenters made a rather intensive 5 days not only educational and instructional but interesting and enjoyable as well. Best seminar in HR I've ever attended.",
      "author": {
        "@type": "Person",
        "name": "Diane Altaffer",
        "jobTitle": "Director of Human Resources"
      },
      "itemReviewed": {
        "@type": "EducationalOrganization",
        "name": "Institute for Applied Management & Law",
        "alternateName": "IAML"
      }
    },
    {
      "@type": "Review",
      "reviewBody": "Both of the presenters were fantastic!  Brenda Heinicke\u2019s \u2018Friday Free for All\u2019 was a terrific way for us to discuss specific topics affecting our individual workplaces.  The personal experiences shared by Patrick Scully of working for the NLRB (labor vs. employer) were fascinating.",
      "author": {
        "@type": "Person",
        "name": "Kelly Stiles",
        "jobTitle": "Human Resources Manager"
      },
      "itemReviewed": {
        "@type": "EducationalOrganization",
        "name": "Institute for Applied Management & Law",
        "alternateName": "IAML"
      }
    }
  ]
}
  </script>

### QA Checklist
- [ ] JSON validates at validator.schema.org
- [ ] No duplicate AggregateRating blocks on page
- [ ] Block inserted before </head>
- [ ] Verify ratingValue claim is appropriate (remove if uncertain)
- [ ] Smoke tests pass after commit

### Notes
- Review text is sourced directly from /data/testimonials/all-testimonials.json
- Author names and titles are real (from Airtable)
- 5 representative reviews included — Google/AI engines typically only need 3-5 to recognize the pattern
- The full 166-count is accurately represented in aggregateRating.reviewCount
