import { redirect } from 'next/navigation';
import { mapToFounderOsUrl } from '@/lib/internal-tools';

export default function FounderOsAdminPage() {
  redirect(mapToFounderOsUrl('/founder-os') ?? '/');
}
