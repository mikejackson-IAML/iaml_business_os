// Program Alerts Calculation Utility
// Centralized alert threshold logic for Phase 6 status/alerts features

import type { ProgramDetail, ProgramLogistics } from './programs-queries';

// ============================================
// Alert Thresholds (from PROG-60 requirements)
// ============================================

export const ALERT_THRESHOLDS = {
  instructor: { warning: 45, critical: 30 },
  hotel: { warning: 90, critical: 60 },
  venue: { warning: 90, critical: 60 },
  room_block: { warning: 90, critical: 60 },
  beo: { warning: 10, critical: 7 },
  materials_to_instructor: { warning: 45, critical: 30 },
  materials_printed: { warning: 14, critical: 7 },
  materials_shipped: { warning: 10, critical: 5 },
  av_shipped: { warning: 10, critical: 5 },
  registrations: { warning: 45, critical: 30 },
  payment: { warning: 0, critical: -14 }, // 0 = at due date, -14 = 14 days past
} as const;

// ============================================
// Types
// ============================================

export type AlertType = keyof typeof ALERT_THRESHOLDS;

export interface ProgramAlert {
  id: string;
  type: AlertType;
  severity: 'warning' | 'critical';
  message: string;
}

export interface AlertSummary {
  warningCount: number;
  criticalCount: number;
  alerts: ProgramAlert[];
}

export interface LogisticsReadiness {
  completed: number;
  total: number;
  warnings: number;
}

// ============================================
// Alert Calculation
// ============================================

/**
 * Calculate all alerts for a program based on logistics state and deadlines
 *
 * @param program - Program detail with days_until_start and format
 * @param logistics - Logistics state with timestamps for completed items
 * @param unpaidRegistrations - Registrations with payment_due_date for payment alerts
 * @returns AlertSummary with counts and individual alerts
 */
export function calculateProgramAlerts(
  program: ProgramDetail,
  logistics: ProgramLogistics,
  unpaidRegistrations: { payment_due_date: string | null }[]
): AlertSummary {
  const alerts: ProgramAlert[] = [];

  // Early return for on-demand format - no alerts
  if (program.format === 'on-demand') {
    return { warningCount: 0, criticalCount: 0, alerts: [] };
  }

  // Early return for completed programs (past start date)
  const daysUntil = program.days_until_start;
  if (daysUntil !== null && daysUntil < 0) {
    return { warningCount: 0, criticalCount: 0, alerts: [] };
  }

  // Default to large number if days_until_start is null (far future)
  const days = daysUntil ?? 999;
  const isVirtual = program.format === 'virtual';

  // ---- Instructor Alert ----
  if (!logistics.instructor_confirmed_at) {
    if (days <= ALERT_THRESHOLDS.instructor.critical) {
      alerts.push({
        id: 'instructor-critical',
        type: 'instructor',
        severity: 'critical',
        message: 'No instructor confirmed',
      });
    } else if (days <= ALERT_THRESHOLDS.instructor.warning) {
      alerts.push({
        id: 'instructor-warning',
        type: 'instructor',
        severity: 'warning',
        message: 'Instructor not yet confirmed',
      });
    }
  }

  // ---- In-person only alerts ----
  if (!isVirtual) {
    // Hotel (my hotel)
    if (!logistics.my_hotel_booked_at) {
      if (days <= ALERT_THRESHOLDS.hotel.critical) {
        alerts.push({
          id: 'hotel-critical',
          type: 'hotel',
          severity: 'critical',
          message: 'Hotel not booked',
        });
      } else if (days <= ALERT_THRESHOLDS.hotel.warning) {
        alerts.push({
          id: 'hotel-warning',
          type: 'hotel',
          severity: 'warning',
          message: 'Hotel not yet booked',
        });
      }
    }

    // Venue
    if (!logistics.venue_confirmed_at) {
      if (days <= ALERT_THRESHOLDS.venue.critical) {
        alerts.push({
          id: 'venue-critical',
          type: 'venue',
          severity: 'critical',
          message: 'Venue not confirmed',
        });
      } else if (days <= ALERT_THRESHOLDS.venue.warning) {
        alerts.push({
          id: 'venue-warning',
          type: 'venue',
          severity: 'warning',
          message: 'Venue not yet confirmed',
        });
      }
    }

    // Room Block
    if (!logistics.room_block_secured_at) {
      if (days <= ALERT_THRESHOLDS.room_block.critical) {
        alerts.push({
          id: 'room_block-critical',
          type: 'room_block',
          severity: 'critical',
          message: 'Room block not secured',
        });
      } else if (days <= ALERT_THRESHOLDS.room_block.warning) {
        alerts.push({
          id: 'room_block-warning',
          type: 'room_block',
          severity: 'warning',
          message: 'Room block not yet secured',
        });
      }
    }

    // AV Shipped (in-person only)
    if (!logistics.av_shipped) {
      if (days <= ALERT_THRESHOLDS.av_shipped.critical) {
        alerts.push({
          id: 'av_shipped-critical',
          type: 'av_shipped',
          severity: 'critical',
          message: 'AV equipment not shipped',
        });
      } else if (days <= ALERT_THRESHOLDS.av_shipped.warning) {
        alerts.push({
          id: 'av_shipped-warning',
          type: 'av_shipped',
          severity: 'warning',
          message: 'AV equipment not yet shipped',
        });
      }
    }
  }

  // ---- BEO Alert (in-person only) ----
  if (!isVirtual && logistics.beo_status !== 'final') {
    if (days <= ALERT_THRESHOLDS.beo.critical) {
      alerts.push({
        id: 'beo-critical',
        type: 'beo',
        severity: 'critical',
        message: 'BEO not finalized',
      });
    } else if (days <= ALERT_THRESHOLDS.beo.warning) {
      alerts.push({
        id: 'beo-warning',
        type: 'beo',
        severity: 'warning',
        message: 'BEO not yet finalized',
      });
    }
  }

  // ---- Materials Alerts ----
  // Materials sent to instructor
  if (!logistics.materials_sent_to_instructor) {
    if (days <= ALERT_THRESHOLDS.materials_to_instructor.critical) {
      alerts.push({
        id: 'materials_to_instructor-critical',
        type: 'materials_to_instructor',
        severity: 'critical',
        message: 'Materials not sent to instructor',
      });
    } else if (days <= ALERT_THRESHOLDS.materials_to_instructor.warning) {
      alerts.push({
        id: 'materials_to_instructor-warning',
        type: 'materials_to_instructor',
        severity: 'warning',
        message: 'Materials not yet sent to instructor',
      });
    }
  }

  // Materials printed (in-person only)
  if (!isVirtual && !logistics.materials_printed) {
    if (days <= ALERT_THRESHOLDS.materials_printed.critical) {
      alerts.push({
        id: 'materials_printed-critical',
        type: 'materials_printed',
        severity: 'critical',
        message: 'Materials not printed',
      });
    } else if (days <= ALERT_THRESHOLDS.materials_printed.warning) {
      alerts.push({
        id: 'materials_printed-warning',
        type: 'materials_printed',
        severity: 'warning',
        message: 'Materials not yet printed',
      });
    }
  }

  // Materials shipped
  if (!logistics.materials_shipped) {
    if (days <= ALERT_THRESHOLDS.materials_shipped.critical) {
      alerts.push({
        id: 'materials_shipped-critical',
        type: 'materials_shipped',
        severity: 'critical',
        message: 'Materials not shipped',
      });
    } else if (days <= ALERT_THRESHOLDS.materials_shipped.warning) {
      alerts.push({
        id: 'materials_shipped-warning',
        type: 'materials_shipped',
        severity: 'warning',
        message: 'Materials not yet shipped',
      });
    }
  }

  // ---- Registration Alert ----
  if (program.current_enrolled < 6) {
    if (days <= ALERT_THRESHOLDS.registrations.critical) {
      alerts.push({
        id: 'registrations-critical',
        type: 'registrations',
        severity: 'critical',
        message: `Only ${program.current_enrolled} registration${program.current_enrolled !== 1 ? 's' : ''}`,
      });
    } else if (days <= ALERT_THRESHOLDS.registrations.warning) {
      alerts.push({
        id: 'registrations-warning',
        type: 'registrations',
        severity: 'warning',
        message: `Only ${program.current_enrolled} registration${program.current_enrolled !== 1 ? 's' : ''}`,
      });
    }
  }

  // ---- Payment Alerts (rolled up to program level) ----
  const now = new Date();
  let pastDueCount = 0;
  let atDueCount = 0;

  for (const reg of unpaidRegistrations) {
    if (!reg.payment_due_date) continue;

    const dueDate = new Date(reg.payment_due_date);
    const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= ALERT_THRESHOLDS.payment.critical) {
      // More than 14 days past due
      pastDueCount++;
    } else if (daysDiff <= ALERT_THRESHOLDS.payment.warning) {
      // At or past due date (but not yet 14 days past)
      atDueCount++;
    }
  }

  // Roll up to single alert per category
  if (pastDueCount > 0) {
    alerts.push({
      id: 'payment-critical',
      type: 'payment',
      severity: 'critical',
      message: `${pastDueCount} invoice${pastDueCount !== 1 ? 's' : ''} 14+ days past due`,
    });
  }

  if (atDueCount > 0) {
    alerts.push({
      id: 'payment-warning',
      type: 'payment',
      severity: 'warning',
      message: `${atDueCount} invoice${atDueCount !== 1 ? 's' : ''} at or past due`,
    });
  }

  return {
    warningCount: alerts.filter((a) => a.severity === 'warning').length,
    criticalCount: alerts.filter((a) => a.severity === 'critical').length,
    alerts,
  };
}

// ============================================
// Logistics Readiness Calculation
// ============================================

/**
 * Calculate logistics readiness (completed items, total items, warnings)
 *
 * @param format - Program format (virtual, in-person, on-demand)
 * @param logistics - Logistics state with timestamps/flags
 * @param alerts - AlertSummary to count logistics-related warnings
 * @returns LogisticsReadiness with completed/total/warnings
 */
export function calculateLogisticsReadiness(
  format: string | null,
  logistics: ProgramLogistics,
  alerts: AlertSummary
): LogisticsReadiness {
  // On-demand programs have no logistics
  if (format === 'on-demand') {
    return { completed: 0, total: 0, warnings: 0 };
  }

  const isVirtual = format === 'virtual';
  // In-person: 10 items, Virtual: 6 items
  const total = isVirtual ? 6 : 10;

  let completed = 0;

  if (isVirtual) {
    // Virtual items (6):
    // 1. Instructor confirmed
    if (logistics.instructor_confirmed_at) completed++;
    // 2. Platform ready
    if (logistics.platform_ready) completed++;
    // 3. Calendar invites sent
    if (logistics.calendar_invites_sent) completed++;
    // 4. Reminder emails sent
    if (logistics.reminder_emails_sent) completed++;
    // 5. Materials sent to instructor
    if (logistics.materials_sent_to_instructor) completed++;
    // 6. Materials shipped (digital delivery)
    if (logistics.materials_shipped) completed++;
  } else {
    // In-person items (10):
    // 1. Instructor confirmed
    if (logistics.instructor_confirmed_at) completed++;
    // 2. My hotel booked
    if (logistics.my_hotel_booked_at) completed++;
    // 3. Instructor hotel booked
    if (logistics.instructor_hotel_booked_at) completed++;
    // 4. Room block secured
    if (logistics.room_block_secured_at) completed++;
    // 5. Venue confirmed
    if (logistics.venue_confirmed_at) completed++;
    // 6. BEO finalized
    if (logistics.beo_status === 'final') completed++;
    // 7. Materials sent to instructor
    if (logistics.materials_sent_to_instructor) completed++;
    // 8. Materials printed
    if (logistics.materials_printed) completed++;
    // 9. Materials shipped
    if (logistics.materials_shipped) completed++;
    // 10. AV shipped
    if (logistics.av_shipped) completed++;
  }

  // Warnings = count of logistics-related alerts (not registration/payment)
  const logisticsAlertTypes: AlertType[] = [
    'instructor',
    'hotel',
    'venue',
    'room_block',
    'beo',
    'materials_to_instructor',
    'materials_printed',
    'materials_shipped',
    'av_shipped',
  ];

  const warnings = alerts.alerts.filter((a) =>
    logisticsAlertTypes.includes(a.type)
  ).length;

  return { completed, total, warnings };
}
