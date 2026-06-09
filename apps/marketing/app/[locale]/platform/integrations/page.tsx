import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'platform-integrations',
  '/platform/integrations',
);

export { generateMetadata };
export default Page;
