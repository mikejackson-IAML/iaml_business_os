// Programs Mutations - Logistics Tab
// Handles updates with audit logging per CONTEXT.md requirement

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLogisticsTable() {
  return getServerClient().from('program_logistics') as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getExpensesTable() {
  return getServerClient().from('program_expenses') as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActivityLogTable() {
  return getServerClient().from('activity_log') as any;
}

/**
 * Update a single logistics field with audit logging
 */
export async function updateLogisticsField(
  programId: string,
  field: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  // Get current value for audit log
  const { data: current } = await getLogisticsTable()
    .select(field)
    .eq('program_instance_id', programId)
    .single();

  const oldValue = current?.[field as keyof typeof current];

  // Upsert the logistics record (create if not exists)
  const { error: updateError } = await getLogisticsTable()
    .upsert({
      program_instance_id: programId,
      [field]: value,
      updated_at: new Date().toISOString(),
    } as never, {
      onConflict: 'program_instance_id',
    });

  if (updateError) {
    console.error('Logistics update error:', updateError);
    return { success: false, error: updateError.message };
  }

  // Log the change (per CONTEXT.md audit requirement)
  await getActivityLogTable().insert({
    entity_type: 'program_logistics',
    entity_id: programId,
    action: 'field_updated',
    details: {
      field,
      old_value: oldValue,
      new_value: value,
      updated_at: new Date().toISOString(),
    },
  } as never);

  return { success: true };
}

/**
 * Update multiple logistics fields at once
 */
export async function updateLogisticsFields(
  programId: string,
  fields: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  // Get current values for audit log
  const fieldNames = Object.keys(fields);
  const { data: current } = await getLogisticsTable()
    .select(fieldNames.join(','))
    .eq('program_instance_id', programId)
    .single();

  // Upsert with all fields
  const { error: updateError } = await getLogisticsTable()
    .upsert({
      program_instance_id: programId,
      ...fields,
      updated_at: new Date().toISOString(),
    } as never, {
      onConflict: 'program_instance_id',
    });

  if (updateError) {
    console.error('Logistics update error:', updateError);
    return { success: false, error: updateError.message };
  }

  // Log each field change
  for (const [field, value] of Object.entries(fields)) {
    const oldValue = current?.[field as keyof typeof current];
    if (oldValue !== value) {
      await getActivityLogTable().insert({
        entity_type: 'program_logistics',
        entity_id: programId,
        action: 'field_updated',
        details: {
          field,
          old_value: oldValue,
          new_value: value,
          updated_at: new Date().toISOString(),
        },
      } as never);
    }
  }

  return { success: true };
}

/**
 * Create a new expense
 */
export async function createExpense(
  programId: string,
  expense: {
    category: string;
    description: string;
    amount: number;
    expense_date?: string;
    receipt_url?: string;
    receipt_file_name?: string;
    receipt_file_type?: string;
  }
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  const { data, error } = await getExpensesTable()
    .insert({
      program_instance_id: programId,
      ...expense,
    } as never)
    .select('id')
    .single();

  if (error) {
    console.error('Create expense error:', error);
    return { success: false, error: error.message };
  }

  // Log creation
  await getActivityLogTable().insert({
    entity_type: 'program_expense',
    entity_id: data.id,
    action: 'created',
    details: {
      program_id: programId,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
    },
  } as never);

  return { success: true, data: { id: data.id } };
}

/**
 * Update an expense
 */
export async function updateExpense(
  expenseId: string,
  updates: Partial<{
    category: string;
    description: string;
    amount: number;
    expense_date: string;
    receipt_url: string;
    receipt_file_name: string;
    receipt_file_type: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await getExpensesTable()
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', expenseId);

  if (error) {
    console.error('Update expense error:', error);
    return { success: false, error: error.message };
  }

  // Log update
  await getActivityLogTable().insert({
    entity_type: 'program_expense',
    entity_id: expenseId,
    action: 'updated',
    details: updates,
  } as never);

  return { success: true };
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<{ success: boolean; error?: string }> {
  // Get expense details before deletion for audit
  const { data: expense } = await getExpensesTable()
    .select('*')
    .eq('id', expenseId)
    .single();

  const { error } = await getExpensesTable()
    .delete()
    .eq('id', expenseId);

  if (error) {
    console.error('Delete expense error:', error);
    return { success: false, error: error.message };
  }

  // Log deletion
  if (expense) {
    await getActivityLogTable().insert({
      entity_type: 'program_expense',
      entity_id: expenseId,
      action: 'deleted',
      details: {
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
      },
    } as never);
  }

  return { success: true };
}
