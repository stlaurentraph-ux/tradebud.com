'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WizardProgress } from './wizard-progress';
import { StepRequestType, type RequestTypeData } from './step-request-type';
import { StepSelectRecipients, type Recipient, type RecipientsData } from './step-select-recipients';
import { StepReviewSend } from './step-review-send';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { useAuth } from '@/lib/auth-context';

type WizardMode = 'request' | 'campaign';

export interface NewRequestResult {
  status: 'Draft' | 'Sent';
  commodity: string;
  counterpartName: string;
  requestTypeLabel: string;
  recipientCount: number;
}

interface NewRequestWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: NewRequestResult) => void;
  mode?: WizardMode;
  title?: string;
  description?: string;
}

function getRequestTypeLabels(isCooperative: boolean): Record<NonNullable<RequestTypeData['requestType']>, string> {
  return {
    documentation: 'Documentation Request',
    geolocation: 'Geolocation Data',
    identity_verification: isCooperative ? 'Member Verification' : 'Producer Verification',
    compliance_checklist: 'Compliance Checklist',
  };
}

export function NewRequestWizardDialog({
  open,
  onOpenChange,
  onComplete,
  mode = 'request',
  title,
  description,
}: NewRequestWizardDialogProps) {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const noun = mode === 'campaign' ? 'campaign' : 'request';
  const requestTypeLabels = getRequestTypeLabels(isCooperative);
  const WIZARD_STEPS = [
    { label: mode === 'campaign' ? 'Campaign Type' : 'Request Type', description: `What ${noun} are you launching?` },
    { label: 'Recipients', description: `Who should receive this ${noun}?` },
    { label: mode === 'campaign' ? 'Review & Launch' : 'Review & Send', description: `Confirm and ${mode === 'campaign' ? 'launch' : 'send'}` },
  ];
  const [step, setStep] = useState(1);
  const [requestData, setRequestData] = useState<RequestTypeData>({
    requestType: null,
    commodity: '',
    dueDate: null,
    message: '',
  });
  const [recipientsData, setRecipientsData] = useState<RecipientsData>({
    selectedRecipients: [],
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableRecipients, setAvailableRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);

  const resetWizard = () => {
    setStep(1);
    setRequestData({ requestType: null, commodity: '', dueDate: null, message: '' });
    setRecipientsData({ selectedRecipients: [] });
    setSubmitError(null);
  };

  useEffect(() => {
    if (!open || !user?.tenant_id) return;
    let cancelled = false;

    const loadRecipients = async () => {
      setIsLoadingRecipients(true);
      setRecipientsError(null);

      try {
        const [contactsRes, plotsRes] = await Promise.all([
          fetch('/api/contacts', { method: 'GET', headers: getAuthHeaders(), cache: 'no-store' }),
          fetch('/api/plots', { method: 'GET', headers: getAuthHeaders(), cache: 'no-store' }),
        ]);

        const contactsBody = (await contactsRes.json().catch(() => [])) as
          | Array<Record<string, unknown>>
          | { data?: Array<Record<string, unknown>>; contacts?: Array<Record<string, unknown>>; error?: string };
        const plotsBody = (await plotsRes.json().catch(() => [])) as
          | Array<Record<string, unknown>>
          | { data?: Array<Record<string, unknown>>; plots?: Array<Record<string, unknown>>; error?: string };

        if (!contactsRes.ok && !plotsRes.ok) {
          const contactError = !Array.isArray(contactsBody) ? contactsBody.error : undefined;
          const plotError = !Array.isArray(plotsBody) ? plotsBody.error : undefined;
          throw new Error(contactError ?? plotError ?? 'Unable to load recipients.');
        }

        const contacts = Array.isArray(contactsBody)
          ? contactsBody
          : Array.isArray(contactsBody.contacts)
            ? contactsBody.contacts
            : Array.isArray(contactsBody.data)
              ? contactsBody.data
              : [];
        const plots = Array.isArray(plotsBody)
          ? plotsBody
          : Array.isArray(plotsBody.plots)
            ? plotsBody.plots
            : Array.isArray(plotsBody.data)
              ? plotsBody.data
              : [];

        const contactRecipients: Recipient[] = contacts.map((item) => {
          const id = typeof item.id === 'string' ? item.id : crypto.randomUUID();
          const name = typeof item.full_name === 'string' ? item.full_name : 'Unknown contact';
          const country = typeof item.country === 'string' && item.country ? item.country : 'Unknown';
          const organization = typeof item.organization === 'string' ? item.organization : '';
          const status = typeof item.status === 'string' ? item.status : 'new';
          return {
            id,
            type: organization ? 'organization' : 'farmer',
            name: organization || name,
            country,
            commodity: 'Unknown',
            complianceStatus: status === 'submitted' || status === 'engaged' ? 'compliant' : 'pending',
            farmerName: organization ? name : undefined,
          };
        });

        const plotRecipients: Recipient[] = plots.map((item) => {
          const id = typeof item.id === 'string' ? item.id : crypto.randomUUID();
          const name = typeof item.name === 'string' ? item.name : `Plot ${id}`;
          const farmerName = typeof item.farmer_name === 'string' ? item.farmer_name : undefined;
          const risk = typeof item.deforestation_risk === 'string' ? item.deforestation_risk : 'unknown';
          return {
            id,
            type: 'plot',
            name,
            country: 'Unknown',
            commodity: 'Unknown',
            complianceStatus: risk === 'low' ? 'compliant' : risk === 'high' ? 'non_compliant' : 'pending',
            farmerName,
          };
        });

        if (!cancelled) {
          setAvailableRecipients([...contactRecipients, ...plotRecipients]);
        }
      } catch (error) {
        if (!cancelled) {
          setRecipientsError(error instanceof Error ? error.message : 'Unable to load recipients.');
          setAvailableRecipients([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRecipients(false);
        }
      }
    };

    void loadRecipients();
    return () => {
      cancelled = true;
    };
  }, [open, user?.tenant_id]);

  const handleCancel = () => {
    onOpenChange(false);
    resetWizard();
  };

  const resolveCounterpartName = () => {
    if (recipientsData.selectedRecipients.length === 0) return 'Unknown counterpart';
    if (recipientsData.selectedRecipients.length === 1) return recipientsData.selectedRecipients[0].name;
    return `${recipientsData.selectedRecipients.length} recipients`;
  };
  const resolveRequestTypeLabel = () =>
    requestData.requestType ? requestTypeLabels[requestData.requestType] : mode === 'campaign' ? 'Programme Campaign' : 'Request';

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('tracebud_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const toBackendRequestType = (requestType: RequestTypeData['requestType']) => {
    switch (requestType) {
      case 'documentation':
        return 'GENERAL_EVIDENCE';
      case 'geolocation':
        return 'MISSING_PLOT_GEOMETRY';
      case 'identity_verification':
        return 'MISSING_PRODUCER_PROFILE';
      case 'compliance_checklist':
        return 'CONSENT_GRANT';
      default:
        return 'OTHER';
    }
  };

  const toTargetEmail = (recipient: Recipient): { email: string; full_name: string } => {
    const manualEmail = recipient.id.startsWith('manual-') ? recipient.id.replace(/^manual-/, '') : '';
    const email = manualEmail && manualEmail.includes('@') ? manualEmail : `${recipient.id}@tracebud.local`;
    return { email, full_name: recipient.name };
  };

  const createCampaign = async (status: 'Draft' | 'Sent') => {
    if (!requestData.requestType) {
      throw new Error('Select a request type before continuing.');
    }
    if (recipientsData.selectedRecipients.length === 0) {
      throw new Error('Select at least one recipient before continuing.');
    }

    const payload = {
      request_type: toBackendRequestType(requestData.requestType),
      campaign_name: `${mode === 'campaign' ? 'Campaign' : 'Request'} - ${requestData.commodity || 'General'}`,
      description_template: requestData.message || `Automated ${mode} from Tracebud workspace`,
      due_date: requestData.dueDate ? requestData.dueDate.toISOString().slice(0, 10) : undefined,
      targets: recipientsData.selectedRecipients.map(toTargetEmail),
      status: status === 'Draft' ? 'DRAFT' : 'QUEUED',
    };

    const response = await fetch('/api/requests/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      throw new Error(body.error ?? 'Failed to create campaign.');
    }
  };

  const handleSend = async () => {
    setSubmitError(null);
    await createCampaign('Sent');
    markOnboardingAction('campaign_created');
    onComplete({
      status: 'Sent',
      commodity: requestData.commodity || 'N/A',
      counterpartName: resolveCounterpartName(),
      requestTypeLabel: resolveRequestTypeLabel(),
      recipientCount: recipientsData.selectedRecipients.length,
    });
    onOpenChange(false);
    resetWizard();
  };

  const handleSaveDraft = async () => {
    setSubmitError(null);
    await createCampaign('Draft');
    markOnboardingAction('campaign_created');
    onComplete({
      status: 'Draft',
      commodity: requestData.commodity || 'N/A',
      counterpartName: resolveCounterpartName(),
      requestTypeLabel: resolveRequestTypeLabel(),
      recipientCount: recipientsData.selectedRecipients.length,
    });
    onOpenChange(false);
    resetWizard();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title ?? (mode === 'campaign' ? 'New Campaign' : 'New Request')}</DialogTitle>
          <DialogDescription>
            {description ??
              (mode === 'campaign'
                ? `Create a new outbound campaign for missing ${isCooperative ? 'member' : 'producer'}, plot, or evidence data`
                : 'Create a new inbound or outbound data request')}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <WizardProgress currentStep={step} steps={WIZARD_STEPS} />
        </div>
        {submitError ? (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {submitError}
          </div>
        ) : null}
        {recipientsError ? (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {recipientsError}
          </div>
        ) : null}
        {isLoadingRecipients && step === 2 ? (
          <div className="mb-4 rounded-md border p-3 text-sm text-muted-foreground">Loading recipients...</div>
        ) : null}

        {step === 1 && (
          <StepRequestType
            data={requestData}
            onChange={setRequestData}
            onNext={() => setStep(2)}
            onCancel={handleCancel}
            mode={mode}
          />
        )}
        {step === 2 && (
          <StepSelectRecipients
            data={recipientsData}
            availableRecipients={availableRecipients}
            onChange={setRecipientsData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            mode={mode}
          />
        )}
        {step === 3 && (
          <StepReviewSend
            requestData={requestData}
            recipientsData={recipientsData}
            onEditStep={setStep}
            onSend={async () => {
              try {
                await handleSend();
              } catch (error) {
                setSubmitError(error instanceof Error ? error.message : 'Failed to submit request.');
                throw error;
              }
            }}
            onSaveDraft={async () => {
              try {
                await handleSaveDraft();
              } catch (error) {
                setSubmitError(error instanceof Error ? error.message : 'Failed to save request draft.');
                throw error;
              }
            }}
            onBack={() => setStep(2)}
            mode={mode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
