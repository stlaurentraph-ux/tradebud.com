import { AuthStatusCard } from '@/components/auth-status-card';

export default function HomePage() {
  return (
    <AuthStatusCard
      title="Tracebud field app"
      detail="OAuth and email confirmation for farmers using the Tracebud mobile app."
      footer="Open the Tracebud app on your phone and sign in from Settings."
    />
  );
}
