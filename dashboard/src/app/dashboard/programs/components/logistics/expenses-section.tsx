'use client';

import { useState, useEffect, useRef } from 'react';
import { DollarSign, Plus, Trash2, Paperclip, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/dashboard-kit/components/ui/button';
import { EXPENSE_CATEGORIES, type ProgramExpense } from '@/lib/api/programs-queries';

interface ExpensesSectionProps {
  programId: string;
}

/**
 * Group expenses by category with subtotals
 * Per CONTEXT.md: Expenses grouped by category with subtotals
 */
function groupExpensesByCategory(expenses: ProgramExpense[]) {
  return EXPENSE_CATEGORIES.map((category) => {
    const items = expenses.filter((e) => e.category === category);
    const subtotal = items.reduce((sum, e) => sum + e.amount, 0);
    return { category, items, subtotal };
  }).filter((g) => g.items.length > 0);
}

export function ExpensesSection({ programId }: ExpensesSectionProps) {
  const [expenses, setExpenses] = useState<ProgramExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'Other' as ProgramExpense['category'],
    description: '',
    amount: '',
    expense_date: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);

  // Load expenses
  useEffect(() => {
    loadExpenses();
  }, [programId]);

  async function loadExpenses() {
    try {
      const res = await fetch(`/api/programs/${programId}/expenses`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense() {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Description and amount are required');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/programs/${programId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });

      if (res.ok) {
        toast.success('Expense added');
        setNewExpense({ category: 'Other', description: '', amount: '', expense_date: '' });
        loadExpenses();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add expense');
      }
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    setDeletingId(expenseId);
    try {
      const res = await fetch(`/api/programs/${programId}/expenses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expense_id: expenseId }),
      });

      if (res.ok) {
        toast.success('Expense deleted');
        loadExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch {
      toast.error('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUploadReceipt(expenseId: string, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit');
      return;
    }

    setUploadingId(expenseId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'receipt');

      const uploadRes = await fetch(`/api/programs/${programId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        toast.error('Upload failed');
        return;
      }

      const uploadData = await uploadRes.json();

      // Update expense with receipt info
      const updateRes = await fetch(`/api/programs/${programId}/expenses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_id: expenseId,
          receipt_url: uploadData.data.storage_path,
          receipt_file_name: uploadData.data.file_name,
          receipt_file_type: uploadData.data.file_type,
        }),
      });

      if (updateRes.ok) {
        toast.success('Receipt uploaded');
        loadExpenses();
      }
    } catch {
      toast.error('Failed to upload receipt');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDownloadReceipt(expense: ProgramExpense) {
    if (!expense.receipt_url) return;

    try {
      const res = await fetch(
        `/api/programs/${programId}/attachments?path=${encodeURIComponent(expense.receipt_url)}`
      );
      const data = await res.json();

      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      } else {
        toast.error('Could not get download link');
      }
    } catch {
      toast.error('Download failed');
    }
  }

  // Calculate grand total
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const groupedExpenses = groupExpensesByCategory(expenses);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Expenses</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Expenses</h3>
        {/* Grand total per CONTEXT.md */}
        <div className="text-sm font-medium">
          Total: <span className="text-lg">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Add new expense form */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ProgramExpense['category'] })}
            className="px-3 py-2 rounded-md border bg-background text-sm"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            placeholder="Description"
            className="px-3 py-2 rounded-md border bg-background text-sm"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              placeholder="0.00"
              step="0.01"
              className="w-full pl-7 pr-3 py-2 rounded-md border bg-background text-sm"
            />
          </div>
          <Button
            onClick={handleAddExpense}
            disabled={adding}
            size="sm"
            className="w-full"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expense list grouped by category */}
      {groupedExpenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No expenses recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedExpenses.map((group) => (
            <div key={group.category} className="rounded-lg border bg-card overflow-hidden">
              {/* Category header with subtotal */}
              <div className="px-4 py-2 bg-muted/50 flex justify-between items-center">
                <span className="text-sm font-medium">{group.category}</span>
                <span className="text-sm text-muted-foreground">
                  ${group.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Expense items */}
              <div className="divide-y">
                {group.items.map((expense) => (
                  <div key={expense.id} className="px-4 py-2 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{expense.description}</p>
                      {expense.expense_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <span className="text-sm font-medium">
                      ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>

                    {/* Receipt attachment */}
                    {expense.receipt_url ? (
                      <button
                        onClick={() => handleDownloadReceipt(expense)}
                        className="p-1.5 text-emerald-500 hover:text-emerald-600"
                        title={expense.receipt_file_name || 'Download receipt'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveExpenseId(expense.id);
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadingId === expense.id}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                        title="Attach receipt"
                      >
                        {uploadingId === expense.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingId === expense.id}
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      title="Delete expense"
                    >
                      {deletingId === expense.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input for receipt uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeExpenseId) {
            handleUploadReceipt(activeExpenseId, file);
          }
          e.target.value = '';
          setActiveExpenseId(null);
        }}
        className="hidden"
      />
    </section>
  );
}
