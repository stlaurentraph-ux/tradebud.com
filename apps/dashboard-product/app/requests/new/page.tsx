'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/requests/wizard/wizard-progress';
import {
  StepRequestType,
  type RequestTypeData,
} from '@/components/requests/wizard/step-request-type';
import {
  StepSelectRecipients,
  type RecipientsData,
  type Recipient,
} from '@/components/requests/wizard/step-select-recipients';
import { StepReviewSend } from '@/components/requests/wizard/step-review-send';

// Mock recipients data
const MOCK_RECIPIENTS: Recipient[] = [
  // Organizations
  {
    id: 'org-1',
    type: 'organization',
    name: 'Cocoa Cooperative Abidjan',
    country: 'Ivory Coast',
    commodity: 'Cocoa',
    complianceStatus: 'compliant',
    organizationType: 'Cooperative',
  },
  {
    id: 'org-2',
    type: 'organization',
    name: 'Ghana Cocoa Board',
    country: 'Ghana',
    commodity: 'Cocoa',
    complianceStatus: 'compliant',
    organizationType: 'Government',
  },
  {
    id: 'org-3',
    type: 'organization',
    name: 'Brazilian Coffee Exporters',
    country: 'Brazil',
    commodity: 'Coffee',
    complianceStatus: 'pending',
    organizationType: 'Exporter',
  },
  {
    id: 'org-4',
    type: 'organization',
    name: 'Indonesian Palm Oil Association',
    country: 'Indonesia',
    commodity: 'Palm Oil',
    complianceStatus: 'non_compliant',
    organizationType: 'Association',
  },
  {
    id: 'org-5',
    type: 'organization',
    name: 'Colombian Coffee Federation',
    country: 'Colombia',
    commodity: 'Coffee',
    complianceStatus: 'compliant',
    organizationType: 'Federation',
  },
  {
    id: 'org-6',
    type: 'organization',
    name: 'Vietnam Rubber Group',
    country: 'Vietnam',
    commodity: 'Rubber',
    complianceStatus: 'pending',
    organizationType: 'Corporation',
  },
  // Farmers
  {
    id: 'farmer-1',
    type: 'farmer',
    name: 'Kofi Asante',
    country: 'Ghana',
    commodity: 'Cocoa',
    complianceStatus: 'compliant',
  },
  {
    id: 'farmer-2',
    type: 'farmer',
    name: 'Maria Santos',
    country: 'Brazil',
    commodity: 'Coffee',
    complianceStatus: 'compliant',
  },
  {
    id: 'farmer-3',
    type: 'farmer',
    name: 'Jean-Pierre Kouassi',
    country: 'Ivory Coast',
    commodity: 'Cocoa',
    complianceStatus: 'pending',
  },
  {
    id: 'farmer-4',
    type: 'farmer',
    name: 'Budi Santoso',
    country: 'Indonesia',
    commodity: 'Palm Oil',
    complianceStatus: 'non_compliant',
  },
  {
    id: 'farmer-5',
    type: 'farmer',
    name: 'Carlos Rodriguez',
    country: 'Colombia',
    commodity: 'Coffee',
    complianceStatus: 'compliant',
  },
  {
    id: 'farmer-6',
    type: 'farmer',
    name: 'Aminata Diallo',
    country: 'Ivory Coast',
    commodity: 'Cocoa',
    complianceStatus: 'pending',
  },
  {
    id: 'farmer-7',
    type: 'farmer',
    name: 'Nguyen Van Minh',
    country: 'Vietnam',
    commodity: 'Rubber',
    complianceStatus: 'compliant',
  },
  {
    id: 'farmer-8',
    type: 'farmer',
    name: 'Pedro Alvarez',
    country: 'Peru',
    commodity: 'Coffee',
    complianceStatus: 'pending',
  },
  // Plots
  {
    id: 'plot-1',
    type: 'plot',
    name: 'Plot A-001 (2.5 ha)',
    country: 'Ghana',
    commodity: 'Cocoa',
    complianceStatus: 'compliant',
    farmerId: 'farmer-1',
    farmerName: 'Kofi Asante',
    plotSize: '2.5 ha',
  },
  {
    id: 'plot-2',
    type: 'plot',
    name: 'Plot A-002 (1.8 ha)',
    country: 'Ghana',
    commodity: 'Cocoa',
    complianceStatus: 'compliant',
    farmerId: 'farmer-1',
    farmerName: 'Kofi Asante',
    plotSize: '1.8 ha',
  },
  {
    id: 'plot-3',
    type: 'plot',
    name: 'Fazenda Santos (15 ha)',
    country: 'Brazil',
    commodity: 'Coffee',
    complianceStatus: 'compliant',
    farmerId: 'farmer-2',
    farmerName: 'Maria Santos',
    plotSize: '15 ha',
  },
  {
    id: 'plot-4',
    type: 'plot',
    name: 'Plot IC-101 (3.2 ha)',
    country: 'Ivory Coast',
    commodity: 'Cocoa',
    complianceStatus: 'pending',
    farmerId: 'farmer-3',
    farmerName: 'Jean-Pierre Kouassi',
    plotSize: '3.2 ha',
  },
  {
    id: 'plot-5',
    type: 'plot',
    name: 'Plantation Budi (8 ha)',
    country: 'Indonesia',
    commodity: 'Palm Oil',
    complianceStatus: 'non_compliant',
    farmerId: 'farmer-4',
    farmerName: 'Budi Santoso',
    plotSize: '8 ha',
  },
  {
    id: 'plot-6',
    type: 'plot',
    name: 'Finca Rodriguez (5 ha)',
    country: 'Colombia',
    commodity: 'Coffee',
    complianceStatus: 'compliant',
    farmerId: 'farmer-5',
    farmerName: 'Carlos Rodriguez',
    plotSize: '5 ha',
  },
  {
    id: 'plot-7',
    type: 'plot',
    name: 'Plot IC-205 (2.1 ha)',
    country: 'Ivory Coast',
    commodity: 'Cocoa',
    complianceStatus: 'pending',
    farmerId: 'farmer-6',
    farmerName: 'Aminata Diallo',
    plotSize: '2.1 ha',
  },
  {
    id: 'plot-8',
    type: 'plot',
    name: 'Rubber Estate VN-01 (12 ha)',
    country: 'Vietnam',
    commodity: 'Rubber',
    complianceStatus: 'compliant',
    farmerId: 'farmer-7',
    farmerName: 'Nguyen Van Minh',
    plotSize: '12 ha',
  },
];

const WIZARD_STEPS = [
  { label: 'Request Type', description: 'What are you requesting?' },
  { label: 'Recipients', description: 'Who should receive it?' },
  { label: 'Review & Send', description: 'Confirm and send' },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form state
  const [requestData, setRequestData] = useState<RequestTypeData>({
    requestType: null,
    commodity: '',
    dueDate: null,
    message: '',
  });

  const [recipientsData, setRecipientsData] = useState<RecipientsData>({
    selectedRecipients: [],
  });

  const handleCancel = () => {
    router.push('/requests');
  };

  const handleSend = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, this would call POST /api/requests
    // For now, redirect to requests page with success
    router.push('/requests?sent=1');
  };

  const handleSaveDraft = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, this would call POST /api/requests with status: draft
    router.push('/requests?draft=1');
  };

  const handleEditStep = (targetStep: number) => {
    setStep(targetStep);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0"
          >
            <Link href="/requests">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to requests</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">New Request</h1>
            <p className="text-sm text-muted-foreground">
              Create a new data request campaign
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Progress indicator */}
          <div className="mb-8">
            <WizardProgress currentStep={step} steps={WIZARD_STEPS} />
          </div>

          {/* Step content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && 'What type of request?'}
                {step === 2 && 'Select recipients'}
                {step === 3 && 'Review and send'}
              </CardTitle>
              <CardDescription>
                {step === 1 &&
                  'Choose the type of data you want to request and set optional parameters.'}
                {step === 2 &&
                  'Select organizations, farmers, or plots to receive this request.'}
                {step === 3 &&
                  'Review your request details before sending.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <StepRequestType
                  data={requestData}
                  onChange={setRequestData}
                  onNext={() => setStep(2)}
                  onCancel={handleCancel}
                />
              )}
              {step === 2 && (
                <StepSelectRecipients
                  data={recipientsData}
                  availableRecipients={MOCK_RECIPIENTS}
                  onChange={setRecipientsData}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <StepReviewSend
                  requestData={requestData}
                  recipientsData={recipientsData}
                  onEditStep={handleEditStep}
                  onSend={handleSend}
                  onSaveDraft={handleSaveDraft}
                  onBack={() => setStep(2)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
