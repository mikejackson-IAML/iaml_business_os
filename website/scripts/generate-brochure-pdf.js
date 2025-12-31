#!/usr/bin/env node

/**
 * IAML Brochure PDF Generator
 *
 * Generates PDF brochures from program JSON data using Puppeteer.
 *
 * Usage:
 *   node generate-brochure-pdf.js [program-slug]
 *   node generate-brochure-pdf.js hr-law-fundamentals
 *   node generate-brochure-pdf.js --all
 *
 * Prerequisites:
 *   npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    programsDir: path.join(__dirname, '../programs/data'),
    facultyDir: path.join(__dirname, '../data/faculty/by-program'),
    templatesDir: path.join(__dirname, '../brochures/templates'),
    outputDir: path.join(__dirname, '../brochures/output'),
    templateFile: 'program-brochure.html',
    cssFile: 'brochure-styles.css'
};

/**
 * Load program data from JSON file
 */
function loadProgramData(slug) {
    const filePath = path.join(CONFIG.programsDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Program data not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Load faculty data for a program
 */
function loadFacultyData(slug) {
    const filePath = path.join(CONFIG.facultyDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
        console.warn(`Faculty data not found for ${slug}, using empty array`);
        return { faculty: [] };
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Load and prepare template HTML
 */
function loadTemplate() {
    const templatePath = path.join(CONFIG.templatesDir, CONFIG.templateFile);
    const cssPath = path.join(CONFIG.templatesDir, CONFIG.cssFile);

    let html = fs.readFileSync(templatePath, 'utf-8');
    const css = fs.readFileSync(cssPath, 'utf-8');

    // Inline the CSS for PDF generation
    html = html.replace(
        '<link rel="stylesheet" href="brochure-styles.css">',
        `<style>${css}</style>`
    );

    return html;
}

/**
 * Generate delivery options HTML
 */
function generateDeliveryOptions(options) {
    return options.map(opt =>
        `<span class="delivery-option">${opt}</span>`
    ).join('\n');
}

/**
 * Generate delivery options list HTML
 */
function generateDeliveryOptionsList(options) {
    return options.map(opt => `<li>${opt} sessions available</li>`).join('\n');
}

/**
 * Generate benefits list HTML
 */
function generateBenefitsList(benefits) {
    return benefits.map(benefit => `
        <div class="benefit-item">
            <span class="benefit-icon">&#10003;</span>
            <div class="benefit-text">${benefit}</div>
        </div>
    `).join('\n');
}

/**
 * Generate curriculum blocks HTML (split into two pages)
 */
function generateCurriculumBlocks(curriculum) {
    const blocks = curriculum.blocks || [];
    const allGroups = [];

    blocks.forEach(block => {
        (block.competencyGroups || []).forEach(group => {
            allGroups.push(group);
        });
    });

    // Split groups: 55% on page 1 to avoid footer overlap (5/4 split for 9 groups)
    const splitPoint = Math.ceil(allGroups.length * 0.55); // ~55% on first page
    const page1Groups = allGroups.slice(0, splitPoint);
    const page2Groups = allGroups.slice(splitPoint);

    const generateGroupHtml = (groups) => {
        return groups.map(group => `
            <div class="competency-group">
                <h3>${group.title}</h3>
                <div class="skill-list">
                    ${(group.skills || []).slice(0, 4).map(skill => `
                        <div class="skill-item">
                            <span class="skill-level ${skill.level.toLowerCase()}">${skill.level}</span>
                            <span class="skill-title">${skill.title}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('\n');
    };

    return {
        page1: generateGroupHtml(page1Groups),
        page2: generateGroupHtml(page2Groups)
    };
}

/**
 * Generate faculty cards HTML
 */
function generateFacultyCards(faculty) {
    // Sort faculty to prioritize those with bios
    const sortedFaculty = [...faculty].sort((a, b) => {
        // Faculty with bios come first
        const aBio = a.bio && a.bio.trim().length > 0 ? 1 : 0;
        const bBio = b.bio && b.bio.trim().length > 0 ? 1 : 0;
        return bBio - aBio;
    });

    // Take up to 6 faculty (or all if fewer than 6)
    const topFaculty = sortedFaculty.slice(0, 6);
    console.log(`Faculty count: ${faculty.length}, showing: ${topFaculty.length}`);
    console.log(`Faculty names: ${topFaculty.map(f => f.name).join(', ')}`);

    return topFaculty.map(member => {
        const initials = member.name.split(' ')
            .map(n => n[0])
            .filter(c => c && c.match(/[A-Z]/))
            .slice(0, 2)
            .join('');

        // Use short bio - first sentence only, max 120 chars
        let shortBio = '';
        if (member.bio && member.bio.trim().length > 0) {
            const firstSentence = member.bio.split(/[.!?]/)[0];
            shortBio = firstSentence.length > 120
                ? firstSentence.substring(0, 117) + '...'
                : firstSentence + '.';
        }

        // Use actual image if available, otherwise fall back to initials
        const photoHtml = member.imageUrl
            ? `<img class="faculty-photo" src="${member.imageUrl}" alt="${member.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="faculty-photo-placeholder" style="display:none;">${initials}</div>`
            : `<div class="faculty-photo-placeholder">${initials}</div>`;

        // Build title with organization
        const titleParts = [];
        if (member.title) titleParts.push(member.title);
        if (member.organization) titleParts.push(member.organization);
        const titleText = titleParts.join(', ');

        return `
            <div class="faculty-card">
                <div class="faculty-card-header">
                    ${photoHtml}
                    <div class="faculty-info">
                        <h4>${member.name}</h4>
                        <p class="faculty-title">${titleText}</p>
                    </div>
                </div>
                ${shortBio ? `<p class="faculty-bio">${shortBio}</p>` : ''}
            </div>
        `;
    }).join('\n');
}

/**
 * Generate testimonials HTML
 */
function generateTestimonials(testimonials) {
    // Take top 7 testimonials to fill the page
    const topTestimonials = testimonials.slice(0, 7);

    return topTestimonials.map(t => `
        <div class="testimonial-card" style="background: #ffffff !important; border: none !important;">
            <p class="testimonial-quote">"${t.quote}"</p>
            <div class="testimonial-author">
                <span class="testimonial-name">${t.name}</span>
                <span class="testimonial-role">${t.title}, ${t.company}</span>
            </div>
        </div>
    `).join('\n');
}

/**
 * Generate FAQ items HTML
 * Selects impactful FAQs that add value beyond what's already in the brochure
 */
function generateFaqItems(faq) {
    // Priority keywords for selecting impactful FAQs (avoiding duplicates of price/credits/format info)
    const impactfulKeywords = ['new to', 'experience', 'ready', 'learn', 'advanced', 'after', 'apply', 'different'];
    const skipKeywords = ['register', 'credit', 'format', 'virtual', 'in-person', 'price', 'fee', 'cost'];

    // Filter and score FAQs for relevance
    const scoredFaqs = faq.map((item, index) => {
        const questionLower = item.question.toLowerCase();
        const hasImpactful = impactfulKeywords.some(kw => questionLower.includes(kw));
        const hasSkip = skipKeywords.some(kw => questionLower.includes(kw));
        return {
            ...item,
            index,
            score: hasImpactful && !hasSkip ? 2 : (!hasSkip ? 1 : 0)
        };
    });

    // Sort by score (highest first) and take top 3
    const selectedFaqs = scoredFaqs
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    return selectedFaqs.map(item => `
        <div class="faq-item">
            <p class="faq-question">${item.question}</p>
            <p class="faq-answer">${item.answer}</p>
        </div>
    `).join('\n');
}

/**
 * Generate CTA content
 */
function generateCtaContent(programName) {
    return `Join HR professionals and employment attorneys who have mastered ${programName}.
    Build the legal foundation that protects your organization and advances your career.
    Upcoming sessions are available in-person and virtual formats.`;
}

/**
 * Generate overview content
 */
function generateOverviewContent(program) {
    const content = program.contentSection || {};
    const hero = program.hero || {};

    let overview = '';

    // Use content section headline as intro
    if (content.headline) {
        overview += `<p><strong>${content.headline}</strong></p>\n`;
    }

    // Use hero description
    if (hero.description) {
        overview += `<p>${hero.description}</p>\n`;
    }

    // Add content section description
    if (content.description) {
        // Strip HTML tags for cleaner text
        const cleanDesc = content.description.replace(/<[^>]*>/g, '');
        overview += `<p>${cleanDesc}</p>\n`;
    }

    return overview;
}

/**
 * Populate template with program data
 */
function populateTemplate(template, programData, facultyData) {
    const program = programData;
    const faculty = facultyData.faculty || [];
    const hero = program.hero || {};
    const curriculum = program.curriculum || {};
    const benefits = program.benefits || {};
    const contentSection = program.contentSection || {};

    const curriculumBlocks = generateCurriculumBlocks(curriculum);

    const replacements = {
        '{{PROGRAM_NAME}}': program.programName || 'Program',
        '{{HERO_DESCRIPTION}}': hero.description || '',
        '{{DURATION}}': hero.duration || '2 days',
        '{{PRICE}}': (hero.price || 0).toLocaleString(),
        '{{CREDITS}}': (benefits.creditCount || '13').toString().match(/\d+/)?.[0] || '13',
        '{{DELIVERY_OPTIONS}}': generateDeliveryOptions(hero.deliveryOptions || []),
        '{{DELIVERY_OPTIONS_LIST}}': generateDeliveryOptionsList(hero.deliveryOptions || []),
        '{{OVERVIEW_CONTENT}}': generateOverviewContent(program),
        '{{BENEFITS_LIST}}': generateBenefitsList(contentSection.benefits || []),
        '{{CURRICULUM_TITLE}}': curriculum.header?.title || 'What You\'ll Learn',
        '{{CURRICULUM_DESCRIPTION}}': curriculum.header?.description || '',
        '{{CURRICULUM_BLOCKS_1}}': curriculumBlocks.page1,
        '{{CURRICULUM_BLOCKS_2}}': curriculumBlocks.page2,
        '{{FACULTY_CARDS}}': generateFacultyCards(faculty),
        '{{TESTIMONIALS}}': generateTestimonials(program.testimonials || []),
        '{{FAQ_ITEMS}}': generateFaqItems(program.faq || []),
        '{{UPDATE_PERIOD}}': benefits.updatePeriod || '12 months',
        '{{ALUMNI_DISCOUNT}}': benefits.alumniDiscount || 'Up to $500',
        '{{CTA_CONTENT}}': generateCtaContent(program.programName)
    };

    let result = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return result;
}

/**
 * Generate PDF from HTML using Puppeteer
 */
async function generatePdf(html, outputPath) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set content and wait for fonts to load
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'domcontentloaded']
        });

        // Wait a bit for fonts to render
        await page.evaluate(() => {
            return new Promise(resolve => setTimeout(resolve, 500));
        });

        // Generate PDF
        await page.pdf({
            path: outputPath,
            format: 'Letter',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        console.log(`Generated: ${outputPath}`);
        return outputPath;
    } finally {
        await browser.close();
    }
}

/**
 * Generate brochure for a single program
 */
async function generateBrochure(slug) {
    console.log(`\nGenerating brochure for: ${slug}`);

    try {
        // Load data
        const programData = loadProgramData(slug);
        const facultyData = loadFacultyData(slug);

        // Load and populate template
        const template = loadTemplate();
        const html = populateTemplate(template, programData, facultyData);

        // Ensure output directory exists
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // Generate PDF
        const outputPath = path.join(CONFIG.outputDir, `${slug}-brochure.pdf`);
        await generatePdf(html, outputPath);

        return outputPath;
    } catch (error) {
        console.error(`Error generating brochure for ${slug}:`, error.message);
        throw error;
    }
}

/**
 * Get list of all available program slugs
 */
function getAllProgramSlugs() {
    const files = fs.readdirSync(CONFIG.programsDir);
    return files
        .filter(f => f.endsWith('.json') && !f.startsWith('_'))
        .map(f => f.replace('.json', ''));
}

/**
 * Main entry point
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node generate-brochure-pdf.js [program-slug]');
        console.log('  node generate-brochure-pdf.js --all');
        console.log('  node generate-brochure-pdf.js --list');
        console.log('\nExamples:');
        console.log('  node generate-brochure-pdf.js hr-law-fundamentals');
        console.log('  node generate-brochure-pdf.js strategic-hr-management');
        process.exit(1);
    }

    if (args[0] === '--list') {
        const slugs = getAllProgramSlugs();
        console.log('Available programs:');
        slugs.forEach(s => console.log(`  - ${s}`));
        process.exit(0);
    }

    if (args[0] === '--all') {
        const slugs = getAllProgramSlugs();
        console.log(`Generating brochures for ${slugs.length} programs...`);

        for (const slug of slugs) {
            try {
                await generateBrochure(slug);
            } catch (error) {
                console.error(`Failed: ${slug}`);
            }
        }

        console.log('\nDone!');
    } else {
        await generateBrochure(args[0]);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

// Export for use as module
module.exports = {
    generateBrochure,
    loadProgramData,
    loadFacultyData,
    populateTemplate,
    getAllProgramSlugs
};
