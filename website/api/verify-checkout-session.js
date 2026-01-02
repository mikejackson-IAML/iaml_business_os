/**
 * Verify Stripe Checkout Session API
 * Retrieves and verifies a completed checkout session
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key (sk_test_xxx or sk_live_xxx)
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id required' });
    }

    // Import Stripe dynamically (for serverless compatibility)
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });

    // Retrieve the session with expanded data
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'customer', 'payment_intent']
    });

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: session.payment_status
      });
    }

    // Extract customer information
    const customerDetails = session.customer_details || {};
    const billingAddress = customerDetails.address || {};

    // Build response with registration data
    const response = {
      success: true,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      paymentIntentId: session.payment_intent?.id || session.payment_intent,
      amountTotal: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      customer: {
        email: customerDetails.email,
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: {
          line1: billingAddress.line1,
          line2: billingAddress.line2,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postal_code,
          country: billingAddress.country
        }
      },
      metadata: session.metadata,
      lineItems: session.line_items?.data?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        amount: item.amount_total / 100
      })) || []
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Stripe verification error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid session' });
    }

    return res.status(500).json({ error: 'Failed to verify checkout session' });
  }
}
