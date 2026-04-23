'use client';

import Image from 'next/image';
import { CreateAccountWizard } from '@/components/auth/create-account-wizard';

export default function CreateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/tracebud-logo-v6.png" alt="Tracebud" width={64} height={64} className="mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-[#064E3B]">Tracebud</h1>
          <p className="text-sm text-muted-foreground">Commercial onboarding for EUDR teams</p>
        </div>
        <CreateAccountWizard />
      </div>
    </div>
  );
}
