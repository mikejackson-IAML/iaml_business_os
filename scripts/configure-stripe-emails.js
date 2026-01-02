/**
 * Configure Stripe Email Settings
 *
 * This script shows the current account settings and provides guidance
 * for configuring email receipts and branding.
 *
 * Usage: STRIPE_SECRET_KEY=sk_xxx node scripts/configure-stripe-emails.js
 *
 * Note: Most email settings must be configured in the Stripe Dashboard:
 * https://dashboard.stripe.com/settings/emails
 * https://dashboard.stripe.com/settings/branding
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function configureEmails() {
  console.log('Stripe Email & Branding Configuration\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Get account info
    const account = await stripe.accounts.retrieve();

    console.log('Account Information:');
    console.log(`  Business Name: ${account.business_profile?.name || 'Not set'}`);
    console.log(`  Support Email: ${account.business_profile?.support_email || 'Not set'}`);
    console.log(`  Support Phone: ${account.business_profile?.support_phone || 'Not set'}`);
    console.log(`  Support URL: ${account.business_profile?.support_url || 'Not set'}`);
    console.log(`  Country: ${account.country}`);

    console.log('\n' + '='.repeat(60));
    console.log('MANUAL CONFIGURATION REQUIRED');
    console.log('='.repeat(60) + '\n');

    console.log('Email settings must be configured in the Stripe Dashboard:\n');

    console.log('1. EMAIL RECEIPTS');
    console.log('   URL: https://dashboard.stripe.com/settings/emails');
    console.log('   Settings to configure:');
    console.log('   - Enable "Successful payments" receipts');
    console.log('   - Enable "Refund" receipts');
    console.log('   - Customize receipt email content\n');

    console.log('2. INVOICE EMAILS');
    console.log('   URL: https://dashboard.stripe.com/settings/billing/invoice');
    console.log('   Settings to configure:');
    console.log('   - Default invoice footer');
    console.log('   - Default payment terms');
    console.log('   - Reminder emails for unpaid invoices\n');

    console.log('3. BRANDING');
    console.log('   URL: https://dashboard.stripe.com/settings/branding');
    console.log('   Settings to configure:');
    console.log('   - Logo (appears on invoices, receipts, checkout)');
    console.log('   - Icon (32x32 for browser tabs)');
    console.log('   - Brand color');
    console.log('   - Accent color\n');

    console.log('4. PUBLIC BUSINESS INFORMATION');
    console.log('   URL: https://dashboard.stripe.com/settings/public');
    console.log('   Settings to configure:');
    console.log('   - Business name: "IAML" or "Institute for Applied Management & Law"');
    console.log('   - Support email: info@iaml.com');
    console.log('   - Support phone: (312) 348-4265');
    console.log('   - Support URL: https://iaml.com\n');

    console.log('5. CUSTOMER PORTAL');
    console.log('   URL: https://dashboard.stripe.com/settings/billing/portal');
    console.log('   Settings to configure:');
    console.log('   - Enable customer portal (for viewing invoices/receipts)');
    console.log('   - Allow invoice history');
    console.log('   - Allow payment method updates\n');

    console.log('='.repeat(60));
    console.log('RECOMMENDED SETTINGS FOR IAML');
    console.log('='.repeat(60) + '\n');

    console.log('Receipt Email Settings:');
    console.log('  - Subject: "Your IAML registration receipt"');
    console.log('  - From name: "IAML Registration"');
    console.log('  - Reply-to: registrations@iaml.com or info@iaml.com\n');

    console.log('Invoice Email Settings:');
    console.log('  - Footer: "Thank you for registering with IAML. Questions? Contact info@iaml.com"');
    console.log('  - Payment terms: Net 30');
    console.log('  - Send reminders: 3 days before due, 1 day after due, 7 days after due\n');

    console.log('Branding:');
    console.log('  - Logo: Upload IAML logo (recommended: 400x100px PNG)');
    console.log('  - Brand color: Use IAML primary color');
    console.log('  - Accent color: Use IAML secondary color\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

configureEmails();
