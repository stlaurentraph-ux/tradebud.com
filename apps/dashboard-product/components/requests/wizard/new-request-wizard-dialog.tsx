'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WizardProgress } from './wizard-progress';
import { StepRequestType, type RequestTypeData } from './step-request-type';
import { StepSelectRecipients, type Recipient, type RecipientsData } from './step-select-recipients';
import { StepReviewSend } from './step-review-send';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { useAuth } from '@/lib/auth-context';

type WizardMode = 'request' | 'campaign';

const MOCK_RECIPIENTS: Recipient[] = [
  { id: 'org-1', type: 'organization', name: 'North Valley Cooperative', country: 'Ivory Coast', commodity: 'Cocoa', complianceStatus: 'compliant' },
  { id: 'org-2', type: 'organization', name: 'Kivu Export Group', country: 'DR Congo', commodity: 'Coffee', complianceStatus: 'pending' },
  { id: 'farmer-1', type: 'farmer', name: 'Kofi Asante', country: 'Ghana', commodity: 'Cocoa', complianceStatus: 'compliant' },
  { id: 'farmer-2', type: 'farmer', name: 'Maria Santos', country: 'Brazil', commodity: 'Coffee', complianceStatus: 'pending' },
  { id: 'plot-1', type: 'plot', name: 'Plot A-001 (2.5 ha)', country: 'Ghana', commodity: 'Cocoa', complianceStatus: 'compliant', farmerName: 'Kofi Asante' },
  { id: 'plot-2', type: 'plot', name: 'Fazenda Santos (15 ha)', country: 'Brazil', commodity: 'Coffee', complianceStatus: 'compliant', farmerName: 'Maria Santos' },
];
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

  const resetWizard = () => {
    setStep(1);
    setRequestData({ requestType: null, commodity: '', dueDate: null, message: '' });
    setRecipientsData({ selectedRecipients: [] });
  };

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

  const handleSend = async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
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
    await new Promise((resolve) => setTimeout(resolve, 250));
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
            availableRecipients={MOCK_RECIPIENTS}
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
            onSend={handleSend}
            onSaveDraft={handleSaveDraft}
            onBack={() => setStep(2)}
            mode={mode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
