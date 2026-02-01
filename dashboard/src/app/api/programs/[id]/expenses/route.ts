import { NextRequest, NextResponse } from 'next/server';
import { getProgramExpenses, EXPENSE_CATEGORIES } from '@/lib/api/programs-queries';
import { createExpense, updateExpense, deleteExpense } from '@/lib/api/programs-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/programs/[id]/expenses
 * Returns all expenses for a program
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const expenses = await getProgramExpenses(id);
    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/programs/[id]/expenses
 * Create a new expense
 * Body: { category, description, amount, expense_date?, receipt_url?, receipt_file_name?, receipt_file_type? }
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // Validate category
    if (!EXPENSE_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.description || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Description and amount are required' },
        { status: 400 }
      );
    }

    const result = await createExpense(id, {
      category: body.category,
      description: body.description,
      amount: parseFloat(body.amount),
      expense_date: body.expense_date,
      receipt_url: body.receipt_url,
      receipt_file_name: body.receipt_file_name,
      receipt_file_type: body.receipt_file_type,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/programs/[id]/expenses
 * Update an expense
 * Body: { expense_id, ...updates }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const body = await request.json();
    const { expense_id, ...updates } = body;

    if (!expense_id) {
      return NextResponse.json(
        { success: false, error: 'expense_id is required' },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (updates.category && !EXPENSE_CATEGORIES.includes(updates.category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await updateExpense(expense_id, updates);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/programs/[id]/expenses
 * Delete an expense
 * Body: { expense_id }
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const body = await request.json();
    const { expense_id } = body;

    if (!expense_id) {
      return NextResponse.json(
        { success: false, error: 'expense_id is required' },
        { status: 400 }
      );
    }

    const result = await deleteExpense(expense_id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
