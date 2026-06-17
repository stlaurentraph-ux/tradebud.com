'use client';

import { useParams } from 'next/navigation';
import { PlotDetailPageContent } from '@/components/plots/plot-detail-page-content';

export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return <PlotDetailPageContent plotId={id} />;
}
