// Lead Intelligence - Opportunity Attachments API
// GET /api/lead-intelligence/opportunities/:id/attachments - List attachments
// POST /api/lead-intelligence/opportunities/:id/attachments - Upload file
// DELETE /api/lead-intelligence/opportunities/:id/attachments - Delete attachment

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';
import { getOpportunityAttachments } from '@/lib/api/lead-intelligence-opportunities-queries';
import { createAttachment, deleteAttachment } from '@/lib/api/lead-intelligence-opportunities-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET_NAME = 'opportunity-attachments';

async function ensureBucket() {
  const supabase = getServerClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b: { name: string }) => b.name === BUCKET_NAME);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid opportunity ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const attachments = await getOpportunityAttachments(id);

    // Generate signed URLs for each attachment
    const supabase = getServerClient();
    const withSignedUrls = await Promise.all(
      attachments.map(async (att) => {
        // Extract storage path from file_url
        const path = att.file_url;
        const { data } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(path, 3600); // 1 hour

        return {
          ...att,
          signed_url: data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json(withSignedUrls);
  } catch (error) {
    console.error('Opportunity attachments list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid opportunity ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'file is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit', code: 'FILE_TOO_LARGE' },
        { status: 413 }
      );
    }

    await ensureBucket();

    const timestamp = Date.now();
    const storagePath = `opportunities/${id}/${timestamp}-${file.name}`;

    const supabase = getServerClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const attachment = await createAttachment({
      opportunity_id: id,
      file_name: file.name,
      file_url: storagePath, // Store path, generate signed URL on read
      file_type: file.type || null,
      file_size: file.size,
    });

    // Return with signed URL
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json(
      { ...attachment, signed_url: signedData?.signedUrl ?? null },
      { status: 201 }
    );
  } catch (error) {
    console.error('Opportunity attachment upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid opportunity ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;
    if (!b.attachment_id || typeof b.attachment_id !== 'string') {
      return NextResponse.json(
        { error: 'attachment_id is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Fetch attachment to get storage path before deleting
    const attachments = await getOpportunityAttachments(id);
    const attachment = attachments.find(a => a.id === b.attachment_id);

    if (attachment) {
      // Delete from storage
      const supabase = getServerClient();
      await supabase.storage.from(BUCKET_NAME).remove([attachment.file_url]);
    }

    await deleteAttachment(b.attachment_id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Opportunity attachment delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
