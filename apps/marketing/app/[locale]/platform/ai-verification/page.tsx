import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'platform-ai-verification',
  '/platform/ai-verification',
);

export { generateMetadata };
export default Page;
