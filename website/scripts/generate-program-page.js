#!/usr/bin/env node
/**
 * Program Page Generator
 *
 * Generates an HTML program page from JSON data and the template.
 *
 * Usage: node scripts/generate-program-page.js <program-slug>
 * Example: node scripts/generate-program-page.js advanced-employment-law
 */

const fs = require('fs');
const path = require('path');

// Get program slug from command line
const programSlug = process.argv[2];

if (!programSlug) {
  console.error('Usage: node scripts/generate-program-page.js <program-slug>');
  console.error('Example: node scripts/generate-program-page.js advanced-employment-law');
  process.exit(1);
}

// Paths
const dataPath = path.join(__dirname, '..', 'programs', 'data', `${programSlug}.json`);
const templatePath = path.join(__dirname, '..', 'programs', '_template.html');
const outputPath = path.join(__dirname, '..', 'programs', `${programSlug}.html`);

// Check if data file exists
if (!fs.existsSync(dataPath)) {
  console.error(`Error: Data file not found: ${dataPath}`);
  process.exit(1);
}

// Load data
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`Generating program page for: ${data.programName}`);
console.log(`Slug: ${programSlug}`);

// Helper functions
const escapeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Generate delivery options pills HTML
const generateDeliveryPills = (options) => {
  if (!options || options.length === 0) return '';
  return options.map(opt => `<span class="format-pill">${escapeHtml(opt)}</span>`).join('\n                ');
};

// Generate testimonials JSON for inline script
const generateTestimonialsJson = (testimonials) => {
  return JSON.stringify(testimonials, null, 2);
};

// Generate content benefits list items
const generateBenefitsList = (benefits) => {
  if (!benefits || benefits.length === 0) return '';
  return benefits.map(b => `<li>${b}</li>`).join('\n                ');
};

// Generate FAQ items HTML
const generateFaqItems = (faqs) => {
  if (!faqs || faqs.length === 0) return '';
  return faqs.map((faq, index) => `
            <div class="faq-item${index === 0 ? ' active' : ''}">
              <button class="faq-question">
                ${escapeHtml(faq.question)}
                <svg class="faq-chevron" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
              <div class="faq-answer">
                <div class="faq-answer-content">
                  ${faq.answer}
                </div>
              </div>
            </div>`).join('\n');
};

// Generate Schema.org JSON-LD
const generateSchemaJsonLd = (data) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": data.programName,
    "description": data.meta.description,
    "url": data.seo?.canonicalUrl || `https://iaml.com/programs/${data.programSlug}`,
    "image": data.meta.ogImage || "https://iaml.com/images/og-image.jpg",
    "provider": {
      "@type": "Organization",
      "name": "Institute for Applied Management & Law",
      "url": "https://iaml.com",
      "logo": "https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69042ba0346960d8775fb4a4.svg"
    },
    "educationalLevel": data.seo?.schema?.educationalLevel || "intermediate",
    "timeRequired": data.seo?.schema?.timeRequired || "P2D",
    "teaches": data.seo?.schema?.teaches || [],
    "offers": {
      "@type": "Offer",
      "price": data.hero.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": data.registrationUrl
    },
    "hasCourseInstance": [
      {
        "@type": "CourseInstance",
        "courseMode": data.hero.deliveryOptions?.map(o => o.toLowerCase().replace(' ', '')) || ["onsite"],
        "courseWorkload": data.hero.duration
      }
    ]
  };
  return JSON.stringify(schema, null, 2);
};

// Generate curriculum navigation cards
const generateCurriculumNavCards = (blocks) => {
  if (!blocks || blocks.length === 0) return '';

  // For single block programs, we don't need navigation cards
  if (blocks.length === 1) {
    return ''; // Will hide the nav section for single-block programs
  }

  return blocks.map((block, index) => `
          <div class="curriculum-nav-card${index === 0 ? ' active' : ''}" data-target="${block.id}" tabindex="${index === 0 ? '0' : '-1'}" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-controls="${block.id}">
            <div class="block-label">${escapeHtml(block.label)}</div>
            <h3>${escapeHtml(block.title)}</h3>
            <p>${escapeHtml(block.description)}</p>
            <div class="curriculum-price">$${block.price.toLocaleString()}</div>
            <div class="curriculum-availability">${escapeHtml(block.availability || 'Available individually')}</div>
          </div>`).join('\n');
};

// Generate competency group HTML
const generateCompetencyGroup = (group, isFirst = false) => {
  const skillsHtml = group.skills.map(skill => `
                  <div class="competency-item">
                    <div class="competency-item-badge"><span class="skill-badge badge-${skill.level.toLowerCase()}">${skill.level}</span></div>
                    <div class="competency-text">
                      <h4>${escapeHtml(skill.title)}</h4>
                      <p>${escapeHtml(skill.description)}</p>
                    </div>
                  </div>`).join('\n');

  return `
            <div class="competency-group${isFirst ? ' active' : ''}">
              <div class="competency-header" role="button" tabindex="0" aria-expanded="${isFirst ? 'true' : 'false'}">
                <div>
                  <h3>${escapeHtml(group.title)}</h3>
                  <p>${escapeHtml(group.description)}</p>
                </div>
                <div class="competency-toggle"></div>
              </div>
              <div class="competency-content">
                <div class="competency-list">
${skillsHtml}
                </div>
              </div>
            </div>`;
};

// Generate curriculum blocks HTML
const generateCurriculumBlocks = (blocks) => {
  if (!blocks || blocks.length === 0) return '';

  return blocks.map((block, blockIndex) => {
    const groupsHtml = block.competencyGroups.map((group, groupIndex) =>
      generateCompetencyGroup(group, groupIndex === 0)
    ).join('\n');

    return `
          <div id="${block.id}" class="curriculum-block${blockIndex === 0 ? ' active' : ''}" role="tabpanel" aria-labelledby="nav-${block.id}">
${groupsHtml}
          </div>`;
  }).join('\n');
};

// Generate format tabs for "Choose Your Format" section
const generateFormatTabs = (airtable) => {
  const tabs = [];

  if (airtable.inPersonViewId) {
    tabs.push({ id: 'in-person', label: 'In Person', active: true });
  }
  if (airtable.virtualViewId) {
    tabs.push({ id: 'virtual', label: 'Virtual', active: !airtable.inPersonViewId });
  }
  if (airtable.onDemandViewId) {
    tabs.push({ id: 'on-demand', label: 'On Demand', active: !airtable.inPersonViewId && !airtable.virtualViewId });
  }

  return tabs;
};

// Main generation
console.log('Loading template...');

// For now, let's read the ERL page as a reference and create a simpler approach
// We'll read specific sections and build the page

// Read the existing employee-relations-law.html to use as base
const erlPath = path.join(__dirname, '..', 'programs', 'employee-relations-law.html');
let template = fs.readFileSync(erlPath, 'utf8');

console.log('Performing replacements...');

// Meta replacements
template = template.replace(/Certificate in Employee Relations Law - IAML/g, data.meta.title);
template = template.replace(/Master employee relations strategies with practicing attorneys\. 4½-day intensive program\. Learn employment law that prevents 90% of workplace legal issues\./g, data.meta.description);
template = template.replace(/employee relations law, employment law training, HR certification, IAML certificate program, workplace law, employee relations certification, HR law training, employment law course, HR legal compliance, SHRM PDC credits, HRCI recertification, employee relations seminar, workplace investigations training, FMLA training, ADA compliance training, harassment prevention training/g, data.meta.keywords);

// OG and Twitter meta
template = template.replace(/<meta property="og:title" content="[^"]*">/g, `<meta property="og:title" content="${escapeHtml(data.meta.title)}">`);
template = template.replace(/<meta property="og:description" content="[^"]*">/g, `<meta property="og:description" content="${escapeHtml(data.meta.description)}">`);
template = template.replace(/<meta property="og:url" content="[^"]*">/g, `<meta property="og:url" content="https://iaml.com/programs/${data.programSlug}">`);
template = template.replace(/<meta name="twitter:title" content="[^"]*">/g, `<meta name="twitter:title" content="${escapeHtml(data.meta.title)}">`);
template = template.replace(/<meta name="twitter:description" content="[^"]*">/g, `<meta name="twitter:description" content="${escapeHtml(data.meta.description)}">`);

// Canonical URL
template = template.replace(/<link rel="canonical" href="[^"]*">/g, `<link rel="canonical" href="https://iaml.com/programs/${data.programSlug}">`);

// Page title
template = template.replace(/<title>[^<]*<\/title>/g, `<title>${escapeHtml(data.meta.title)}</title>`);

// Hero section - Program title
template = template.replace(/<h1 class="program-title">\s*Certificate in Employee Relations Law\s*<\/h1>/g,
  `<h1 class="program-title">\n              ${data.hero.title}\n            </h1>`);

// Hero description - find and replace the specific paragraph
template = template.replace(/Master employee relations strategies with practicing attorneys who[\s\S]*?for Monday morning\./g,
  data.hero.description);

// Program price
template = template.replace(/Program Enrollment Fee: \$2,375/g, `Program Enrollment Fee: $${data.hero.price.toLocaleString()}`);

// Button ID
template = template.replace(/openModalBtn-employee-relations-law/g, `openModalBtn-${data.programSlug}`);

// Delivery options - replace the format pills
const deliveryPillsRegex = /<div class="format-pills">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<!-- Right Column/;
const newDeliveryPills = `<div class="format-pills">
                ${generateDeliveryPills(data.hero.deliveryOptions)}
              </div>
            </div>
          </section>

          <!-- Right Column`;
template = template.replace(deliveryPillsRegex, newDeliveryPills);

// Content section headline and description
template = template.replace(/Build Employment Law Expertise That Protects and Advances/g, data.contentSection.headline);
template = template.replace(/The Certificate in Employee Relations Law is <span class="program-duration">4½ intensive days<\/span>[\s\S]*?checklists\./g,
  data.contentSection.description);

// Content benefits - this is tricky, let's replace the whole benefits list
const benefitsListRegex = /<ul class="benefits-list">[\s\S]*?<li><strong>Benefits beyond the classroom<\/strong>/;
const newBenefitsList = `<ul class="benefits-list">
                ${generateBenefitsList(data.contentSection.benefits)}
                <li><strong>Benefits beyond the classroom</strong>`;
template = template.replace(benefitsListRegex, newBenefitsList);

// Testimonials data
const testimonialsRegex = /const TESTIMONIALS_DATA = \[[\s\S]*?\];/;
template = template.replace(testimonialsRegex, `const TESTIMONIALS_DATA = ${generateTestimonialsJson(data.testimonials)};`);

// Curriculum header
template = template.replace(/What You'll Master in 4½ Days/g, data.curriculum.header.title);
template = template.replace(/Our employment law curriculum delivers[\s\S]*?From your first day\./g, data.curriculum.header.description);

// Airtable view IDs
template = template.replace(/PROGRAMS_VIEW: 'viwfys9oVCU3gFsel'/g, `PROGRAMS_VIEW: '${data.airtable.inPersonViewId}'`);
if (data.airtable.virtualViewId) {
  template = template.replace(/VIRTUAL_VIEW: 'viwG1w68D5qVdMHIa'/g, `VIRTUAL_VIEW: '${data.airtable.virtualViewId}'`);
} else {
  // Remove virtual view and tab if not present
  template = template.replace(/VIRTUAL_VIEW: 'viwG1w68D5qVdMHIa',/g, `VIRTUAL_VIEW: null,`);
}

// Next Program Card view ID
template = template.replace(/viewId: 'viwfys9oVCU3gFsel'/g, `viewId: '${data.airtable.inPersonViewId}'`);
template = template.replace(/viwfys9oVCU3gFsel contains "Certificate in Employee Relations Law"/g,
  `${data.airtable.inPersonViewId} contains "${data.programName}"`);

// Faculty section data-program-slug
template = template.replace(/data-program-slug="employee-relations-law"/g, `data-program-slug="${data.programSlug}"`);

// Program name in various places (for Airtable queries)
template = template.replace(/Certificate in Employee Relations Law/g, data.programName);
template = template.replace(/certificate in employee relations law/gi, data.programName.toLowerCase());

// Benefits section
template = template.replace(/35\.75 SHRM\/HRCI\/CLE/g, data.benefits.creditCount);
template = template.replace(/\$300-\$500/g, data.benefits.alumniDiscount);

// FAQ section - this requires finding and replacing the entire FAQ block
// For now, let's do a simpler replacement - we'll need to manually adjust this section

// Schema.org JSON-LD - replace the entire script block
const schemaRegex = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
const newSchema = `<script type="application/ld+json">
${generateSchemaJsonLd(data)}
  </script>`;
template = template.replace(schemaRegex, newSchema);

// Handle single-block programs - remove multi-block navigation and step tabs
const isSingleBlock = data.curriculum.blocks.length === 1;

if (isSingleBlock) {
  console.log('Single-block program detected - removing multi-block navigation...');

  // Remove the curriculum navigation section (the 3-card nav at top of curriculum)
  // This matches the entire curriculum-nav div with its 3 nav cards
  const curriculumNavRegex = /<!-- Block Navigation -->\s*<div class="curriculum-nav">[\s\S]*?<\/div>\s*<!-- Curriculum Content Blocks -->/;
  template = template.replace(curriculumNavRegex, '<!-- Curriculum Content Blocks -->');

  // Remove all step tabs footer navigation (appears at bottom of each block)
  // There are 3 of these in the ERL page, one per block
  const stepTabsRegex = /<!-- Step Tabs Footer Navigation -->\s*<nav class="curriculum-step-tabs"[\s\S]*?<\/nav>/g;
  template = template.replace(stepTabsRegex, '');

  // Replace the entire curriculum blocks content with just the single block
  // First, generate the new curriculum content
  const block = data.curriculum.blocks[0];
  const competencyGroupsHtml = block.competencyGroups.map((group, index) => {
    const skillsHtml = group.skills.map(skill => `
                  <div class="competency-item">
                    <div class="competency-item-badge"><span class="skill-badge badge-${skill.level.toLowerCase()}">${skill.level}</span></div>
                    <div class="competency-text">
                      <h4>${escapeHtml(skill.title)}</h4>
                      <p>${escapeHtml(skill.description)}</p>
                    </div>
                  </div>`).join('\n');

    return `
            <!-- Competency Group ${index + 1} -->
            <div class="competency-group${index === 0 ? ' active' : ''}">
              <div class="competency-header" role="button" tabindex="0" aria-expanded="${index === 0 ? 'true' : 'false'}">
                <div>
                  <h3>${escapeHtml(group.title)}</h3>
                  <p>${escapeHtml(group.description)}</p>
                </div>
                <div class="competency-toggle"></div>
              </div>
              <div class="competency-content">
                <div class="competency-list">
${skillsHtml}
                </div>
              </div>
            </div>`;
  }).join('\n');

  // Replace curriculum content blocks section
  const newCurriculumContent = `<!-- Curriculum Content Blocks -->
        <div class="curriculum-content">

          <!-- Single Block: ${escapeHtml(block.title)} -->
          <div id="${block.id}" class="curriculum-block active" role="tabpanel">
${competencyGroupsHtml}

          </div>

        </div>`;

  // Match and replace the entire curriculum content blocks section
  const curriculumContentRegex = /<!-- Curriculum Content Blocks -->\s*<div class="curriculum-content">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<!-- CTA Section -->/;
  template = template.replace(curriculumContentRegex, `${newCurriculumContent}

      </div>
    </section>

    <!-- CTA Section -->`);
}

// Write output
console.log(`Writing to: ${outputPath}`);
fs.writeFileSync(outputPath, template);

console.log('');
console.log('Program page generated successfully!');
console.log(`  Output: ${outputPath}`);
console.log('');
console.log('NOTE: The following sections may need manual adjustment:');
console.log('  - Curriculum blocks (if structure differs from Employee Relations Law)');
console.log('  - FAQ section (if format differs)');
console.log('  - "Choose Your Format" section (if only In-Person, remove Virtual/On-Demand tabs)');
console.log('');
console.log('Run "npx vercel dev" and preview at:');
console.log(`  http://localhost:3000/programs/${programSlug}.html`);
