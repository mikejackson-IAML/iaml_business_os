"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getTasksUsingSOPAction } from "../sop-actions";

interface SOPUsageStatsProps {
  sopId: string;
  timesUsed: number;
}

interface TaskSummary {
  id: string;
  title: string;
  status: string;
}

export function SOPUsageStats({ sopId, timesUsed }: SOPUsageStatsProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const result = await getTasksUsingSOPAction(sopId);
      setLoading(false);

      if (!result) {
        setError("Failed to load tasks");
        return;
      }

      setTasks(result.tasks || []);
    };

    fetchTasks();
  }, [sopId]);

  // Group by status
  const byStatus = {
    open: tasks.filter((t) => t.status === "open").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    other: tasks.filter((t) => !["open", "in_progress", "done"].includes(t.status)).length,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Usage Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total completions */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Times Completed</span>
          <Badge variant="secondary">{timesUsed}</Badge>
        </div>

        {/* Tasks using this SOP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tasks Using This SOP</span>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Badge variant="outline">{tasks.length}</Badge>
            )}
          </div>

          {!loading && tasks.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{byStatus.open + byStatus.in_progress} active</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>{byStatus.done} completed</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>

        {/* View all tasks link */}
        {tasks.length > 0 && (
          <Link
            href={`/dashboard/action-center?sop_template_id=${sopId}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Users className="h-4 w-4" />
            View all tasks
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
