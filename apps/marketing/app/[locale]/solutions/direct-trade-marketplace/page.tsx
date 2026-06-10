import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'solutions-direct-trade-marketplace',
  '/solutions/direct-trade-marketplace',
);

export { generateMetadata };
export default Page;
