import { DeliveryIntakeDeliveryPreviewPage } from '@/components/delivery-intake/delivery-intake-delivery-preview-page';

export default async function MarketingDeliveryPreviewPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return <DeliveryIntakeDeliveryPreviewPage refCode={ref.trim()} />;
}
