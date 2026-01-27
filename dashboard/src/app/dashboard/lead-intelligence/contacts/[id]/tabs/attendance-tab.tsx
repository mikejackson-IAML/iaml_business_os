'use client';

import { useEffect, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';

interface AttendanceTabProps {
  contactId: string;
}

interface AttendanceRecord {
  id: string;
  program_name: string;
  event_date: string;
  rating: number | null;
  satisfaction_score: number | null;
  feedback: string | null;
  status: string | null;
}

type SortField = 'event_date' | 'rating';
type SortDir = 'asc' | 'desc';

export function AttendanceTab({ contactId }: AttendanceTabProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('event_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/lead-intelligence/contacts/${contactId}/attendance`);
        if (res.ok) {
          const json = await res.json();
          setRecords(json.data ?? []);
        }
      } catch {
        // Empty state will show
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [contactId]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const sorted = [...records].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'event_date') {
      return dir * ((a.event_date ?? '').localeCompare(b.event_date ?? ''));
    }
    return dir * ((a.rating ?? 0) - (b.rating ?? 0));
  });

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No attendance records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Program Name</th>
                  <th className="text-left py-2 px-3 font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => toggleSort('event_date')}
                    >
                      Event Date
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </th>
                  <th className="text-left py-2 px-3 font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => toggleSort('rating')}
                    >
                      Rating
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </th>
                  <th className="text-left py-2 px-3 font-medium">Satisfaction</th>
                  <th className="text-left py-2 px-3 font-medium">Feedback</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((rec) => {
                  const isExpanded = expandedFeedback.has(rec.id);
                  const feedback = rec.feedback ?? '';
                  const truncated = feedback.length > 80 && !isExpanded;
                  return (
                    <tr key={rec.id} className="border-b last:border-0">
                      <td className="py-2 px-3">{rec.program_name}</td>
                      <td className="py-2 px-3">
                        {rec.event_date ? new Date(rec.event_date).toLocaleDateString() : '--'}
                      </td>
                      <td className="py-2 px-3">{rec.rating ?? '--'}</td>
                      <td className="py-2 px-3">{rec.satisfaction_score ?? '--'}</td>
                      <td className="py-2 px-3 max-w-[200px]">
                        {feedback ? (
                          <span>
                            {truncated ? feedback.slice(0, 80) + '...' : feedback}
                            {feedback.length > 80 && (
                              <button
                                className="ml-1 text-primary text-xs hover:underline"
                                onClick={() =>
                                  setExpandedFeedback((prev) => {
                                    const next = new Set(prev);
                                    isExpanded ? next.delete(rec.id) : next.add(rec.id);
                                    return next;
                                  })
                                }
                              >
                                {isExpanded ? 'less' : 'more'}
                              </button>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="capitalize">{rec.status ?? '--'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
