'use client';

import { useState } from 'react';
import {
  FileText,
  MapPin,
  Users,
  ClipboardCheck,
  Building2,
  User,
  Map,
  Calendar,
  MessageSquare,
  Edit2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import type { RequestType, RequestTypeData } from './step-request-type';
import type { Recipient, RecipientsData } from './step-select-recipients';

interface StepReviewSendProps {
  requestData: RequestTypeData;
  recipientsData: RecipientsData;
  onEditStep: (step: number) => void;
  onSend: () => Promise<void>;
  onSaveDraft: () => Promise<void>;
  onBack: () => void;
  mode?: 'request' | 'campaign';
}

const REQUEST_TYPE_CONFIG: Record<RequestType, { label: string; icon: React.ElementType }> = {
  documentation: { label: 'Documentation Request', icon: FileText },
  geolocation: { label: 'Geolocation Data', icon: MapPin },
  identity_verification: { label: 'Producer Verification', icon: Users },
  compliance_checklist: { label: 'Compliance Checklist', icon: ClipboardCheck },
};

export function StepReviewSend({
  requestData,
  recipientsData,
  onEditStep,
  onSend,
  onSaveDraft,
  onBack,
  mode = 'request',
}: StepReviewSendProps) {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const [recipientsExpanded, setRecipientsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const typeConfig = requestData.requestType ? REQUEST_TYPE_CONFIG[requestData.requestType] : null;
  const typeLabel =
    requestData.requestType === 'identity_verification'
      ? isCooperative
        ? 'Member Verification'
        : 'Producer Verification'
      : typeConfig?.label;
  const TypeIcon = typeConfig?.icon ?? FileText;

  const recipientsByType = recipientsData.selectedRecipients.reduce(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    },
    {} as Record<string, Recipient[]>,
  );

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend();
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await onSaveDraft();
    } finally {
      setIsSavingDraft(false);
    }
  };

  const isLoading = isSending || isSavingDraft;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">{mode === 'campaign' ? 'Campaign Details' : 'Request Details'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(1)} disabled={isLoading} className="h-8 gap-1.5 text-xs">
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Request Type</p>
              <p className="font-medium">{typeLabel}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commodity</p>
              <p className="font-medium">{requestData.commodity}</p>
            </div>
          </div>

          {requestData.dueDate && (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{format(requestData.dueDate, 'MMMM d, yyyy')}</p>
              </div>
            </div>
          )}

          {requestData.message && (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap font-medium">{requestData.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recipients ({recipientsData.selectedRecipients.length})</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEditStep(2)} disabled={isLoading} className="h-8 gap-1.5 text-xs">
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {recipientsByType.organization && (
              <Badge variant="secondary" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {recipientsByType.organization.length} Organization{recipientsByType.organization.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {recipientsByType.farmer && (
              <Badge variant="secondary" className="gap-1.5">
                <User className="h-3.5 w-3.5" />
                {recipientsByType.farmer.length} {isCooperative ? 'Member' : 'Producer'}
                {recipientsByType.farmer.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {recipientsByType.plot && (
              <Badge variant="secondary" className="gap-1.5">
                <Map className="h-3.5 w-3.5" />
                {recipientsByType.plot.length} Plot{recipientsByType.plot.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <Collapsible open={recipientsExpanded} onOpenChange={setRecipientsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-full justify-between text-xs">
                <span>{recipientsExpanded ? 'Hide' : 'Show'} all recipients</span>
                {recipientsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 max-h-[240px] space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                {recipientsData.selectedRecipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center gap-3 rounded-md bg-muted/50 p-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                      {recipient.type === 'organization' && <Building2 className="h-4 w-4 text-muted-foreground" />}
                      {recipient.type === 'farmer' && <User className="h-4 w-4 text-muted-foreground" />}
                      {recipient.type === 'plot' && <Map className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{recipient.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {recipient.country} &bull; {recipient.commodity}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 text-xs',
                        recipient.complianceStatus === 'compliant' && 'border-green-200 bg-green-50 text-green-700',
                        recipient.complianceStatus === 'pending' && 'border-yellow-200 bg-yellow-50 text-yellow-700',
                        recipient.complianceStatus === 'non_compliant' && 'border-red-200 bg-red-50 text-red-700',
                      )}
                    >
                      {recipient.complianceStatus === 'non_compliant'
                        ? 'Non-Compliant'
                        : recipient.complianceStatus.charAt(0).toUpperCase() + recipient.complianceStatus.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading} className="gap-2">
            {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save as Draft
          </Button>
          <Button onClick={handleSend} disabled={isLoading} className="gap-2">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {mode === 'campaign' ? 'Launch Campaign' : 'Send Request'}
          </Button>
        </div>
      </div>
    </div>
  );
}
