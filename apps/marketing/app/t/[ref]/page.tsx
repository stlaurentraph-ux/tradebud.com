import { DeliveryIntakeTripPreviewPage } from '@/components/delivery-intake/delivery-intake-trip-preview-page';

export default async function MarketingDeliveryTripPreviewPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return <DeliveryIntakeTripPreviewPage refCode={ref.trim()} />;
}
