#!/usr/bin/env node

/**
 * IAML Brochure PDF Generator - v2.0
 *
 * Generates professional PDF brochures from program JSON data.
 * Features:
 * - Block-based curriculum with pricing info
 * - Top 8 strongest testimonials (scored)
 * - Upcoming sessions with location images
 * - Pre-program consultation section
 * - Dynamic page generation
 *
 * Usage:
 *   node generate-brochure-pdf.js [program-slug]
 *   node generate-brochure-pdf.js --all
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
    programsDir: path.join(__dirname, '../programs/data'),
    facultyDir: path.join(__dirname, '../data/faculty/by-program'),
    sessionsFile: path.join(__dirname, '../data/sessions/all-sessions.json'),
    templatesDir: path.join(__dirname, '../brochures/templates'),
    outputDir: path.join(__dirname, '../brochures/output'),
    cssFile: 'brochure-styles.css'
};

// Pagination limits
const ITEMS_PER_PAGE = {
    faculty: 8,
    testimonials: 8,
    faqs: 4
};

// ============================================
// DATA LOADING
// ============================================

function loadProgramData(slug) {
    const filePath = path.join(CONFIG.programsDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Program data not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadFacultyData(slug) {
    const filePath = path.join(CONFIG.facultyDir, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
        console.warn(`Faculty data not found for ${slug}, using empty array`);
        return { faculty: [] };
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadUpcomingSessions(programName) {
    if (!fs.existsSync(CONFIG.sessionsFile)) {
        console.warn('Sessions file not found');
        return [];
    }

    const allSessions = JSON.parse(fs.readFileSync(CONFIG.sessionsFile, 'utf-8'));
    const today = new Date();

    return allSessions.records
        .filter(s => {
            const pName = s.fields['Program Name']?.[0];
            return pName && pName.toLowerCase().includes(programName.toLowerCase().replace('certificate in ', ''));
        })
        .filter(s => s.fields['Start Date'] && new Date(s.fields['Start Date']) > today)
        .filter(s => s.fields['Show on Website'])
        .filter(s => s.fields['Format'] !== 'On Demand') // Exclude on-demand
        .sort((a, b) => new Date(a.fields['Start Date']) - new Date(b.fields['Start Date']))
        .slice(0, 3);
}

function loadCss() {
    const cssPath = path.join(CONFIG.templatesDir, CONFIG.cssFile);
    return fs.readFileSync(cssPath, 'utf-8');
}

// ============================================
// IMAGE OPTIMIZATION
// ============================================

// Cache for optimized image data URIs
const imageCache = new Map();

/**
 * Fetch an image from URL and return as Buffer
 */
function fetchImage(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                fetchImage(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Optimize an image URL and return a data URI
 * @param {string} url - Image URL
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality (1-100)
 */
async function optimizeImageUrl(url, maxWidth = 300, quality = 70) {
    // Return cached version if available
    const cacheKey = `${url}-${maxWidth}-${quality}`;
    if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey);
    }

    try {
        // Skip SVGs - they're already small
        if (url.endsWith('.svg') || url.includes('.svg')) {
            return url;
        }

        // Skip QR codes - they're generated at appropriate size
        if (url.includes('qrserver.com')) {
            return url;
        }

        console.log(`  Optimizing: ${url.substring(0, 60)}...`);
        const imageBuffer = await fetchImage(url);

        // Resize and compress with sharp
        const optimized = await sharp(imageBuffer)
            .resize(maxWidth, null, { withoutEnlargement: true })
            .jpeg({ quality })
            .toBuffer();

        const dataUri = `data:image/jpeg;base64,${optimized.toString('base64')}`;

        // Cache the result
        imageCache.set(cacheKey, dataUri);

        const originalKB = Math.round(imageBuffer.length / 1024);
        const optimizedKB = Math.round(optimized.length / 1024);
        console.log(`    ${originalKB}KB -> ${optimizedKB}KB (${Math.round((1 - optimizedKB/originalKB) * 100)}% reduction)`);

        return dataUri;
    } catch (error) {
        console.warn(`  Failed to optimize ${url}: ${error.message}`);
        return url; // Return original URL on failure
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function paginateItems(items, itemsPerPage) {
    const pages = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
        pages.push(items.slice(i, i + itemsPerPage));
    }
    return pages;
}

function formatDateRange(startDate, endDate) {
    const options = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' });
    return `${start} - ${end}`;
}

function scoreTestimonial(t) {
    let score = 0;
    // Length bonus (longer = more detailed, cap at 5 points)
    score += Math.min(t.quote.length / 50, 5);
    // Senior title bonus
    if (/director|vp|vice president|manager|attorney|specialist|lead|senior|chief/i.test(t.title)) score += 3;
    // Specific content mentions
    if (/instructor|attorney|practical|apply|valuable|excellent|outstanding|recommend/i.test(t.quote)) score += 2;
    // Company recognition (Fortune 500 types)
    if (/deere|federal|corporation|inc\.|llc/i.test(t.company)) score += 1;
    return score;
}

function selectStrongestTestimonials(testimonials, count = 8) {
    if (!testimonials || testimonials.length === 0) return [];
    return testimonials
        .map(t => ({ ...t, score: scoreTestimonial(t) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
}

// ============================================
// HTML GENERATION - STRUCTURE
// ============================================

function getHtmlHead(programName, css) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${programName} - IAML Program Brochure</title>
    <style>${css}</style>
</head>
<body>
`;
}

function getHtmlFoot() {
    return `</body></html>`;
}

function generatePageFooter(pageNum, darkMode = false) {
    const style = darkMode ? 'border-top-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.6);' : '';
    return `
        <div class="page-footer" style="${style}">
            <span>IAML | Institute for Applied Management & Law</span>
            <span class="page-number">${pageNum}</span>
        </div>
    `;
}

// ============================================
// PAGE GENERATORS
// ============================================

function generateCoverPage(programData) {
    const program = programData.program || programData;
    const hero = programData.hero || {};
    const benefits = programData.benefits || {};

    const price = hero.price || program.price || 0;
    const duration = hero.duration || program.duration || '2 days';
    const deliveryOptions = hero.deliveryOptions || program.deliveryOptions || [];
    const credits = (benefits.credits || benefits.creditCount || '13').toString().match(/[\d.]+/)?.[0] || '13';
    const programName = program.name || programData.programName || hero.title || 'Program';

    return `
    <div class="page cover-page">
        <div class="logo">
            <img src="https://storage.googleapis.com/msgsndr/MjGEy0pobNT9su2YJqFI/media/69541d517483036e7b3a3c24.svg" alt="IAML Logo" />
        </div>
        <h1>${programName}</h1>
        <p class="tagline">${hero.description || ''}</p>
        <div class="hero-stats">
            <div class="hero-stat">
                <div class="hero-stat-value">${duration}</div>
                <div class="hero-stat-label">Duration</div>
            </div>
            <div class="hero-stat">
                <div class="hero-stat-value">$${price.toLocaleString()}</div>
                <div class="hero-stat-label">Investment</div>
            </div>
            <div class="hero-stat">
                <div class="hero-stat-value">${credits} credits</div>
                <div class="hero-stat-label">SHRM/HRCI/CLE</div>
            </div>
        </div>
        <div class="delivery-options">
            ${deliveryOptions.map(opt => `<span class="delivery-option">${opt === 'Virtual' ? 'Live Virtual' : opt}</span>`).join('\n')}
        </div>
    </div>
`;
}

function generateOverviewPage(programData, pageNum) {
    const program = programData.program || programData;
    const content = programData.content || {};
    const hero = programData.hero || {};
    const benefits = content.benefits || [];

    // Build overview text
    let overview = '';
    if (content.headline) {
        overview += `<p><strong>${content.headline}</strong></p>\n`;
    }
    if (hero.description) {
        overview += `<p>${hero.description}</p>\n`;
    }
    if (content.description) {
        const cleanDesc = content.description.replace(/<[^>]*>/g, '');
        overview += `<p>${cleanDesc}</p>\n`;
    }

    // Benefits list
    const benefitsHtml = benefits.length > 0 ? benefits.map(benefit => {
        const text = typeof benefit === 'string'
            ? benefit
            : `<strong>${benefit.title}</strong>: ${benefit.description}`;
        return `
            <div class="benefit-item">
                <span class="benefit-icon">&#10003;</span>
                <div class="benefit-text">${text}</div>
            </div>
        `;
    }).join('\n') : '<p class="text-muted">Program benefits will prepare you for real-world application.</p>';

    // Pre-program consultation section
    const consultationHtml = `
        <div class="consultation-section">
            <h3>Your Pre-Program Consultation</h3>
            <p>Every enrollment includes a complimentary 10-15 minute consultation with our team. Before your program begins, we'll discuss your specific challenges, identify which topics will have the biggest impact for your role, and ensure you get maximum value from your investment.</p>
        </div>
    `;

    return `
    <div class="page overview-page">
        <h2>Program Overview</h2>
        <div class="overview-content">
            ${overview}
        </div>
        <h3>What You'll Gain</h3>
        <div class="benefits-list">
            ${benefitsHtml}
        </div>
        ${consultationHtml}
        ${generatePageFooter(pageNum)}
    </div>
`;
}

function generateGroupHtml(group) {
    const skillsHtml = (group.skills || []).map(skill => `
        <div class="skill-item">
            <div class="skill-header">
                <span class="skill-level ${skill.level.toLowerCase()}">${skill.level}</span>
                <span class="skill-title">${skill.name || skill.title}</span>
            </div>
            ${skill.description ? `<p class="skill-description">${skill.description}</p>` : ''}
        </div>
    `).join('');

    return `
        <div class="competency-group">
            <h4>${group.title}</h4>
            <div class="skill-list">
                ${skillsHtml}
            </div>
        </div>
    `;
}

function generateCurriculumBlockPages(curriculum, startPageNum) {
    const blocks = curriculum.blocks || [];
    if (blocks.length === 0) {
        return { html: '', count: 0 };
    }

    const isMultiBlock = blocks.length > 1;
    let pagesHtml = '';
    let pageCount = 0;

    blocks.forEach((block, blockIdx) => {
        const groups = block.competencyGroups || [];
        const groupsPerPage = 3; // Fit ~3 competency groups per page
        const groupPages = paginateItems(groups, groupsPerPage);

        groupPages.forEach((pageGroups, pageIdx) => {
            const pageNum = startPageNum + pageCount;
            const isFirstPageOfBlock = pageIdx === 0;

            const blockHeaderHtml = isFirstPageOfBlock ? `
                <div class="block-header">
                    <span class="block-label">${block.label}</span>
                    <h2>${block.title}</h2>
                    <div class="block-meta">
                        <span class="block-days">${block.days}</span>
                        <span class="block-divider">|</span>
                        <span class="block-price">$${(block.price || 0).toLocaleString()}</span>
                    </div>
                    <p class="block-description">${block.description || ''}</p>
                    ${isMultiBlock && blockIdx === 0 ? '<p class="block-note">Individual blocks can be taken separately. The full program provides the best value.</p>' : ''}
                </div>
            ` : `<h2>${block.title} (Continued)</h2>`;

            pagesHtml += `
    <div class="page curriculum-page">
        ${blockHeaderHtml}
        <div class="curriculum-content">
            ${pageGroups.map(g => generateGroupHtml(g)).join('\n')}
        </div>
        ${generatePageFooter(pageNum)}
    </div>
`;
            pageCount++;
        });
    });

    return { html: pagesHtml, count: pageCount };
}

function generateFacultyCardHtml(member) {
    const initials = member.name.split(' ')
        .map(n => n[0])
        .filter(c => c && c.match(/[A-Z]/))
        .slice(0, 2)
        .join('');

    const photoHtml = member.imageUrl
        ? `<img class="faculty-photo" src="${member.imageUrl}" alt="${member.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="faculty-photo-placeholder" style="display:none;">${initials}</div>`
        : `<div class="faculty-photo-placeholder">${initials}</div>`;

    const titleParts = [];
    if (member.title) titleParts.push(member.title);
    if (member.organization) titleParts.push(member.organization);
    const titleText = titleParts.join(', ');

    const bioHtml = member.bio && member.bio.trim().length > 0
        ? `<p class="faculty-bio">${member.bio}</p>`
        : '';

    return `
        <div class="faculty-card">
            <div class="faculty-card-header">
                ${photoHtml}
                <div class="faculty-info">
                    <h4>${member.name}</h4>
                    <p class="faculty-title">${titleText}</p>
                </div>
            </div>
            ${bioHtml}
        </div>
    `;
}

function generateFacultyPages(faculty, startPageNum) {
    if (!faculty || faculty.length === 0) {
        return { html: '', count: 0 };
    }

    // Sort by those with bios first
    const sortedFaculty = [...faculty].sort((a, b) => {
        const aBio = a.bio && a.bio.trim().length > 0 ? 1 : 0;
        const bBio = b.bio && b.bio.trim().length > 0 ? 1 : 0;
        return bBio - aBio;
    });

    const pages = paginateItems(sortedFaculty, ITEMS_PER_PAGE.faculty);
    let pagesHtml = '';

    pages.forEach((members, idx) => {
        const pageNum = startPageNum + idx;
        const pageTitle = idx === 0 ? 'Your Expert Instructors' : 'Faculty (Continued)';
        const introHtml = idx === 0
            ? '<p>Learn from practicing attorneys and industry experts who bring real-world experience to every session.</p>'
            : '';

        pagesHtml += `
    <div class="page faculty-page">
        <h2>${pageTitle}</h2>
        ${introHtml}
        <div class="faculty-grid">
            ${members.map(m => generateFacultyCardHtml(m)).join('\n')}
        </div>
        ${generatePageFooter(pageNum)}
    </div>
`;
    });

    return { html: pagesHtml, count: pages.length };
}

function generateTestimonialsPage(testimonials, pageNum) {
    if (!testimonials || testimonials.length === 0) {
        return { html: '', count: 0 };
    }

    // Select top 8 strongest testimonials
    const topTestimonials = selectStrongestTestimonials(testimonials, 8);

    const testimonialsHtml = topTestimonials.map(t => `
        <div class="testimonial-card">
            <p class="testimonial-quote">"${t.quote}"</p>
            <div class="testimonial-author">
                <span class="testimonial-name">${t.author || t.name}</span>
                <span class="testimonial-role">${t.title}, ${t.company}</span>
            </div>
        </div>
    `).join('\n');

    return {
        html: `
    <div class="page testimonials-page">
        <h2>What Participants Say</h2>
        <div class="testimonials-grid">
            ${testimonialsHtml}
        </div>
        ${generatePageFooter(pageNum)}
    </div>
`,
        count: 1
    };
}

async function generateUpcomingSessionsPage(sessions, pageNum) {
    if (!sessions || sessions.length === 0) {
        return { html: '', count: 0 };
    }

    // Optimize session images (these are often very large)
    console.log('Optimizing session images...');
    const sessionsHtml = await Promise.all(sessions.map(async session => {
        const fields = session.fields;
        const startDate = new Date(fields['Start Date']);
        const endDate = new Date(fields['End Date']);
        let imageUrl = fields['Hero Image URL'];
        const venueName = fields['Venue Name (from Venue)']?.[0] || '';

        // Optimize the session image (max 400px wide for brochure)
        if (imageUrl) {
            imageUrl = await optimizeImageUrl(imageUrl, 400, 75);
        }

        return `
            <div class="session-card-horizontal">
                ${imageUrl ? `<img class="session-image-horizontal" src="${imageUrl}" alt="${fields.City}" />` : '<div class="session-image-placeholder-horizontal"></div>'}
                <div class="session-details-horizontal">
                    <div class="session-date-large">${formatDateRange(startDate, endDate)}</div>
                    <div class="session-location-large">${fields.City}, ${fields['State/Province']}</div>
                    ${venueName ? `<div class="session-venue">${venueName}</div>` : ''}
                    <div class="session-format-badge">${fields.Format}</div>
                </div>
            </div>
        `;
    }));

    return {
        html: `
    <div class="page sessions-page">
        <h2>Upcoming Sessions</h2>
        <p>Choose the location and format that works best for your schedule.</p>
        <div class="sessions-list-vertical">
            ${sessionsHtml.join('\n')}
        </div>
        <p class="sessions-note">Visit <strong>iaml.com</strong> for all sessions and registration.</p>
        ${generatePageFooter(pageNum)}
    </div>
`,
        count: 1
    };
}

function generateDetailsPage(programData, pageNum) {
    const program = programData.program || programData;
    const hero = programData.hero || {};
    const benefits = programData.benefits || {};

    const price = hero.price || program.price || 0;
    const deliveryOptions = hero.deliveryOptions || program.deliveryOptions || [];
    const credits = (benefits.credits || benefits.creditCount || '13').toString().match(/[\d.]+/)?.[0] || '13';
    const updatePeriod = benefits.updatePeriod || '12 months';
    const alumniDiscount = benefits.alumniDiscount || 'Up to $500';

    return `
    <div class="page details-page">
        <h2>Program Details</h2>
        <div class="details-grid">
            <div class="detail-card">
                <h3>Investment</h3>
                <p class="price-highlight">$${price.toLocaleString()}</p>
                <p class="text-small mt-1">Includes all instruction, materials, and continuing education credits</p>
            </div>
            <div class="detail-card">
                <h3>Professional Credits</h3>
                <p><span class="credits-badge">${credits}</span></p>
                <p class="text-small mt-1">SHRM, HRCI, and CLE credits included</p>
            </div>
            <div class="detail-card">
                <h3>Delivery Options</h3>
                <ul>
                    ${deliveryOptions.map(opt => `<li>${opt === 'Virtual' ? 'Live Virtual' : opt} sessions available</li>`).join('\n')}
                </ul>
            </div>
            <div class="detail-card">
                <h3>What's Included</h3>
                <ul>
                    <li>Live instruction from practicing attorneys</li>
                    <li>Complete program materials</li>
                    <li>${updatePeriod} of quarterly updates</li>
                    <li>${alumniDiscount} alumni discount on future programs</li>
                </ul>
            </div>
        </div>
        ${generatePageFooter(pageNum)}
    </div>
`;
}

function generateFaqPages(faq, startPageNum) {
    if (!faq || faq.length === 0) {
        return { html: '', count: 0 };
    }

    const pages = paginateItems(faq, ITEMS_PER_PAGE.faqs);
    let pagesHtml = '';

    pages.forEach((items, idx) => {
        const pageNum = startPageNum + idx;
        const pageTitle = idx === 0 ? 'Frequently Asked Questions' : 'FAQs (Continued)';

        const faqHtml = items.map(item => `
            <div class="faq-item">
                <p class="faq-question">${item.question}</p>
                <p class="faq-answer">${item.answer}</p>
            </div>
        `).join('\n');

        pagesHtml += `
    <div class="page details-page">
        <h2>${pageTitle}</h2>
        <div class="faq-section">
            ${faqHtml}
        </div>
        ${generatePageFooter(pageNum)}
    </div>
`;
    });

    return { html: pagesHtml, count: pages.length };
}

function generateCtaPage(programData, pageNum) {
    const program = programData.program || programData;
    const programName = program.name || programData.programName || 'this program';
    const programSlug = program.slug || programData.slug || 'programs';

    const registrationUrl = `https://iaml.com/programs/${programSlug}.html`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registrationUrl)}`;

    return `
    <div class="page cta-page">
        <h2>Take the Next Step</h2>
        <div class="cta-content">
            <p>Join HR professionals and employment attorneys who have mastered ${programName}. Build the legal foundation that protects your organization and advances your career.</p>
        </div>
        <div class="qr-section">
            <img class="qr-code" src="${qrCodeUrl}" alt="Scan to Register" />
            <p class="qr-label">Scan to Register</p>
        </div>
        <div class="cta-button">Reserve Your Spot</div>
        <p class="cta-url">Visit <strong>iaml.com</strong> to view upcoming sessions and register</p>
        <div class="contact-info">
            <p><strong>Questions?</strong></p>
            <p>Email: info@iaml.com | Phone: (949) 760-1700</p>
        </div>
        ${generatePageFooter(pageNum, true)}
    </div>
`;
}

// ============================================
// MAIN BUILD FUNCTION
// ============================================

async function buildBrochureHtml(programData, facultyData, sessions) {
    const program = programData.program || programData;
    const programName = program.name || programData.programName || 'Program';
    const css = loadCss();

    let pageNum = 1;
    let html = getHtmlHead(programName, css);

    // Page 1: Cover
    html += generateCoverPage(programData);
    pageNum++;

    // Page 2: Overview with benefits and consultation
    html += generateOverviewPage(programData, pageNum);
    pageNum++;

    // Curriculum pages (one or more per block)
    const curriculum = programData.curriculum || {};
    const curriculumResult = generateCurriculumBlockPages(curriculum, pageNum);
    html += curriculumResult.html;
    pageNum += curriculumResult.count;

    // Faculty pages
    const faculty = facultyData.faculty || [];
    const facultyResult = generateFacultyPages(faculty, pageNum);
    html += facultyResult.html;
    pageNum += facultyResult.count;

    // Testimonials (1 page, top 8)
    const testimonials = programData.testimonials || [];
    const testimonialResult = generateTestimonialsPage(testimonials, pageNum);
    html += testimonialResult.html;
    pageNum += testimonialResult.count;

    // Upcoming sessions (async - optimizes images)
    const sessionsResult = await generateUpcomingSessionsPage(sessions, pageNum);
    html += sessionsResult.html;
    pageNum += sessionsResult.count;

    // Details page
    html += generateDetailsPage(programData, pageNum);
    pageNum++;

    // FAQ pages
    const faq = programData.faq || [];
    const faqResult = generateFaqPages(faq, pageNum);
    html += faqResult.html;
    pageNum += faqResult.count;

    // CTA page
    html += generateCtaPage(programData, pageNum);

    html += getHtmlFoot();

    console.log(`Total pages: ${pageNum}`);
    return html;
}

// ============================================
// PDF GENERATION
// ============================================

async function generatePdf(html, outputPath) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport to standard Letter size at 96 DPI
        await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 1 });

        // Emulate print media for optimized rendering
        await page.emulateMediaType('print');

        await page.setContent(html, {
            waitUntil: ['networkidle0', 'domcontentloaded']
        });

        // Wait for fonts and images to load
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

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

async function generateBrochure(slug) {
    console.log(`\nGenerating brochure for: ${slug}`);

    try {
        const programData = loadProgramData(slug);
        const facultyData = loadFacultyData(slug);

        const program = programData.program || programData;
        const programName = program.name || programData.programName || slug;
        const sessions = loadUpcomingSessions(programName);

        console.log(`Found ${sessions.length} upcoming sessions`);

        const html = await buildBrochureHtml(programData, facultyData, sessions);

        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // Save editable HTML file
        const htmlOutputPath = path.join(CONFIG.outputDir, `${slug}-brochure.html`);
        fs.writeFileSync(htmlOutputPath, html, 'utf-8');
        console.log(`Saved editable HTML: ${htmlOutputPath}`);

        // Generate PDF
        const outputPath = path.join(CONFIG.outputDir, `${slug}-brochure.pdf`);
        await generatePdf(html, outputPath);

        return outputPath;
    } catch (error) {
        console.error(`Error generating brochure for ${slug}:`, error.message);
        throw error;
    }
}

async function convertHtmlToPdf(htmlPath) {
    console.log(`\nConverting HTML to PDF: ${htmlPath}`);

    if (!fs.existsSync(htmlPath)) {
        throw new Error(`HTML file not found: ${htmlPath}`);
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const outputPath = htmlPath.replace('.html', '.pdf');

    await generatePdf(html, outputPath);
    return outputPath;
}

function getAllProgramSlugs() {
    const files = fs.readdirSync(CONFIG.programsDir);
    return files
        .filter(f => f.endsWith('.json') && !f.startsWith('_'))
        .map(f => f.replace('.json', ''));
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  node generate-brochure-pdf.js [program-slug]');
        console.log('  node generate-brochure-pdf.js --all');
        console.log('  node generate-brochure-pdf.js --list');
        console.log('  node generate-brochure-pdf.js --html-to-pdf [path-to-html]');
        process.exit(1);
    }

    if (args[0] === '--list') {
        const slugs = getAllProgramSlugs();
        console.log('Available programs:');
        slugs.forEach(s => console.log(`  - ${s}`));
        process.exit(0);
    }

    if (args[0] === '--html-to-pdf') {
        if (!args[1]) {
            console.error('Error: Please provide path to HTML file');
            console.log('Usage: node generate-brochure-pdf.js --html-to-pdf [path-to-html]');
            process.exit(1);
        }
        await convertHtmlToPdf(args[1]);
        console.log('\nDone!');
        return;
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

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    generateBrochure,
    convertHtmlToPdf,
    loadProgramData,
    loadFacultyData,
    buildBrochureHtml,
    getAllProgramSlugs
};
