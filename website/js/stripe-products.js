/**
 * Stripe Product and Price IDs for IAML Programs
 * Generated: 2026-01-16 (LIVE MODE)
 *
 * These IDs are used for Checkout Sessions, Payment Links, and Invoices.
 * All prices are in USD.
 */

window.STRIPE_PRODUCTS = {
  // Certificate Programs (Full)
  'ER': {
    name: 'Certificate in Employee Relations Law',
    productId: 'prod_TicDicbTZg1zFK',
    priceId: 'price_1SlAywLD9MaHSRjsCBYiiVXU',
    price: 2375,
    type: 'certificate',
    blocks: 3
  },
  'SH': {
    name: 'Certificate in Strategic HR Leadership',
    productId: 'prod_TicD6kbgesBPFY',
    priceId: 'price_1SlAywLD9MaHSRjsg2S1UZHs',
    price: 2375,
    type: 'certificate',
    blocks: 2
  },
  'EB': {
    name: 'Certificate in Employee Benefits Law',
    productId: 'prod_TicDGR0w8STBkb',
    priceId: 'price_1SlAyxLD9MaHSRjsACFZeAAv',
    price: 2375,
    type: 'certificate',
    blocks: 3
  },

  // Employee Relations Law Blocks
  'ER_BLOCK_1': {
    name: 'Comprehensive Labor Relations',
    productId: 'prod_TicDzSpqfISsd3',
    priceId: 'price_1SlAyxLD9MaHSRjsgwJ1CNld',
    price: 1375,
    type: 'block',
    blockOf: 'ER',
    blockNum: 1
  },
  'ER_BLOCK_2': {
    name: 'Discrimination Prevention & Defense',
    productId: 'prod_TicDjtBkZX8kfg',
    priceId: 'price_1SlAyyLD9MaHSRjs1y2e0As0',
    price: 1375,
    type: 'block',
    blockOf: 'ER',
    blockNum: 2
  },
  'ER_BLOCK_3': {
    name: 'Special Issues in Employment Law',
    productId: 'prod_TicDHSceQjlztK',
    priceId: 'price_1SlAyyLD9MaHSRjst7SDuMmA',
    price: 575,
    type: 'block',
    blockOf: 'ER',
    blockNum: 3
  },

  // Strategic HR Leadership Blocks
  'SH_BLOCK_1': {
    name: 'HR Law Fundamentals',
    productId: 'prod_TicDniKqANHO0Y',
    priceId: 'price_1SlAyzLD9MaHSRjszH4laoWd',
    price: 1375,
    type: 'block',
    blockOf: 'SH',
    blockNum: 1
  },
  'SH_BLOCK_2': {
    name: 'Strategic HR Management',
    productId: 'prod_TicDVZ6OukHYY9',
    priceId: 'price_1SlAyzLD9MaHSRjstPQ8UNi4',
    price: 1775,
    type: 'block',
    blockOf: 'SH',
    blockNum: 2
  },

  // Employee Benefits Law Blocks
  'EB_BLOCK_1': {
    name: 'Retirement Plans',
    productId: 'prod_TicDwVLTRUqyPR',
    priceId: 'price_1SlAz0LD9MaHSRjsDjnAFmEq',
    price: 1375,
    type: 'block',
    blockOf: 'EB',
    blockNum: 1
  },
  'EB_BLOCK_2': {
    name: 'Benefit Plan Claims, Appeals & Litigation',
    productId: 'prod_TicDcZkzU2pOEd',
    priceId: 'price_1SlAz0LD9MaHSRjs54pUnUNq',
    price: 575,
    type: 'block',
    blockOf: 'EB',
    blockNum: 2
  },
  'EB_BLOCK_3': {
    name: 'Welfare Benefits Plan Issues',
    productId: 'prod_TicDivrViW5tEa',
    priceId: 'price_1SlAz1LD9MaHSRjsur88v8JQ',
    price: 975,
    type: 'block',
    blockOf: 'EB',
    blockNum: 3
  },

  // Advanced Certificates (No Blocks)
  'SE': {
    name: 'Advanced Certificate in Strategic Employment Law',
    productId: 'prod_TicDGW2ltCW5VM',
    priceId: 'price_1SlAz1LD9MaHSRjstppbhHaH',
    price: 1575,
    type: 'advanced_certificate'
  },
  'WI': {
    name: 'Certificate in Workplace Investigations',
    productId: 'prod_TicDf9Xmlq5ezg',
    priceId: 'price_1SlAz2LD9MaHSRjs9sIiDw03',
    price: 1575,
    type: 'certificate'
  },
  'AB': {
    name: 'Advanced Certificate in Employee Benefits Law',
    productId: 'prod_TicDg3KlCBXuR5',
    priceId: 'price_1SlAz2LD9MaHSRjsBSsbWwF1',
    price: 1575,
    type: 'advanced_certificate'
  },

  // Standalone Programs
  'QELU': {
    name: 'Quarterly Employment Law Update',
    productId: 'prod_TicDNl62knkpR6',
    priceId: 'price_1SlAz3LD9MaHSRjs7THNy2H4',
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
