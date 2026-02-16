// LinkedIn Content Engine - Network Contact CRUD API
// PATCH /api/linkedin-content/network/:id - Update contact fields
// DELETE /api/linkedin-content/network/:id - Soft-delete (deactivate) contact

import { NextRequest, NextResponse } from 'next/server';
import { updateNetworkContact, deactivateNetworkContact } from '@/lib/api/linkedin-content-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const allowedFields = ['tier', 'category', 'notes', 'linkedin_headline', 'follower_count'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Allowed: tier, category, notes, linkedin_headline, follower_count', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const updated = await updateNetworkContact(id, updates as {
      tier?: string;
      category?: string;
      notes?: string;
      linkedin_headline?: string;
      follower_count?: number;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Network PATCH API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const deactivated = await deactivateNetworkContact(id);

    return NextResponse.json(deactivated);
  } catch (error) {
    console.error('Network DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
