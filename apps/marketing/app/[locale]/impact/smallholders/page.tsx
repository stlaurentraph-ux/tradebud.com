import { createDraftContentPage } from '@/lib/create-draft-page';

const { generateMetadata, Page } = createDraftContentPage(
  'impact-smallholders',
  '/impact/smallholders',
);

export { generateMetadata };
export default Page;
