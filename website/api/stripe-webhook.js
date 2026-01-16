/**
 * Stripe Webhook Handler
 * Handles async events from Stripe (payments, refunds, disputes, etc.)
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret (whsec_xxx)
 * - AIRTABLE_BASE_ID: Airtable base ID
 * - AIRTABLE_REGISTRATION_API_KEY: Airtable API key for registrations
 */

export const config = {
  api: {
    bodyParser: false // Required for webhook signature verification
  }
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(buf.toString());
      console.warn('Webhook signature verification skipped (no secret configured)');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

// Handler functions for each event type

async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);

  // Extract customer info
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const metadata = session.metadata || {};

  // If registration wasn't created on success page, create it here
  if (metadata.sessionId && customerEmail) {
    try {
      // Create registration in Airtable
      await createRegistrationFromWebhook({
        email: customerEmail,
        name: customerName,
        phone: session.customer_details?.phone,
        programSessionId: metadata.sessionId,
        program: metadata.program,
        amount: session.amount_total / 100,
        paymentIntentId: session.payment_intent,
        registrationCode: metadata.registrationCode,
        company: metadata.company
      });

      console.log('Registration created from webhook');
    } catch (error) {
      console.error('Failed to create registration from webhook:', error);
    }
  }

  // Send to GoHighLevel if configured
  await notifyGHL('checkout_completed', {
    email: customerEmail,
    name: customerName,
    program: metadata.program,
    amount: session.amount_total / 100
  });
}

async function handleCheckoutSessionExpired(session) {
  console.log('Checkout session expired:', session.id);

  // Could trigger abandoned cart email via GHL
  const metadata = session.metadata || {};
  if (session.customer_details?.email) {
    await notifyGHL('checkout_expired', {
      email: session.customer_details.email,
      program: metadata.program
    });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Most handling done via checkout.session.completed
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const metadata = paymentIntent.metadata || {};

  // Notify about failed payment
  await notifyGHL('payment_failed', {
    email: paymentIntent.receipt_email,
    program: metadata.program,
    error: paymentIntent.last_payment_error?.message
  });
}

async function handleInvoicePaid(invoice) {
  console.log('Invoice paid:', invoice.id);

  // Update registration status if exists
  const metadata = invoice.metadata || {};
  if (metadata.registrationId) {
    await updateRegistrationStatus(metadata.registrationId, 'Paid');
  }

  await notifyGHL('invoice_paid', {
    email: invoice.customer_email,
    invoiceId: invoice.id,
    amount: invoice.amount_paid / 100
  });
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);

  await notifyGHL('invoice_failed', {
    email: invoice.customer_email,
    invoiceId: invoice.id
  });
}

async function handleChargeRefunded(charge) {
  console.log('Charge refunded:', charge.id);

  // Update registration status
  const metadata = charge.metadata || {};
  if (metadata.registrationId) {
    await updateRegistrationStatus(metadata.registrationId, 'Refunded');
  }

  await notifyGHL('refund_processed', {
    email: charge.receipt_email,
    amount: charge.amount_refunded / 100
  });
}

async function handleDisputeCreated(dispute) {
  console.log('Dispute created:', dispute.id);

  await notifyGHL('dispute_created', {
    chargeId: dispute.charge,
    reason: dispute.reason,
    amount: dispute.amount / 100
  });
}

// Helper functions

async function createRegistrationFromWebhook(data) {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_REGISTRATION_API_KEY;

  if (!baseId || !apiKey) {
    console.error('Airtable credentials not configured for webhook');
    return;
  }

  // Find or create contact
  const contactId = await findOrCreateContactWebhook(data.email, data.name, data.phone);
  if (!contactId) return;

  // Find or create company
  let companyId = null;
  if (data.company) {
    companyId = await findOrCreateCompanyWebhook(data.company);
  }

  // Create registration
  const registrationsTableId = 'tblhp9Llw7zSRqRnt';
  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${registrationsTableId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'Contact': [contactId],
          'Company': companyId ? [companyId] : [],
          'Program Instance': data.programSessionId ? [data.programSessionId] : [],
          'Registration Date': new Date().toISOString(),
          'Registration Source': 'Stripe Webhook',
          'Final Price': data.amount,
          'Payment Status': 'Paid',
          'Payment Method': 'Credit Card',
          'Registration Status': 'Confirmed',
          'Stripe Payment Intent': data.paymentIntentId
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create registration:', error);
  }
}

async function findOrCreateContactWebhook(email, name, phone) {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_REGISTRATION_API_KEY;
  const contactsTableId = 'tblrnWUWDTYe2XOUt';

  // Search for existing contact
  const filter = encodeURIComponent(`{Email}='${email}'`);
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${baseId}/${contactsTableId}?filterByFormula=${filter}`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    }
  );

  const searchData = await searchResponse.json();
  if (searchData.records?.length > 0) {
    return searchData.records[0].id;
  }

  // Create new contact
  const nameParts = (name || '').split(' ');
  const createResponse = await fetch(
    `https://api.airtable.com/v0/${baseId}/${contactsTableId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'First Name': nameParts[0] || '',
          'Last Name': nameParts.slice(1).join(' ') || '',
          'Email': email,
          'Phone': phone || ''
        }
      })
    }
  );

  const createData = await createResponse.json();
  return createData.id;
}

async function findOrCreateCompanyWebhook(companyName) {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_REGISTRATION_API_KEY;
  const companiesTableId = 'tbl90HikZUp0GEkKZ';

  // Search for existing company
  const filter = encodeURIComponent(`LOWER({Company Name})=LOWER('${companyName}')`);
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${baseId}/${companiesTableId}?filterByFormula=${filter}`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    }
  );

  const searchData = await searchResponse.json();
  if (searchData.records?.length > 0) {
    return searchData.records[0].id;
  }

  // Create new company
  const createResponse = await fetch(
    `https://api.airtable.com/v0/${baseId}/${companiesTableId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { 'Company Name': companyName }
      })
    }
  );

  const createData = await createResponse.json();
  return createData.id;
}

async function updateRegistrationStatus(registrationId, status) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not configured for webhook');
    return;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${registrationId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          payment_status: status
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to update registration status in Supabase:', error);
    } else {
      console.log(`Registration ${registrationId} status updated to ${status}`);
    }
  } catch (error) {
    console.error('Error updating registration status:', error);
  }
}

async function notifyGHL(eventType, data) {
  // Get webhook URL from environment or skip
  const webhookUrl = process.env.GHL_STRIPE_WEBHOOK;
  if (!webhookUrl) {
    console.log(`GHL notification skipped (no webhook configured): ${eventType}`);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        ...data
      })
    });
  } catch (error) {
    console.error('Failed to notify GHL:', error);
  }
}
