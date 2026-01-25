'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TaskCounts {
  critical_count: number;
  due_today_count: number;
  overdue_count: number;
  total_active_count: number;
  badge_count: number;
  generated_at: string;
}

interface UseTaskBadgeCountResult {
  count: number;
  isLoading: boolean;
}

const POLLING_INTERVAL = 60000; // 1 minute fallback polling

/**
 * Custom hook to get the task badge count (critical + overdue tasks)
 * with real-time updates via Supabase subscription.
 *
 * Falls back to polling if subscription fails.
 */
export function useTaskBadgeCount(): UseTaskBadgeCountResult {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch task counts from RPC
  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabaseRef.current
        .schema('action_center')
        .rpc('get_task_counts');

      if (error) {
        console.error('Error fetching task counts:', error);
        return;
      }

      const counts = data as TaskCounts;
      setCount(counts.badge_count);
    } catch (error) {
      console.error('Error fetching task counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(fetchCounts, POLLING_INTERVAL);
  }, [fetchCounts]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Initial fetch
    fetchCounts();

    // Subscribe to task changes
    try {
      const channel = supabase
        .channel('task-badge-count')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'action_center',
            table: 'tasks',
          },
          () => {
            // Refetch counts on any task change
            fetchCounts();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Subscription successful, ensure polling is stopped
            stopPolling();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Supabase subscription error, falling back to polling');
            startPolling();
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Failed to subscribe to task changes:', error);
      // Fall back to polling if subscription setup fails
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchCounts, startPolling, stopPolling]);

  return { count, isLoading };
}
