import { Suspense } from 'react';
import { DigitalSkeleton } from './digital-skeleton';
import { DigitalContent } from './digital-content';
import {
  getDigitalMetrics,
  getRegistrationTests,
  getIntegrationStatuses,
  getSecurityMetrics,
  generateDigitalAlerts,
} from '@/lib/api/digital-queries';
import { getWorkflowDashboardData } from '@/lib/api/workflow-queries';

export const metadata = {
  title: 'Digital Dashboard | IAML Business OS',
  description: 'Site performance, registration flows, database health, and security metrics',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function DigitalDataLoader() {
  // Fetch all data in parallel
  const [metrics, registrationTests, integrations, workflowData] = await Promise.all([
    getDigitalMetrics(),
    getRegistrationTests(),
    getIntegrationStatuses(),
    getWorkflowDashboardData(),
  ]);

  // Derive security metrics from fetched data
  const security = await getSecurityMetrics(metrics.github, metrics.sentry);

  // Generate alerts based on all metrics
  const alerts = generateDigitalAlerts(
    metrics.siteStatus,
    metrics.coreWebVitals,
    metrics.database,
    security,
    registrationTests,
    metrics.development
  );

  return (
    <DigitalContent
      siteStatus={metrics.siteStatus}
      coreWebVitals={metrics.coreWebVitals}
      registrationTests={registrationTests}
      integrations={integrations}
      database={metrics.database}
      security={security}
      development={metrics.development}
      alerts={alerts}
      workflowData={workflowData}
    />
  );
}

export default function DigitalDashboardPage() {
  return (
    <Suspense fallback={<DigitalSkeleton />}>
      <DigitalDataLoader />
    </Suspense>
  );
}
