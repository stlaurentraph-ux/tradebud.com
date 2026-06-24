import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DeliveryIntakeStatus = 'ready' | 'pending' | 'already_registered';

export function resolveDeliveryIntakeStatus(input: {
  eligibleForBuyerIntake: boolean;
  intakeBlockReason?: 'plot_not_ready' | 'already_packaged' | null;
}): DeliveryIntakeStatus {
  if (input.eligibleForBuyerIntake) return 'ready';
  if (input.intakeBlockReason === 'already_packaged') return 'already_registered';
  return 'pending';
}

const STATUS_LABEL: Record<DeliveryIntakeStatus, string> = {
  ready: 'Ready for registration',
  pending: 'Verification in progress',
  already_registered: 'Already registered',
};

const STATUS_CLASS: Record<DeliveryIntakeStatus, string> = {
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  already_registered: 'border-border bg-muted text-muted-foreground',
};

export function DeliveryIntakeStatusBadge({ status }: { status: DeliveryIntakeStatus }) {
  return (
    <Badge variant="outline" className={cn('mt-2', STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const STEPS = [
  { step: '1', title: 'Scan receipt', body: 'You opened the QR from a field delivery.' },
  { step: '2', title: 'Sign in', body: 'Use your cooperative or buyer workspace.' },
  { step: '3', title: 'Confirm at desk', body: 'Register weight and assemble your batch.' },
] as const;

export function DeliveryIntakeSteps() {
  return (
    <ol className="mt-6 space-y-3 border-t border-border pt-4">
      {STEPS.map((item) => (
        <li key={item.step} className="flex gap-3 text-sm">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            aria-hidden="true"
          >
            {item.step}
          </span>
          <div>
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="text-muted-foreground">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
