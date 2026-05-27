'use client';

import { FileText, MapPin, Users, ClipboardCheck, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export type RequestType =
  | 'documentation'
  | 'geolocation'
  | 'identity_verification'
  | 'compliance_checklist';

export interface RequestTypeData {
  requestType: RequestType | null;
  commodity: string;
  dueDate: Date | null;
  message: string;
}

const REQUEST_TYPES: {
  value: RequestType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'documentation',
    label: 'Documentation Request',
    description: 'Request documents such as certificates, invoices, or contracts',
    icon: FileText,
  },
  {
    value: 'geolocation',
    label: 'Geolocation Data',
    description: 'Request GPS coordinates or plot boundary data',
    icon: MapPin,
  },
  {
    value: 'identity_verification',
    label: 'Producer Verification',
    description: 'Request producer identity documents or verification confirmation',
    icon: Users,
  },
  {
    value: 'compliance_checklist',
    label: 'Compliance Checklist',
    description: 'Request completion of EUDR compliance questionnaire',
    icon: ClipboardCheck,
  },
];

const COMMODITIES = ['Cocoa', 'Coffee', 'Palm Oil', 'Soy', 'Rubber', 'Cattle / Beef', 'Wood / Timber'];

interface StepRequestTypeProps {
  data: RequestTypeData;
  onChange: (data: RequestTypeData) => void;
  onNext: () => void;
  onCancel: () => void;
  mode?: 'request' | 'campaign';
}

export function StepRequestType({ data, onChange, onNext, onCancel, mode = 'request' }: StepRequestTypeProps) {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const canProceed = data.requestType !== null && data.commodity !== '';
  const requestTypes = REQUEST_TYPES.map((type) =>
    type.value === 'identity_verification'
      ? {
          ...type,
          label: isCooperative ? 'Member Verification' : 'Producer Verification',
          description: isCooperative
            ? 'Request member identity documents or verification confirmation'
            : type.description,
        }
      : type,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">
          {mode === 'campaign' ? 'What type of campaign?' : 'What type of request?'}
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {requestTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = data.requestType === type.value;
            return (
              <Card
                key={type.value}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  isSelected && 'border-primary bg-primary/5 ring-1 ring-primary',
                )}
                onClick={() => onChange({ ...data, requestType: type.value })}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commodity" className="text-base font-medium">
          Commodity
        </Label>
        <Select value={data.commodity} onValueChange={(value) => onChange({ ...data, commodity: value })}>
          <SelectTrigger id="commodity" className="w-full">
            <SelectValue placeholder="Select a commodity" />
          </SelectTrigger>
          <SelectContent>
            {COMMODITIES.map((commodity) => (
              <SelectItem key={commodity} value={commodity}>
                {commodity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due-date" className="text-base font-medium">
          Due Date (optional)
        </Label>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="due-date"
            type="date"
            className={cn('pl-9', !data.dueDate && 'text-muted-foreground')}
            min={new Date().toISOString().split('T')[0]}
            value={data.dueDate ? data.dueDate.toISOString().split('T')[0] : ''}
            onChange={(e) => onChange({ ...data, dueDate: e.target.value ? new Date(`${e.target.value}T00:00:00`) : null })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-base font-medium">
          Message (optional)
        </Label>
        <Textarea
          id="message"
          placeholder="Add a personalized message for recipients..."
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Continue
        </Button>
      </div>
    </div>
  );
}
