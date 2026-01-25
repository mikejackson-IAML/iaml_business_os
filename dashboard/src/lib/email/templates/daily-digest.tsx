/**
 * Daily Digest Email Template
 *
 * React Email template for the daily task digest.
 * Uses inline styles for maximum email client compatibility.
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from '@react-email/components';

// ==================== Types ====================

export interface DigestTask {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export interface DigestStats {
  totalActive: number;
  completedThisWeek: number;
}

export interface DailyDigestEmailProps {
  recipientName: string;
  criticalTasks: DigestTask[];
  dueTodayTasks: DigestTask[];
  overdueTasks: DigestTask[];
  stats: DigestStats;
  actionCenterUrl: string;
}

// ==================== Styles ====================

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    margin: '0',
    padding: '0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    margin: '40px auto',
    padding: '32px 40px',
    maxWidth: '580px',
  },
  greeting: {
    color: '#1a1a2e',
    fontSize: '20px',
    fontWeight: '600' as const,
    lineHeight: '28px',
    margin: '0 0 16px 0',
  },
  intro: {
    color: '#4a5568',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 24px 0',
  },
  sectionHeader: {
    fontSize: '14px',
    fontWeight: '600' as const,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 12px 0',
    padding: '8px 12px',
    borderRadius: '4px',
  },
  criticalHeader: {
    backgroundColor: '#fef2f2',
    color: '#DC2626',
    border: '1px solid #fecaca',
  },
  overdueHeader: {
    backgroundColor: '#fef2f2',
    color: '#DC2626',
    border: '1px solid #fecaca',
  },
  dueTodayHeader: {
    backgroundColor: '#fffbeb',
    color: '#D97706',
    border: '1px solid #fde68a',
  },
  taskList: {
    margin: '0 0 24px 0',
    padding: '0',
  },
  taskItem: {
    color: '#1a1a2e',
    fontSize: '15px',
    lineHeight: '22px',
    margin: '0 0 8px 0',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '4px',
    borderLeft: '3px solid #e2e8f0',
  },
  criticalTask: {
    borderLeftColor: '#DC2626',
    backgroundColor: '#fef2f2',
  },
  overdueTask: {
    borderLeftColor: '#DC2626',
    backgroundColor: '#fef2f2',
  },
  dueTodayTask: {
    borderLeftColor: '#D97706',
    backgroundColor: '#fffbeb',
  },
  taskDue: {
    color: '#6b7280',
    fontSize: '13px',
    marginLeft: '8px',
  },
  hr: {
    borderColor: '#e2e8f0',
    margin: '24px 0',
  },
  statsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '0 0 24px 0',
  },
  statsTitle: {
    color: '#4a5568',
    fontSize: '13px',
    fontWeight: '600' as const,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px 0',
  },
  statsRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    margin: '4px 0',
  },
  statsLabel: {
    color: '#6b7280',
    fontSize: '14px',
  },
  statsValue: {
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600' as const,
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  footer: {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '24px 0 0 0',
    textAlign: 'center' as const,
  },
};

// ==================== Helper Functions ====================

function formatDueDate(dueDate: string | null, dueTime: string | null): string {
  if (!dueDate) return '';

  const date = new Date(dueDate);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  let formatted = date.toLocaleDateString('en-US', options);

  if (dueTime) {
    const [hours, minutes] = dueTime.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    formatted += ` at ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  return formatted;
}

// ==================== Component ====================

export function DailyDigestEmail({
  recipientName,
  criticalTasks,
  dueTodayTasks,
  overdueTasks,
  stats,
  actionCenterUrl,
}: DailyDigestEmailProps) {
  const firstName = recipientName.split(' ')[0] || recipientName;

  const hasCritical = criticalTasks.length > 0;
  const hasDueToday = dueTodayTasks.length > 0;
  const hasOverdue = overdueTasks.length > 0;
  const hasUrgent = hasCritical || hasDueToday || hasOverdue;

  // Calculate total urgent items for preview
  const totalUrgent = criticalTasks.length + dueTodayTasks.length + overdueTasks.length;

  const previewText = hasUrgent
    ? `You have ${totalUrgent} item${totalUrgent !== 1 ? 's' : ''} needing attention today`
    : `All clear! ${stats.totalActive} active tasks, none urgent`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Greeting */}
          <Text style={styles.greeting}>
            Hey {firstName}, here&apos;s what&apos;s on your plate today...
          </Text>

          {/* Intro based on urgency */}
          {hasUrgent ? (
            <Text style={styles.intro}>
              You&apos;ve got {totalUrgent} item{totalUrgent !== 1 ? 's' : ''} that need{totalUrgent === 1 ? 's' : ''} your attention.
              {hasCritical && ' Some are critical - let\'s tackle those first.'}
            </Text>
          ) : (
            <Text style={styles.intro}>
              Great news - nothing urgent today! You have {stats.totalActive} active task{stats.totalActive !== 1 ? 's' : ''} in your queue.
            </Text>
          )}

          {/* Critical Tasks Section */}
          {hasCritical && (
            <Section>
              <Text style={{ ...styles.sectionHeader, ...styles.criticalHeader }}>
                Critical ({criticalTasks.length})
              </Text>
              <div style={styles.taskList}>
                {criticalTasks.map((task) => (
                  <Text
                    key={task.id}
                    style={{ ...styles.taskItem, ...styles.criticalTask }}
                  >
                    {task.title}
                    {task.due_date && (
                      <span style={styles.taskDue}>
                        - {formatDueDate(task.due_date, task.due_time)}
                      </span>
                    )}
                  </Text>
                ))}
              </div>
            </Section>
          )}

          {/* Overdue Tasks Section */}
          {hasOverdue && (
            <Section>
              <Text style={{ ...styles.sectionHeader, ...styles.overdueHeader }}>
                Overdue ({overdueTasks.length})
              </Text>
              <div style={styles.taskList}>
                {overdueTasks.map((task) => (
                  <Text
                    key={task.id}
                    style={{ ...styles.taskItem, ...styles.overdueTask }}
                  >
                    {task.title}
                    {task.due_date && (
                      <span style={styles.taskDue}>
                        - was due {formatDueDate(task.due_date, task.due_time)}
                      </span>
                    )}
                  </Text>
                ))}
              </div>
            </Section>
          )}

          {/* Due Today Section */}
          {hasDueToday && (
            <Section>
              <Text style={{ ...styles.sectionHeader, ...styles.dueTodayHeader }}>
                Due Today ({dueTodayTasks.length})
              </Text>
              <div style={styles.taskList}>
                {dueTodayTasks.map((task) => (
                  <Text
                    key={task.id}
                    style={{ ...styles.taskItem, ...styles.dueTodayTask }}
                  >
                    {task.title}
                    {task.due_time && (
                      <span style={styles.taskDue}>
                        - by {formatDueDate(task.due_date, task.due_time)}
                      </span>
                    )}
                  </Text>
                ))}
              </div>
            </Section>
          )}

          <Hr style={styles.hr} />

          {/* Stats Section */}
          <Section style={styles.statsSection}>
            <Text style={styles.statsTitle}>Quick Stats</Text>
            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={styles.statsLabel}>Active tasks</td>
                  <td style={{ ...styles.statsValue, textAlign: 'right' }}>
                    {stats.totalActive}
                  </td>
                </tr>
                <tr>
                  <td style={styles.statsLabel}>Completed this week</td>
                  <td style={{ ...styles.statsValue, textAlign: 'right' }}>
                    {stats.completedThisWeek}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* CTA Button */}
          <Section style={{ textAlign: 'center' }}>
            <Button style={styles.button} href={actionCenterUrl}>
              View Action Center
            </Button>
          </Section>

          {/* Footer */}
          <Text style={styles.footer}>
            This is your daily digest from IAML Action Center.
            <br />
            You can adjust your notification preferences in your profile settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default DailyDigestEmail;
