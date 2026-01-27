'use client';

interface AttendanceTabProps {
  contactId: string;
}

export function AttendanceTab({ contactId }: AttendanceTabProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
      Attendance tab loading for contact {contactId}...
    </div>
  );
}
