// Environment configuration for serverless functions
// This file reads from .env.local during local development
// For production on Vercel, environment variables are set in the Dashboard

module.exports = {
  airtable: {
    baseId: process.env.AIRTABLE_BASE_ID,
    programsApiKey: process.env.AIRTABLE_PROGRAMS_API_KEY,
    registrationApiKey: process.env.AIRTABLE_REGISTRATION_API_KEY,
    nextProgramApiKey: process.env.AIRTABLE_NEXT_PROGRAM_API_KEY,
    quizApiKey: process.env.AIRTABLE_QUIZ_API_KEY
  },
  ghl: {
    registrationWebhook: process.env.GHL_REGISTRATION_WEBHOOK,
    contactWebhook: process.env.GHL_CONTACT_WEBHOOK
  }
};
