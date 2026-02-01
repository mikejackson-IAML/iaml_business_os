import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { updateLogisticsField } from '@/lib/api/programs-mutations';

const BUCKET_NAME = 'program-attachments';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Ensure storage bucket exists
 */
async function ensureBucket() {
  const supabase = getServerClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!exists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
}

/**
 * POST /api/programs/[id]/attachments
 * Upload BEO or expense receipt
 * Body: FormData with 'file' and 'type' (beo | receipt)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { id: programId } = await context.params;
  const supabase = getServerClient();

  try {
    await ensureBucket();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'beo';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique storage path
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `programs/${programId}/${type}/${timestamp}-${safeFileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // If BEO, update logistics record
    if (type === 'beo') {
      await updateLogisticsField(programId, 'beo_url', storagePath);
      await updateLogisticsField(programId, 'beo_file_name', file.name);
      await updateLogisticsField(programId, 'beo_uploaded_at', new Date().toISOString());
    }

    // Generate signed URL for immediate use (1 hour)
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      success: true,
      data: {
        storage_path: storagePath,
        file_name: file.name,
        file_type: file.type,
        signed_url: signedData?.signedUrl,
      },
    });
  } catch (error) {
    console.error('Attachment upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/programs/[id]/attachments
 * Delete a file from storage
 * Body: { storage_path: string, type: 'beo' | 'receipt' }
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id: programId } = await context.params;
  const supabase = getServerClient();

  try {
    const body = await request.json();
    const { storage_path, type } = body;

    if (!storage_path) {
      return NextResponse.json(
        { success: false, error: 'No storage path provided' },
        { status: 400 }
      );
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storage_path]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // If BEO, clear logistics fields
    if (type === 'beo') {
      await updateLogisticsField(programId, 'beo_url', null);
      await updateLogisticsField(programId, 'beo_file_name', null);
      await updateLogisticsField(programId, 'beo_status', 'draft');
      await updateLogisticsField(programId, 'beo_uploaded_at', null);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Attachment delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/programs/[id]/attachments
 * Get signed URL for a file
 * Query: ?path=storage/path
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const supabase = getServerClient();

  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json(
      { success: false, error: 'No path provided' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    signed_url: data.signedUrl,
  });
}
