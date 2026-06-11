export type NotificationDelivery = 'email' | 'push' | 'in_app';

export interface NotificationCapability {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'planned';
  deliveries: Partial<Record<NotificationDelivery, boolean>>;
  note?: string;
}

export const NOTIFICATION_CAPABILITIES: NotificationCapability[] = [
  {
    id: 'onboarding',
    title: 'Account & onboarding emails',
    description: 'Welcome email after workspace setup and resume reminders for incomplete onboarding.',
    status: 'active',
    deliveries: { email: true },
    note: 'Always sent by Tracebud when applicable. Not configurable here yet.',
  },
  {
    id: 'campaign_outreach',
    title: 'Campaign outreach emails',
    description: 'Emails sent to contacts when you launch request or outreach campaigns.',
    status: 'active',
    deliveries: { email: true },
    note: 'Controlled by campaign actions, not per-user notification preferences.',
  },
  {
    id: 'package_updates',
    title: 'Package updates',
    description: 'Alerts when shipment package status changes.',
    status: 'planned',
    deliveries: { email: true, in_app: true },
  },
  {
    id: 'compliance_alerts',
    title: 'Compliance alerts',
    description:
      'Email and mobile push when land tenure documents need exporter review or package readiness regresses.',
    status: 'active',
    deliveries: { email: true, in_app: true, push: true },
    note: 'Tenure MANUAL_REQUIRED/FAILED alerts are sent to cooperative staff and farmers when push tokens are registered.',
  },
  {
    id: 'traces_submissions',
    title: 'TRACES submissions',
    description: 'Updates when TRACES filing status changes.',
    status: 'planned',
    deliveries: { email: true },
  },
  {
    id: 'weekly_reports',
    title: 'Weekly reports',
    description: 'Scheduled summary of compliance and shipment readiness.',
    status: 'planned',
    deliveries: { email: true },
  },
  {
    id: 'system_updates',
    title: 'System updates',
    description: 'Important platform announcements and maintenance notices.',
    status: 'planned',
    deliveries: { email: true, in_app: true },
  },
  {
    id: 'push_notifications',
    title: 'Browser push notifications',
    description: 'Real-time alerts in your browser.',
    status: 'planned',
    deliveries: { push: true },
    note: 'Push delivery is not wired in the dashboard yet.',
  },
];
