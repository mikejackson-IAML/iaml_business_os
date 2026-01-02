/**
 * Set up Stripe Webhook Endpoint
 *
 * Usage: STRIPE_SECRET_KEY=sk_xxx node scripts/setup-stripe-webhook.js
 *
 * Note: You'll need to add STRIPE_WEBHOOK_SECRET to your Vercel environment
 * after running this script.
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Your production webhook URL
const WEBHOOK_URL = 'https://iaml.com/api/stripe-webhook';

// Events to listen for
const EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created'
];

async function setupWebhook() {
  console.log('Setting up Stripe Webhook...\n');

  try {
    // List existing webhooks
    const existingWebhooks = await stripe.webhookEndpoints.list();

    // Check if webhook already exists
    const existing = existingWebhooks.data.find(wh => wh.url === WEBHOOK_URL);

    if (existing) {
      console.log('Webhook already exists, updating...');

      const updated = await stripe.webhookEndpoints.update(existing.id, {
        enabled_events: EVENTS,
        description: 'IAML Registration Webhook'
      });

      console.log(`✓ Webhook updated: ${updated.id}`);
      console.log(`  URL: ${updated.url}`);
      console.log(`  Status: ${updated.status}`);
      console.log(`\n⚠️  Note: Webhook secret cannot be retrieved for existing endpoints.`);
      console.log(`  If you need a new secret, delete this webhook and run the script again.`);

    } else {
      // Create new webhook
      const webhook = await stripe.webhookEndpoints.create({
        url: WEBHOOK_URL,
        enabled_events: EVENTS,
        description: 'IAML Registration Webhook'
      });

      console.log(`✓ Webhook created: ${webhook.id}`);
      console.log(`  URL: ${webhook.url}`);
      console.log(`  Status: ${webhook.status}`);
      console.log(`\n${'='.repeat(60)}`);
      console.log('IMPORTANT: Save this webhook secret!');
      console.log('='.repeat(60));
      console.log(`\nSTRIPE_WEBHOOK_SECRET=${webhook.secret}`);
      console.log(`\nAdd this to your Vercel environment variables.`);
    }

    console.log('\n\nEnabled events:');
    EVENTS.forEach(e => console.log(`  - ${e}`));

  } catch (error) {
    console.error('Error setting up webhook:', error.message);
  }
}

setupWebhook();
