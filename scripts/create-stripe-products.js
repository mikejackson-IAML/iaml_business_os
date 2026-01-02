/**
 * Create Stripe Products and Prices for IAML Programs
 *
 * Usage: STRIPE_SECRET_KEY=sk_xxx node scripts/create-stripe-products.js
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const products = [
  // Certificate Programs (Full)
  {
    name: 'Certificate in Employee Relations Law',
    description: 'Complete 3-block certificate program covering labor relations, discrimination prevention, and special employment law issues.',
    price: 2375,
    metadata: {
      type: 'certificate',
      program_code: 'ER',
      blocks: '3',
      includes_blocks: 'Comprehensive Labor Relations,Discrimination Prevention & Defense,Special Issues in Employment Law'
    }
  },
  {
    name: 'Certificate in Strategic HR Leadership',
    description: 'Complete 2-block certificate program covering HR law fundamentals and strategic HR management.',
    price: 2375,
    metadata: {
      type: 'certificate',
      program_code: 'SH',
      blocks: '2',
      includes_blocks: 'HR Law Fundamentals,Strategic HR Management'
    }
  },
  {
    name: 'Certificate in Employee Benefits Law',
    description: 'Complete 3-block certificate program covering retirement plans, benefit plan claims, and welfare benefits.',
    price: 2375,
    metadata: {
      type: 'certificate',
      program_code: 'EB',
      blocks: '3',
      includes_blocks: 'Retirement Plans,Benefit Plan Claims Appeals & Litigation,Welfare Benefits Plan Issues'
    }
  },

  // Employee Relations Law Blocks
  {
    name: 'Comprehensive Labor Relations',
    description: 'Block 1 of Certificate in Employee Relations Law. Also available as a standalone program.',
    price: 1375,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Employee Relations Law',
      program_code: 'ER',
      block_num: '1',
      standalone_eligible: 'true'
    }
  },
  {
    name: 'Discrimination Prevention & Defense',
    description: 'Block 2 of Certificate in Employee Relations Law. Also available as a standalone program.',
    price: 1375,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Employee Relations Law',
      program_code: 'ER',
      block_num: '2',
      standalone_eligible: 'true'
    }
  },
  {
    name: 'Special Issues in Employment Law',
    description: 'Block 3 of Certificate in Employee Relations Law. Also available as a standalone program.',
    price: 575,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Employee Relations Law',
      program_code: 'ER',
      block_num: '3',
      standalone_eligible: 'true'
    }
  },

  // Strategic HR Leadership Blocks
  {
    name: 'HR Law Fundamentals',
    description: 'Block 1 of Certificate in Strategic HR Leadership. Also available as a standalone program.',
    price: 1375,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Strategic HR Leadership',
      program_code: 'SH',
      block_num: '1',
      standalone_eligible: 'true'
    }
  },
  {
    name: 'Strategic HR Management',
    description: 'Block 2 of Certificate in Strategic HR Leadership. Also available as a standalone program.',
    price: 1775,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Strategic HR Leadership',
      program_code: 'SH',
      block_num: '2',
      standalone_eligible: 'true'
    }
  },

  // Employee Benefits Law Blocks
  {
    name: 'Retirement Plans',
    description: 'Block 1 of Certificate in Employee Benefits Law. Also available as a standalone program.',
    price: 1375,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Employee Benefits Law',
      program_code: 'EB',
      block_num: '1',
      standalone_eligible: 'true'
    }
  },
  {
    name: 'Benefit Plan Claims, Appeals & Litigation',
    description: 'Block 2 of Certificate in Employee Benefits Law. Also available as a standalone program.',
    price: 575,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Employee Benefits Law',
      program_code: 'EB',
      block_num: '2',
      standalone_eligible: 'true'
    }
  },
  {
    name: 'Welfare Benefits Plan Issues',
    description: 'Block 3 of Certificate in Employee Benefits Law. Also available as a standalone program.',
    price: 975,
    metadata: {
      type: 'block',
      block_of: 'Certificate in Employee Benefits Law',
      program_code: 'EB',
      block_num: '3',
      standalone_eligible: 'true'
    }
  },

  // Advanced Certificates (No Blocks)
  {
    name: 'Advanced Certificate in Strategic Employment Law',
    description: 'Advanced certificate program for experienced HR and legal professionals.',
    price: 1575,
    metadata: {
      type: 'advanced_certificate',
      program_code: 'SE',
      blocks: '0'
    }
  },
  {
    name: 'Certificate in Workplace Investigations',
    description: 'Comprehensive training in conducting effective workplace investigations.',
    price: 1575,
    metadata: {
      type: 'certificate',
      program_code: 'WI',
      blocks: '0'
    }
  },
  {
    name: 'Advanced Certificate in Employee Benefits Law',
    description: 'Advanced certificate program for benefits law professionals.',
    price: 1575,
    metadata: {
      type: 'advanced_certificate',
      program_code: 'AB',
      blocks: '0'
    }
  },

  // Standalone Programs
  {
    name: 'Quarterly Employment Law Update',
    description: 'Stay current with the latest employment law developments and trends.',
    price: 397,
    metadata: {
      type: 'standalone',
      program_code: 'QELU',
      blocks: '0'
    }
  }
];

async function createProducts() {
  console.log('Creating Stripe Products and Prices for IAML...\n');

  const results = [];

  for (const productData of products) {
    try {
      // Create the product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata
      });

      console.log(`✓ Created product: ${product.name} (${product.id})`);

      // Create the price for this product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          product_name: productData.name,
          ...productData.metadata
        }
      });

      console.log(`  └─ Price: $${productData.price} (${price.id})\n`);

      results.push({
        name: productData.name,
        productId: product.id,
        priceId: price.id,
        price: productData.price,
        metadata: productData.metadata
      });

    } catch (error) {
      console.error(`✗ Error creating ${productData.name}:`, error.message);
    }
  }

  // Output summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY - Product and Price IDs for env-config.js');
  console.log('='.repeat(80) + '\n');

  console.log('const STRIPE_PRODUCTS = {');
  for (const result of results) {
    const key = result.metadata.program_code + (result.metadata.block_num ? `_BLOCK_${result.metadata.block_num}` : '');
    console.log(`  '${key}': {`);
    console.log(`    name: '${result.name}',`);
    console.log(`    productId: '${result.productId}',`);
    console.log(`    priceId: '${result.priceId}',`);
    console.log(`    price: ${result.price}`);
    console.log(`  },`);
  }
  console.log('};');

  // Also output as JSON for easy copying
  console.log('\n\nJSON format:');
  console.log(JSON.stringify(results, null, 2));
}

createProducts().catch(console.error);
