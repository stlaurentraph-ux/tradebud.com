import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'solutions-regenerative-agriculture',
  '/solutions/regenerative-agriculture',
);

export { generateMetadata };
export default Page;
