import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'compliance-due-diligence',
  '/compliance/due-diligence',
);

export { generateMetadata };
export default Page;
