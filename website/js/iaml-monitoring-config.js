// IAML Monitoring Configuration
// PostHog project API keys are public browser keys, not secrets.
// Set POSTHOG_PUBLIC_KEY when ready to turn on live capture.
window.IAML_MONITORING_CONFIG = window.IAML_MONITORING_CONFIG || {
  POSTHOG_PUBLIC_KEY: 'phc_ww9CPtZPGoT8kQUGCLXLtQsPC2goeES2AH2kpgnwDj5m',
  POSTHOG_API_HOST: 'https://us.i.posthog.com',
  ENVIRONMENT: 'production',
  ENABLED_HOSTS: ['iaml.com', 'www.iaml.com', '100.109.42.40'],
  PREVIEW_HOSTS: ['100.109.42.40'],
  DEBUG: false
};
