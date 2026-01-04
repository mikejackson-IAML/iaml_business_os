/**
 * Stripe Product and Price IDs for IAML Programs
 * Generated: 2026-01-02 (TEST MODE)
 *
 * These IDs are used for Checkout Sessions, Payment Links, and Invoices.
 * All prices are in USD.
 *
 * NOTE: These are TEST MODE IDs. For production, use the live mode IDs.
 */

window.STRIPE_PRODUCTS = {
  // Certificate Programs (Full)
  'ER': {
    name: 'Certificate in Employee Relations Law',
    productId: 'prod_TigBqQgrpGy3A1',
    priceId: 'price_1SlEp9Poa77sAKKyLUnV3pAv',
    price: 2375,
    type: 'certificate',
    blocks: 3
  },
  'SH': {
    name: 'Certificate in Strategic HR Leadership',
    productId: 'prod_TigBnkP5mk58ec',
    priceId: 'price_1SlEp9Poa77sAKKym3AGDKrn',
    price: 2375,
    type: 'certificate',
    blocks: 2
  },
  'EB': {
    name: 'Certificate in Employee Benefits Law',
    productId: 'prod_TigBHaKjAMlCuP',
    priceId: 'price_1SlEpAPoa77sAKKy997FKykY',
    price: 2375,
    type: 'certificate',
    blocks: 3
  },

  // Employee Relations Law Blocks
  'ER_BLOCK_1': {
    name: 'Comprehensive Labor Relations',
    productId: 'prod_TigBxcdQ2lWw7t',
    priceId: 'price_1SlEpAPoa77sAKKyc0thbWIr',
    price: 1375,
    type: 'block',
    blockOf: 'ER',
    blockNum: 1
  },
  'ER_BLOCK_2': {
    name: 'Discrimination Prevention & Defense',
    productId: 'prod_TigBfwVDvmIBKn',
    priceId: 'price_1SlEpBPoa77sAKKyKNyDfJjo',
    price: 1375,
    type: 'block',
    blockOf: 'ER',
    blockNum: 2
  },
  'ER_BLOCK_3': {
    name: 'Special Issues in Employment Law',
    productId: 'prod_TigB310ObnmLDK',
    priceId: 'price_1SlEpBPoa77sAKKynx0DvyZX',
    price: 575,
    type: 'block',
    blockOf: 'ER',
    blockNum: 3
  },

  // Strategic HR Leadership Blocks
  'SH_BLOCK_1': {
    name: 'HR Law Fundamentals',
    productId: 'prod_TigBfylFrUeGiH',
    priceId: 'price_1SlEpCPoa77sAKKyIqnjclHn',
    price: 1375,
    type: 'block',
    blockOf: 'SH',
    blockNum: 1
  },
  'SH_BLOCK_2': {
    name: 'Strategic HR Management',
    productId: 'prod_TigBH8xhChAeBe',
    priceId: 'price_1SlEpCPoa77sAKKyJnHARBDh',
    price: 1775,
    type: 'block',
    blockOf: 'SH',
    blockNum: 2
  },

  // Employee Benefits Law Blocks
  'EB_BLOCK_1': {
    name: 'Retirement Plans',
    productId: 'prod_TigB5yl5jggjSl',
    priceId: 'price_1SlEpDPoa77sAKKyRtZQjj5I',
    price: 1375,
    type: 'block',
    blockOf: 'EB',
    blockNum: 1
  },
  'EB_BLOCK_2': {
    name: 'Benefit Plan Claims, Appeals & Litigation',
    productId: 'prod_TigB7EIakKFOxl',
    priceId: 'price_1SlEpDPoa77sAKKyMXIbBDRw',
    price: 575,
    type: 'block',
    blockOf: 'EB',
    blockNum: 2
  },
  'EB_BLOCK_3': {
    name: 'Welfare Benefits Plan Issues',
    productId: 'prod_TigBVl4qXAivlL',
    priceId: 'price_1SlEpEPoa77sAKKyhirIPYNH',
    price: 975,
    type: 'block',
    blockOf: 'EB',
    blockNum: 3
  },

  // Advanced Certificates (No Blocks)
  'SE': {
    name: 'Advanced Certificate in Strategic Employment Law',
    productId: 'prod_TigBi0FndXzJAG',
    priceId: 'price_1SlEpEPoa77sAKKy8dTSBC2R',
    price: 1575,
    type: 'advanced_certificate'
  },
  'WI': {
    name: 'Certificate in Workplace Investigations',
    productId: 'prod_TigBA3k9JXmxck',
    priceId: 'price_1SlEpFPoa77sAKKyhyq1S57P',
    price: 1575,
    type: 'certificate'
  },
  'AB': {
    name: 'Advanced Certificate in Employee Benefits Law',
    productId: 'prod_TigBqfyJblg5tU',
    priceId: 'price_1SlEpFPoa77sAKKy6fWaVHlc',
    price: 1575,
    type: 'advanced_certificate'
  },

  // Standalone Programs
  'QELU': {
    name: 'Quarterly Employment Law Update',
    productId: 'prod_TigBo6rzm4x1Pe',
    priceId: 'price_1SlEpGPoa77sAKKyH6vDL58d',
    price: 397,
    type: 'standalone'
  }
};

// Helper function to get product by code
window.getStripeProduct = function(code) {
  return window.STRIPE_PRODUCTS[code] || null;
};

// Helper function to get all blocks for a certificate
window.getCertificateBlocks = function(certificateCode) {
  return Object.entries(window.STRIPE_PRODUCTS)
    .filter(([key, product]) => product.blockOf === certificateCode)
    .sort((a, b) => a[1].blockNum - b[1].blockNum)
    .map(([key, product]) => ({ code: key, ...product }));
};
