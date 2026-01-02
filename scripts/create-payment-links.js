/**
 * Create Stripe Payment Links for IAML Programs
 *
 * Usage: STRIPE_SECRET_KEY=sk_xxx node scripts/create-payment-links.js
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Product Price IDs from create-stripe-products.js output
const products = [
  // Certificate Programs (Full)
  {
    name: 'Certificate in Employee Relations Law',
    priceId: 'price_1SlAywLD9MaHSRjsCBYiiVXU',
    code: 'ER'
  },
  {
    name: 'Certificate in Strategic HR Leadership',
    priceId: 'price_1SlAywLD9MaHSRjsg2S1UZHs',
    code: 'SH'
  },
  {
    name: 'Certificate in Employee Benefits Law',
    priceId: 'price_1SlAyxLD9MaHSRjsACFZeAAv',
    code: 'EB'
  },

  // Employee Relations Law Blocks
  {
    name: 'Comprehensive Labor Relations',
    priceId: 'price_1SlAyxLD9MaHSRjsgwJ1CNld',
    code: 'ER_BLOCK_1'
  },
  {
    name: 'Discrimination Prevention & Defense',
    priceId: 'price_1SlAyyLD9MaHSRjs1y2e0As0',
    code: 'ER_BLOCK_2'
  },
  {
    name: 'Special Issues in Employment Law',
    priceId: 'price_1SlAyyLD9MaHSRjst7SDuMmA',
    code: 'ER_BLOCK_3'
  },

  // Strategic HR Leadership Blocks
  {
    name: 'HR Law Fundamentals',
    priceId: 'price_1SlAyzLD9MaHSRjszH4laoWd',
    code: 'SH_BLOCK_1'
  },
  {
    name: 'Strategic HR Management',
    priceId: 'price_1SlAyzLD9MaHSRjstPQ8UNi4',
    code: 'SH_BLOCK_2'
  },

  // Employee Benefits Law Blocks
  {
    name: 'Retirement Plans',
    priceId: 'price_1SlAz0LD9MaHSRjsDjnAFmEq',
    code: 'EB_BLOCK_1'
  },
  {
    name: 'Benefit Plan Claims, Appeals & Litigation',
    priceId: 'price_1SlAz0LD9MaHSRjs54pUnUNq',
    code: 'EB_BLOCK_2'
  },
  {
    name: 'Welfare Benefits Plan Issues',
    priceId: 'price_1SlAz1LD9MaHSRjsur88v8JQ',
    code: 'EB_BLOCK_3'
  },

  // Advanced Certificates
  {
    name: 'Advanced Certificate in Strategic Employment Law',
    priceId: 'price_1SlAz1LD9MaHSRjstppbhHaH',
    code: 'SE'
  },
  {
    name: 'Certificate in Workplace Investigations',
    priceId: 'price_1SlAz2LD9MaHSRjs9sIiDw03',
    code: 'WI'
  },
  {
    name: 'Advanced Certificate in Employee Benefits Law',
    priceId: 'price_1SlAz2LD9MaHSRjsBSsbWwF1',
    code: 'AB'
  },

  // Standalone Programs
  {
    name: 'Quarterly Employment Law Update',
    priceId: 'price_1SlAz3LD9MaHSRjs7THNy2H4',
    code: 'QELU'
  }
];

async function createPaymentLinks() {
  console.log('Creating Stripe Payment Links for IAML...\n');

  const results = [];

  for (const product of products) {
    try {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: product.priceId,
            quantity: 1
          }
        ],
        // Collect billing address
        billing_address_collection: 'required',
        // Collect phone number
        phone_number_collection: {
          enabled: true
        },
        // Custom success page
        after_completion: {
          type: 'redirect',
          redirect: {
            url: 'https://iaml.com/checkout-success.html?session_id={CHECKOUT_SESSION_ID}'
          }
        },
        // Metadata for tracking
        metadata: {
          program_code: product.code,
          program_name: product.name,
          source: 'payment_link'
        },
        // Custom text
        custom_text: {
          submit: {
            message: 'Your registration will be confirmed upon successful payment.'
          }
        }
      });

      console.log(`✓ Created: ${product.name}`);
      console.log(`  └─ ${paymentLink.url}\n`);

      results.push({
        name: product.name,
        code: product.code,
        priceId: product.priceId,
        paymentLinkId: paymentLink.id,
        url: paymentLink.url
      });

    } catch (error) {
      console.error(`✗ Error creating link for ${product.name}:`, error.message);
    }
  }

  // Output summary
  console.log('\n' + '='.repeat(80));
  console.log('PAYMENT LINKS SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('| Program | Payment Link |');
  console.log('|---------|--------------|');
  for (const result of results) {
    console.log(`| ${result.name} | ${result.url} |`);
  }

  // Output as JSON
  console.log('\n\nJSON format:');
  console.log(JSON.stringify(results, null, 2));

  // Output for easy copying to docs/config
  console.log('\n\nFor stripe-products.js (add paymentLink property):');
  for (const result of results) {
    console.log(`  '${result.code}': { ...existing, paymentLink: '${result.url}' },`);
  }
}

createPaymentLinks().catch(console.error);
