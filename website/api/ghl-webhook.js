// Serverless function to proxy GoHighLevel webhook submissions
// Accepts POST requests with type (registration or contact) and data payload

// Load environment variables from .env.local if not already set (for local development)
if (!process.env.GHL_REGISTRATION_WEBHOOK && process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    }
  } catch (e) {
    // Silently fail if .env.local can't be loaded
  }
}

module.exports = async function handler(req, res) {
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

  try {
    const { type, data } = req.body;

    // Validate request body
    if (!type || !data) {
      return res.status(400).json({
        error: 'Request body must include "type" and "data" fields'
      });
    }

    if (!['registration', 'contact'].includes(type)) {
      return res.status(400).json({
        error: 'type must be either "registration" or "contact"'
      });
    }

    // Select webhook URL based on type
    let webhookUrl;
    if (type === 'registration') {
      webhookUrl = process.env.GHL_REGISTRATION_WEBHOOK;
    } else if (type === 'contact') {
      webhookUrl = process.env.GHL_CONTACT_WEBHOOK;
    }

    // Validate webhook URL is configured
    if (!webhookUrl) {
      console.error(`Missing GHL webhook configuration for type: ${type}`);
      return res.status(500).json({
        error: 'Server configuration error'
      });
    }

    // Make request to GoHighLevel webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // GoHighLevel webhooks may return empty responses or various success indicators
    let responseData;
    let responseText = '';

    try {
      responseText = await response.text();
      if (responseText) {
        responseData = JSON.parse(responseText);
      } else {
        responseData = { success: true };
      }
    } catch (parseError) {
      // If response isn't JSON, assume success if status is OK
      responseData = { success: response.ok };
    }

    // Return appropriate status code
    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: responseData
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: 'GoHighLevel webhook failed',
        details: responseData,
        status: response.status
      });
    }

  } catch (error) {
    console.error('GHL webhook proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
