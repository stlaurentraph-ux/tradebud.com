import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'platform-offline-mapping',
  '/platform/offline-mapping',
);

export { generateMetadata };
export default Page;
