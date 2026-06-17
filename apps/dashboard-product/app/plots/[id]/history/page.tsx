'use client';

import { useParams } from 'next/navigation';
import { PlotDetailHistoryPageContent } from '@/components/plots/plot-detail-history-page-content';

export default function PlotHistoryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return <PlotDetailHistoryPageContent plotId={id} />;
}
