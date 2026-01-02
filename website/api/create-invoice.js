/**
 * Create Stripe Invoice API
 * Creates and optionally sends an invoice for registration payments
 *
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret key
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
      customerEmail,
      customerName,
      customerPhone,
      customerCompany,
      lineItems, // Array of { priceId, quantity } or { description, amount }
      metadata,
      dueDate, // Optional: days until due (default 30)
      sendInvoice, // Whether to send immediately (default true)
      memo // Optional: custom memo/notes
    } = req.body;

    // Validate required fields
    if (!customerEmail) {
      return res.status(400).json({ error: 'customerEmail required' });
    }

    if (!lineItems || !lineItems.length) {
      return res.status(400).json({ error: 'lineItems required' });
    }

    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });

    // Find or create customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];

      // Update customer info if provided
      if (customerName || customerPhone || customerCompany) {
        customer = await stripe.customers.update(customer.id, {
          name: customerName || customer.name,
          phone: customerPhone || customer.phone,
          metadata: {
            ...customer.metadata,
            company: customerCompany || customer.metadata?.company
          }
        });
      }
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        metadata: {
          company: customerCompany,
          source: 'iaml_registration'
        }
      });
    }

    // Create invoice
    const invoiceConfig = {
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: dueDate || 30,
      metadata: {
        ...metadata,
        source: 'iaml_registration_invoice'
      }
    };

    if (memo) {
      invoiceConfig.description = memo;
    }

    const invoice = await stripe.invoices.create(invoiceConfig);

    // Add line items
    for (const item of lineItems) {
      if (item.priceId) {
        // Use existing Price
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          price: item.priceId,
          quantity: item.quantity || 1
        });
      } else {
        // Create one-time line item
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoice.id,
          description: item.description,
          amount: Math.round(item.amount * 100), // Convert to cents
          currency: 'usd'
        });
      }
    }

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Send invoice if requested (default: true)
    let sentInvoice = finalizedInvoice;
    if (sendInvoice !== false) {
      sentInvoice = await stripe.invoices.sendInvoice(invoice.id);
    }

    return res.status(200).json({
      success: true,
      invoiceId: sentInvoice.id,
      invoiceNumber: sentInvoice.number,
      invoiceUrl: sentInvoice.hosted_invoice_url,
      invoicePdf: sentInvoice.invoice_pdf,
      status: sentInvoice.status,
      amountDue: sentInvoice.amount_due / 100,
      dueDate: new Date(sentInvoice.due_date * 1000).toISOString(),
      customerId: customer.id
    });

  } catch (error) {
    console.error('Invoice creation error:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to create invoice' });
  }
}
