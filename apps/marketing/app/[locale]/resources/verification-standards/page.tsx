import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'resources-verification-standards',
  '/resources/verification-standards',
);

export { generateMetadata };
export default Page;
