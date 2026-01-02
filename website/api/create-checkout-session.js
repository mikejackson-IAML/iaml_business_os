/**
 * Stripe Checkout Session API
 * Creates a Checkout Session for processing registration payments
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key (sk_test_xxx or sk_live_xxx)
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    const {
      priceId,
      lineItems,
      customerEmail,
      metadata,
      successUrl,
      cancelUrl,
      allowPromotionCodes,
      couponId
    } = req.body;

    // Validate required fields
    if (!priceId && !lineItems) {
      return res.status(400).json({ error: 'priceId or lineItems required' });
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl and cancelUrl required' });
    }

    // Import Stripe dynamically (for serverless compatibility)
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });

    // Build line items
    let sessionLineItems;
    if (lineItems && Array.isArray(lineItems)) {
      // Multiple items (e.g., multiple blocks)
      sessionLineItems = lineItems.map(item => ({
        price: item.priceId,
        quantity: item.quantity || 1
      }));
    } else {
      // Single item
      sessionLineItems = [{
        price: priceId,
        quantity: 1
      }];
    }

    // Build session configuration
    const sessionConfig = {
      mode: 'payment',
      line_items: sessionLineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      metadata: {
        ...metadata,
        source: 'iaml_registration_page'
      },
      payment_intent_data: {
        metadata: {
          ...metadata,
          source: 'iaml_registration_page'
        }
      },
      // Enable automatic tax calculation if configured in Stripe
      // automatic_tax: { enabled: true },

      // Allow customers to adjust quantity (disabled for registrations)
      // adjustable_quantity: { enabled: false },

      // Billing address collection
      billing_address_collection: 'required',

      // Phone number collection
      phone_number_collection: {
        enabled: true
      },

      // Custom text
      custom_text: {
        submit: {
          message: 'Your registration will be confirmed upon successful payment.'
        }
      }
    };

    // Handle promotion codes / coupons
    if (allowPromotionCodes) {
      sessionConfig.allow_promotion_codes = true;
    } else if (couponId) {
      sessionConfig.discounts = [{ coupon: couponId }];
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe Checkout error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
