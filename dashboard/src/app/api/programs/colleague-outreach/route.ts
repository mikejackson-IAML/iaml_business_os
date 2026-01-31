import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { triggerWorkflow } from '@/lib/api/workflow-triggers';

const WORKFLOW_ID = 'colleague-outreach'; // ID in workflow_registry

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, companyName, registrantName, programName } = body;

    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Email and company name required' },
        { status: 400 }
      );
    }

    // Get webhook URL from workflow_registry
    const supabase = getServerClient();
    const { data: workflow, error: workflowError } = await supabase
      .from('workflow_registry')
      .select('webhook_url')
      .eq('workflow_id', WORKFLOW_ID)
      .single();

    if (workflowError || !workflow?.webhook_url) {
      return NextResponse.json(
        { error: 'Colleague outreach workflow not configured' },
        { status: 404 }
      );
    }

    // Trigger the workflow
    const result = await triggerWorkflow(WORKFLOW_ID, workflow.webhook_url, {
      email,
      companyName,
      registrantName,
      programName,
      triggeredAt: new Date().toISOString(),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    // Log the trigger (optional: could store in a tracking table)
    console.log(`Colleague outreach triggered for ${email} at ${companyName}`);

    return NextResponse.json({
      success: true,
      message: 'Colleague outreach workflow triggered',
      executionId: result.executionId,
    });
  } catch (error) {
    console.error('Colleague outreach error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    );
  }
}
