'use client';

import { FileText, MapPin, Users, ClipboardCheck, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
    label: 'Identity Verification',
    description: 'Request KYC documents or identity confirmation',
    icon: Users,
  },
  {
    value: 'compliance_checklist',
    label: 'Compliance Checklist',
    description: 'Request completion of EUDR compliance questionnaire',
    icon: ClipboardCheck,
  },
];

const COMMODITIES = [
  'Cocoa',
  'Coffee',
  'Palm Oil',
  'Soy',
  'Rubber',
  'Cattle / Beef',
  'Wood / Timber',
];

interface StepRequestTypeProps {
  data: RequestTypeData;
  onChange: (data: RequestTypeData) => void;
  onNext: () => void;
  onCancel: () => void;
}

export function StepRequestType({
  data,
  onChange,
  onNext,
  onCancel,
}: StepRequestTypeProps) {
  const canProceed = data.requestType !== null && data.commodity !== '';

  return (
    <div className="space-y-6">
      {/* Request Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">What type of request?</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REQUEST_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = data.requestType === type.value;
            return (
              <Card
                key={type.value}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  isSelected && 'border-primary bg-primary/5 ring-1 ring-primary'
                )}
                onClick={() => onChange({ ...data, requestType: type.value })}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{type.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Commodity Selection */}
      <div className="space-y-2">
        <Label htmlFor="commodity" className="text-base font-medium">
          Commodity
        </Label>
        <Select
          value={data.commodity}
          onValueChange={(value) => onChange({ ...data, commodity: value })}
        >
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

      {/* Due Date */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Due Date (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !data.dueDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.dueDate ? format(data.dueDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.dueDate ?? undefined}
              onSelect={(date) => onChange({ ...data, dueDate: date ?? null })}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Message */}
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

      {/* Actions */}
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
